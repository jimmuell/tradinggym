import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ChartTheme = 'dark' | 'light' | 'trading';

interface SettingsContextType {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  chartTheme: ChartTheme;
  setChartTheme: (v: ChartTheme) => void;
}

const SettingsContext = createContext<SettingsContextType>({
  darkMode: true,
  setDarkMode: () => {},
  chartTheme: 'dark',
  setChartTheme: () => {},
});

export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('tg-dark-mode');
    return stored !== null ? stored === 'true' : true;
  });

  const [chartTheme, setChartTheme] = useState<ChartTheme>(() => {
    return (localStorage.getItem('tg-chart-theme') as ChartTheme) || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('tg-dark-mode', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('tg-chart-theme', chartTheme);
  }, [chartTheme]);

  return (
    <SettingsContext.Provider value={{ darkMode, setDarkMode, chartTheme, setChartTheme }}>
      {children}
    </SettingsContext.Provider>
  );
}
