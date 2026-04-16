import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type AppTheme = 'dark' | 'light' | 'system';
export type ChartTheme = 'dark' | 'light' | 'trading';

interface SettingsContextType {
  theme: AppTheme;
  setTheme: (v: AppTheme) => void;
  chartTheme: ChartTheme;
  setChartTheme: (v: ChartTheme) => void;
}

const SettingsContext = createContext<SettingsContextType>({
  theme: 'dark',
  setTheme: () => {},
  chartTheme: 'dark',
  setChartTheme: () => {},
});

// eslint-disable-next-line react-refresh/only-export-components
export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem('tg-theme') as AppTheme) || 'dark';
  });

  const [chartTheme, setChartTheme] = useState<ChartTheme>(() => {
    return (localStorage.getItem('tg-chart-theme') as ChartTheme) || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (resolved: 'dark' | 'light') => {
      if (resolved === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mq.matches ? 'dark' : 'light');
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches ? 'dark' : 'light');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } else {
      applyTheme(theme);
    }

    localStorage.setItem('tg-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('tg-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('tg-chart-theme', chartTheme);
  }, [chartTheme]);

  return (
    <SettingsContext.Provider value={{ theme, setTheme, chartTheme, setChartTheme }}>
      {children}
    </SettingsContext.Provider>
  );
}
