import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'mint' | 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('sfr_theme');
    if (saved === 'dark' || saved === 'light' || saved === 'mint') return saved as Theme;
    return 'mint'; // Soft Mint Aqua Glassmorphism by default
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-mint', 'theme-light', 'dark');

    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else if (theme === 'light') {
      root.classList.add('theme-light');
      root.style.colorScheme = 'light';
    } else {
      // Default: Soft Mint Aqua Glassmorphism
      root.classList.add('theme-mint');
      root.style.colorScheme = 'light';
    }
    localStorage.setItem('sfr_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'dark' ? 'mint' : 'dark'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
