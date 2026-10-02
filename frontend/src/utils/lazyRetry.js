import React, { lazy } from 'react';

/**
 * Enhanced React.lazy with automatic chunk load failure recovery.
 * Catches Vite dynamic import / chunk hashing mismatches after new deploys
 * or temporary network drops and automatically refreshes the page once
 * to fetch the latest assets instead of crashing into ErrorBoundary.
 *
 * @param {Function} componentImport - Dynamic import function, e.g. () => import('./MyComponent')
 * @param {string} [name='chunk'] - Component identifier for session tracking
 * @returns {React.LazyExoticComponent}
 */
export const lazyRetry = (componentImport, name = 'chunk') =>
  lazy(async () => {
    const sessionKey = `gtrams_chunk_retry_${name}`;
    try {
      const component = await componentImport();
      // Clear flag upon successful load
      try {
        sessionStorage.removeItem(sessionKey);
      } catch {}
      return component;
    } catch (error) {
      const msg = String(error?.message || error || '').toLowerCase();
      const isChunkError =
        msg.includes('dynamically imported module') ||
        msg.includes('loading chunk') ||
        msg.includes('failed to fetch') ||
        msg.includes('failed to load module script') ||
        msg.includes('importing a module script failed') ||
        error?.name === 'ChunkLoadError';

      let alreadyRetried = false;
      try {
        alreadyRetried = Boolean(sessionStorage.getItem(sessionKey));
      } catch {}

      if (isChunkError && !alreadyRetried) {
        try {
          sessionStorage.setItem(sessionKey, 'true');
        } catch {}
        // Force server reload to fetch updated index.html & chunks
        window.location.reload();
        // Return unresolved promise to prevent ErrorBoundary flash while page reloads
        return new Promise(() => {});
      }

      // If already retried or not a chunk error, let ErrorBoundary handle it
      throw error;
    }
  });

export default lazyRetry;
