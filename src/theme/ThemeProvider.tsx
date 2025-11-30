import React, { createContext, useContext, useEffect, useState } from 'react';
import { Storage } from '@plasmohq/storage';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const storage = new Storage();

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('light');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const [isReady, setIsReady] = useState(false);

  // Get system theme preference
  const getSystemTheme = (): ResolvedTheme => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  // Resolve the actual theme to apply
  const resolveTheme = (themeValue: Theme): ResolvedTheme => {
    if (themeValue === 'system') {
      return getSystemTheme();
    }
    return themeValue;
  };

  // Apply theme to document
  const applyTheme = (themeToApply: ResolvedTheme) => {
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove('light', 'dark');

    // Add new theme class
    root.classList.add(themeToApply);

    setResolvedTheme(themeToApply);
  };

  // Set theme and persist to storage
  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);

    // Update storage
    try {
      const userSettings = await storage.get<any>('userSettings') || {};
      await storage.set('userSettings', {
        ...userSettings,
        theme: newTheme
      });
    } catch (error) {
      console.error('[ThemeProvider] Failed to save theme:', error);
    }

    // Apply the resolved theme
    applyTheme(resolveTheme(newTheme));
  };

  // Initialize theme from storage
  useEffect(() => {
    const initTheme = async () => {
      try {
        const userSettings = await storage.get<any>('userSettings');
        const savedTheme = userSettings?.theme || 'light';

        setThemeState(savedTheme);
        applyTheme(resolveTheme(savedTheme));
        setIsReady(true);
      } catch (error) {
        console.error('[ThemeProvider] Failed to load theme:', error);
        setThemeState('light');
        applyTheme('light');
        setIsReady(true);
      }
    };

    initTheme();
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const systemTheme = e.matches ? 'dark' : 'light';
      applyTheme(systemTheme);
    };

    // Initial check
    handleChange(mediaQuery);

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme]);

  // Listen for storage changes (in case theme is changed from another tab/context)
  useEffect(() => {
    const unwatch = storage.watch({
      'userSettings': (change) => {
        const newSettings = change.newValue as any;
        const newTheme = newSettings?.theme;

        if (newTheme && newTheme !== theme) {
          setThemeState(newTheme);
          applyTheme(resolveTheme(newTheme));
        }
      }
    });

    return () => {
      if (unwatch) unwatch();
    };
  }, [theme]);

  if (!isReady) {
    return null; // or a loading spinner
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
