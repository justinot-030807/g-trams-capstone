import React from 'react';
import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from '@/context/ThemeContext';

/**
 * Theme-synchronized Sonner toast container styled strictly with G-TRAMS heritage tokens.
 */
export function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <SonnerToaster
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        style: {
          fontFamily: '"Manrope", system-ui, -apple-system, sans-serif',
          borderRadius: '12px',
          border: resolvedTheme === 'dark' ? '1px solid #2E2A27' : '1px solid #E4E1DC',
        },
      }}
    />
  );
}
