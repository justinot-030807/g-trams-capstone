import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import OperatorBottomNav from './operator/OperatorBottomNav';
import ChatWidget from './operator/ChatWidget';

const MainLayout = ({ children, hideNav = false }) => {
  // Elastic Rubber-band Overscroll Touch Stretch Effect for mobile
  const [stretchOffset, setStretchOffset] = useState(0);
  const [isStretching, setIsStretching] = useState(false);
  const touchStartY = useRef(0);
  const isAtEdge = useRef(false);
  // Default closed on mobile, open on desktop
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 768) return false;
      const saved = localStorage.getItem('gtrams_sidebar_open');
      if (saved !== null) return JSON.parse(saved);
      return true;
    }
    return true;
  });

  const role = String(localStorage.getItem('role') || '').toLowerCase().trim().replace(/_/g, ' ');
  const isOperator = role === 'operator';
  const isTodaPresident = role === 'toda president' || role === 'toda_president';
  const showBottomNav = isOperator || isTodaPresident;

  // Reset body classes when entering main layout
  useEffect(() => {
    document.documentElement.classList.remove('auth-view');
    document.body.classList.remove('auth-view');
  }, []);

  // Ensure sidebar is closed on mobile when bottom navigation is active
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && showBottomNav) {
        setIsSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showBottomNav]);

  // Real-time user heartbeat ping
  useEffect(() => {
    const sendHeartbeat = () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
      if (!baseUrl) return;

      // Primary: Heartbeat endpoint
      fetch(`${baseUrl}/api/v1/auth/heartbeat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      })
      .then(res => {
        // Fallback: If heartbeat returned 404 (e.g. backend awaiting fresh redeploy), touch profile to update MongoDB updatedAt
        if (res.status === 404) {
          fetch(`${baseUrl}/api/v1/auth/profile`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ language: localStorage.getItem('gtrams_lang') || 'en' }),
            cache: 'no-store'
          }).catch(() => {});
        }
      })
      .catch(() => {
        fetch(`${baseUrl}/api/v1/auth/profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ language: localStorage.getItem('gtrams_lang') || 'en' }),
          cache: 'no-store'
        }).catch(() => {});
      });
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 15000);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') sendHeartbeat();
    };

    window.addEventListener('focus', sendHeartbeat);
    window.addEventListener('pageshow', sendHeartbeat);
    window.addEventListener('online', sendHeartbeat);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', sendHeartbeat);
      window.removeEventListener('pageshow', sendHeartbeat);
      window.removeEventListener('online', sendHeartbeat);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  // Native-feel touch stretch event listener
  const stretchRef = useRef({ offset: 0, isStretching: false });
  useEffect(() => {
    const handleTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      touchStartY.current = e.touches[0].clientY;
      const isTop = window.scrollY <= 2;
      const isBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 5;
      isAtEdge.current = isTop || isBottom;
    };

    const handleTouchMove = (e) => {
      if (!isAtEdge.current || e.touches.length !== 1) return;
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - touchStartY.current;

      const isTop = window.scrollY <= 2;
      const isBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 5;

      if (isTop && deltaY > 0) {
        // Pulling down past top edge
        const stretch = Math.min(Math.pow(deltaY, 0.72) * 0.55, 45);
        setStretchOffset(stretch);
        stretchRef.current = { offset: stretch, isStretching: true };
        setIsStretching(true);
      } else if (isBottom && deltaY < 0) {
        // Pulling up past bottom edge
        const stretch = -Math.min(Math.pow(Math.abs(deltaY), 0.72) * 0.55, 45);
        setStretchOffset(stretch);
        stretchRef.current = { offset: stretch, isStretching: true };
        setIsStretching(true);
      } else {
        if (stretchRef.current.offset !== 0) {
          setStretchOffset(0);
          stretchRef.current = { offset: 0, isStretching: false };
          setIsStretching(false);
        }
      }
    };

    const handleTouchEnd = () => {
      if (stretchRef.current.isStretching || stretchRef.current.offset !== 0) {
        setStretchOffset(0);
        stretchRef.current = { offset: 0, isStretching: false };
        setIsStretching(false);
      }
      isAtEdge.current = false;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []); // Run only once on mount to prevent listener detach/reattach thrashing

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => {
      const nextState = !prev;
      if (window.innerWidth >= 768) {
        localStorage.setItem('gtrams_sidebar_open', JSON.stringify(nextState));
      }
      return nextState;
    });
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    if (window.innerWidth >= 768) {
      localStorage.setItem('gtrams_sidebar_open', JSON.stringify(false));
    }
  };

  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (hideNav) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200 print:bg-white print:text-black">
        {isOffline && (
          <div className="bg-red-600 text-white text-center py-2 px-4 text-[11px] font-bold z-50 shadow-md">
            ⚠️ Offline ka ngayon. Limitado ang ibang features.
          </div>
        )}
        <main className="flex-1 w-full flex flex-col">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-200 overscroll-y-contain print:bg-white print:text-black print:block print:min-h-0">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={closeSidebar} 
      />

      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out print:ml-0 print:p-0 print:m-0 print:w-full print:block ${
          isSidebarOpen ? 'md:ml-64' : 'md:ml-20'
        }`}
      >
        <TopNavbar 
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar} 
        />

        {isOffline && (
          <div className="bg-red-600 text-white text-center py-2 px-4 text-[11px] font-bold z-50 shadow-md animate-in slide-in-from-top-2">
            ⚠️ Nawalan ng internet connection. Subukang i-refresh pag bumalik ang signal.
          </div>
        )}

        <main 
          style={stretchOffset !== 0 ? {
            transform: `translateY(${stretchOffset}px) scaleY(${1 + Math.abs(stretchOffset) / 800})`,
            transformOrigin: stretchOffset >= 0 ? 'top center' : 'bottom center',
            transition: isStretching ? 'none' : 'transform 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          } : undefined}
          className={`p-3.5 sm:p-6 lg:p-8 flex-1 overflow-x-hidden print:p-0 print:m-0 print:overflow-visible print:block ${stretchOffset !== 0 ? 'will-change-transform' : ''} ${showBottomNav ? 'pb-28 sm:pb-24 md:pb-8' : ''}`}
        >
          <div className="w-full print:max-w-full print:m-0 print:p-0 print:w-full transition-all duration-200">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation for Operator and TODA President */}
      <ChatWidget />
      {showBottomNav && (
        <OperatorBottomNav role={role} />
      )}
    </div>
  );
};

export default MainLayout;
