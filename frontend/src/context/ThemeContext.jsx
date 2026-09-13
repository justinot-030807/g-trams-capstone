import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'system',
  resolvedTheme: 'light',
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {}
});

export const ThemeProvider = ({ children }) => {
  // theme can be: 'light', 'dark', 'system'
  const [theme, setThemeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark' || saved === 'light' || saved === 'system') {
        return saved;
      }
    }
    return 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark') return 'dark';
      if (saved === 'light') return 'light';
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Apply theme to document element and listen for OS/Phone preference changes
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateTheme = () => {
      let active = 'light';
      if (theme === 'system') {
        active = mediaQuery.matches ? 'dark' : 'light';
      } else {
        active = theme === 'dark' ? 'dark' : 'light';
      }

      setResolvedTheme(active);

      if (active === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    updateTheme();

    // Listen for phone/OS preference changes in real-time
    const handleSystemChange = () => {
      if (theme === 'system') {
        updateTheme();
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange);
    } else {
      mediaQuery.addListener(handleSystemChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemChange);
      } else {
        mediaQuery.removeListener(handleSystemChange);
      }
    };
  }, [theme]);

  const setTheme = async (newTheme) => {
    const valid = ['light', 'dark', 'system'].includes(newTheme) ? newTheme : 'system';
    setThemeState(valid);
    localStorage.setItem('theme', valid);

    // Sync preference with backend if logged in
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ theme: valid })
        });
      } catch (err) {
        console.error('Failed to sync theme with backend:', err);
      }
    }
  };

  // Toggle cycles through: light -> dark -> system -> light
  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      resolvedTheme, 
      setTheme, 
      toggleTheme, 
      isDark: resolvedTheme === 'dark' 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export default ThemeContext;
