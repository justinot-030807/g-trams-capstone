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
          fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
          borderRadius: '10px',
        },
      }}
    />
  );
}
