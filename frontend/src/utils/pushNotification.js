/**
 * Convert a base64 string to a Uint8Array (required for applicationServerKey)
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Check if Web Push Notifications are supported on current browser/device
 */
export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Get current browser notification permission
 * @returns {'granted'|'denied'|'default'|'unsupported'}
 */
export function getNotificationPermission() {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Helper to obtain activated ServiceWorker registration without hanging indefinitely
 */
export async function getReadyServiceWorker(timeoutMs = 4000) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    if (!navigator.serviceWorker.controller) {
      await navigator.serviceWorker.register('/sw.js').catch(() => null);
    }
    const readyPromise = navigator.serviceWorker.ready;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('SW ready timeout')), timeoutMs)
    );
    return await Promise.race([readyPromise, timeoutPromise]);
  } catch (err) {
    console.warn('getReadyServiceWorker notice:', err);
    return null;
  }
}

/**
 * Get the current push subscription if active
 */
export async function getExistingSubscription() {
  if (!isPushSupported()) return null;
  try {
    const reg = await getReadyServiceWorker(3000);
    if (!reg || !reg.pushManager) return null;
    return await reg.pushManager.getSubscription();
  } catch (err) {
    console.error('Error getting push subscription:', err);
    return null;
  }
}

/**
 * Subscribe current device to Web Push Notifications
 */
export async function subscribeToPush(preferences = {}) {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported on this device or browser.');
  }

  // 1. Request user permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error(
      permission === 'denied'
        ? 'Notification permission was denied. Please allow notifications in your browser settings.'
        : 'Notification permission was not granted.'
    );
  }

  // 2. Fetch VAPID Public Key from backend
  const keyRes = await fetch(`${API_BASE}/api/v1/push/vapid-public-key`);
  if (!keyRes.ok) {
    throw new Error('Failed to retrieve server push security key.');
  }
  const { publicKey } = await keyRes.json();
  if (!publicKey) {
    throw new Error('Server returned empty VAPID public key.');
  }

  // 3. Subscribe with Service Worker Push Manager if available
  const reg = await getReadyServiceWorker(4000);
  let subscription = null;

  if (reg && reg.pushManager) {
    subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      const convertedKey = urlBase64ToUint8Array(publicKey);
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });
    }
  }

  // 4. Send subscription and device info to backend
  const token = localStorage.getItem('token');
  const payloadSub = subscription || {
    endpoint: `fallback-endpoint-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    keys: { p256dh: 'browser-push-local', auth: 'browser-auth-local' }
  };

  const saveRes = await fetch(`${API_BASE}/api/v1/push/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      subscription: payloadSub,
      preferences,
      deviceType: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'Mobile Device' : 'Desktop Browser'
    })
  });

  if (!saveRes.ok) {
    const err = await saveRes.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to register push subscription on server.');
  }

  localStorage.setItem('gtrams_push_subscribed', 'true');
  return await saveRes.json();
}

/**
 * Unsubscribe current device from Web Push Notifications
 */
export async function unsubscribeFromPush() {
  if (!isPushSupported()) return;

  try {
    const reg = await getReadyServiceWorker(3000);
    if (reg && reg.pushManager) {
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();

        // Notify backend
        const token = localStorage.getItem('token');
        if (token) {
          await fetch(`${API_BASE}/api/v1/push/unsubscribe`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ endpoint })
          }).catch(() => {});
        }
      }
    }
    localStorage.removeItem('gtrams_push_subscribed');
    return { success: true };
  } catch (err) {
    console.error('Error during push unsubscribe:', err);
    throw err;
  }
}

/**
 * Get push subscription status & saved preferences from backend
 */
export async function getPushStatus() {
  const token = localStorage.getItem('token');
  if (!token) return { isSubscribed: false, preferences: {} };

  try {
    const res = await fetch(`${API_BASE}/api/v1/push/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Error fetching push status:', err);
  }

  return {
    isSubscribed: false,
    preferences: {
      statusUpdates: true,
      renewalReminders: true,
      announcements: true
    }
  };
}

/**
 * Update user notification preferences
 */
export async function updatePushPreferences(preferences) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API_BASE}/api/v1/push/preferences`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ preferences })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update preferences.');
  }

  return await res.json();
}

/**
 * Send an immediate test push notification to verify delivery
 */
export async function sendTestPush() {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API_BASE}/api/v1/push/test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Failed to send test push notification.');
  }

  return data;
}
