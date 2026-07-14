import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appearance } from 'react-native';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: typeof lightColors;
}

const lightColors = {
  background: '#F0F4FF',
  surface: '#FFFFFF',
  surfaceSecondary: '#F8FAFC',
  primary: '#2563EB',
  primaryLight: '#DBEAFE',
  primaryDark: '#1E40AF',
  secondary: '#10B981',
  secondaryLight: '#D1FAE5',
  accent: '#F59E0B',
  text: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  border: '#E2E8F0',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  success: '#22C55E',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  card: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.08)',
  overlay: 'rgba(0, 0, 0, 0.4)',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
};

const darkColors = {
  background: '#0F172A',
  surface: '#1E293B',
  surfaceSecondary: '#334155',
  primary: '#3B82F6',
  primaryLight: '#1E3A5F',
  primaryDark: '#60A5FA',
  secondary: '#10B981',
  secondaryLight: '#1A3A2E',
  accent: '#F59E0B',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  border: '#334155',
  error: '#EF4444',
  errorLight: '#3B1414',
  success: '#22C55E',
  successLight: '#14321E',
  warning: '#F59E0B',
  warningLight: '#3B2F0E',
  card: '#1E293B',
  shadow: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.6)',
  tabBar: '#0F172A',
  tabBarBorder: '#334155',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const colorScheme = Appearance.getColorScheme();
    if (colorScheme === 'dark') setTheme('dark');
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const colors = theme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

export { lightColors, darkColors };
