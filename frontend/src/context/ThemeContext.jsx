import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {}
});

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark') return 'dark';
      if (saved === 'light') return 'light';
    }
    return 'light';
  });

  const applyTheme = (newTheme) => {
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = async (newTheme) => {
    const normalized = newTheme === 'dark' ? 'dark' : 'light';
    setThemeState(normalized);
    applyTheme(normalized);

    // Sync preference with backend if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ theme: normalized })
        });
      } catch (err) {
        console.error('Failed to sync theme with backend:', err);
      }
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export default ThemeContext;
