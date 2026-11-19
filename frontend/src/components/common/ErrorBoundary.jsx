import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, isChunkError: false };
  }

  static getDerivedStateFromError(error) {
    const msg = String(error?.message || error || '').toLowerCase();
    const isChunkError =
      msg.includes('dynamically imported module') ||
      msg.includes('loading chunk') ||
      msg.includes('failed to fetch') ||
      msg.includes('failed to load module script') ||
      msg.includes('importing a module script failed') ||
      error?.name === 'ChunkLoadError';

    return { hasError: true, error, isChunkError };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    const msg = String(error?.message || error || '').toLowerCase();
    const isChunk =
      msg.includes('dynamically imported module') ||
      msg.includes('loading chunk') ||
      msg.includes('failed to fetch') ||
      msg.includes('failed to load module script') ||
      msg.includes('importing a module script failed') ||
      error?.name === 'ChunkLoadError';

    if (isChunk) {
      try {
        const lastAutoReload = sessionStorage.getItem('gtrams_eb_auto_reload');
        const now = Date.now();
        // If not auto-reloaded within 15 seconds, reload automatically to get fresh chunks
        if (!lastAutoReload || now - parseInt(lastAutoReload, 10) > 15000) {
          sessionStorage.setItem('gtrams_eb_auto_reload', String(now));
          window.location.reload();
        }
      } catch {}
    }
  }

  render() {
    if (this.state.hasError) {
      const isChunk = this.state.isChunkError;

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F6F5F3] dark:bg-[#14110F] p-4 text-center">
          <div className="bg-white dark:bg-[#1C1917] p-7 sm:p-8 rounded-xl shadow-lg border border-[#E4E1DC] dark:border-[#2E2A27] max-w-md w-full">
            <h1 className="text-xl font-bold text-[#9E2A2B] dark:text-[#F6F5F3] tracking-[-0.02em] mb-2">
              {isChunk ? 'New Update Available' : 'Something went wrong.'}
            </h1>
            <p className="text-sm text-[#6B6761] dark:text-[#A8A29E] mb-4 leading-relaxed">
              {isChunk
                ? 'A new version of G-TRAMS has been deployed. Please refresh the page to load the latest update.'
                : 'An unexpected error occurred in the application.'}
            </p>
            {this.state.error?.message && !isChunk && (
              <details className="mb-5 text-left p-3 rounded-lg bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] text-xs text-[#B91C1C] dark:text-red-400">
                <summary className="cursor-pointer font-bold select-none">Show Error Details</summary>
                <p className="mt-2 font-mono break-all leading-relaxed whitespace-pre-wrap">{String(this.state.error?.message || this.state.error)}</p>
              </details>
            )}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button 
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] bg-[#9E2A2B] hover:bg-[#7A1B22] dark:bg-[#D4AF37] dark:hover:bg-[#c29e2f] text-white dark:text-[#14110F] font-bold text-sm rounded-lg transition-colors cursor-pointer"
              >
                Refresh Page
              </button>
              <button 
                onClick={() => {
                  try {
                    localStorage.removeItem('token');
                    localStorage.removeItem('role');
                    localStorage.removeItem('name');
                  } catch {}
                  window.location.href = '/login';
                }}
                className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] bg-[#F6F5F3] hover:bg-[#E4E1DC] dark:bg-[#2E2A27] dark:hover:bg-[#3D3834] border border-[#E4E1DC] dark:border-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] font-bold text-sm rounded-lg transition-colors cursor-pointer"
              >
                Sign In Again
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
