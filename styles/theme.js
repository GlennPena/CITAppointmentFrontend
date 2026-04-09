export const Colors = {
  primary: '#2563EB',
  primaryLight: '#DBEAFE',
  primaryDark: '#1D4ED8',
  secondary: '#4F46E5',
  accent: '#14B8A6',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#64748B',
  textInverse: '#FFFFFF',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  muted: '#CBD5E1',
  glassWhite: 'rgba(255, 255, 255, 0.92)',
};

export const Spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
};

export const Shadows = {
  low: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  high: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
};

export const Typography = {
  header: {
    fontFamily: 'Inter_900Black',
    fontWeight: '800',
    fontSize: 40,
    letterSpacing: -0.5,
  },
  caption: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  body: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 22,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 24,
  },
};