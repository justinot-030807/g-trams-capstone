const GOOGLE_IDENTITY_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

let scriptLoad;

export function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (scriptLoad) return scriptLoad;

  scriptLoad = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GOOGLE_IDENTITY_SCRIPT_URL}"]`);
    const script = existing || document.createElement('script');

    const cleanup = () => {
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
    };
    const onError = () => {
      cleanup();
      script.remove();
      reject(new Error('Google Identity Services could not load.'));
    };
    const onLoad = () => {
      const identity = window.google?.accounts?.id;
      if (!identity) return onError();
      cleanup();
      resolve(identity);
    };

    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);
    if (!existing) {
      script.src = GOOGLE_IDENTITY_SCRIPT_URL;
      script.async = true;
      document.body.appendChild(script);
    }
  }).catch((error) => {
    scriptLoad = undefined;
    throw error;
  });

  return scriptLoad;
}
