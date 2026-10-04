import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  resolvedTheme: 'light',
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {}
});

export const ThemeProvider = ({ children }) => {
  // theme can be strictly: 'light' or 'dark'
  const [theme, setThemeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
    }
    return 'light';
  });

  const [resolvedTheme, setResolvedTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark') return 'dark';
    }
    return 'light';
  });

  // Apply theme to document element
  useEffect(() => {
    const root = document.documentElement;
    const active = theme === 'dark' ? 'dark' : 'light';

    setResolvedTheme(active);

    if (active === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const setTheme = async (newTheme) => {
    const valid = newTheme === 'dark' ? 'dark' : 'light';
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

  // Direct toggle between light <-> dark
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
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
