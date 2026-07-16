// ─────────────────────────────────────────────────────────────────────────────
// UACIT Appointment System — Design Tokens
// Single source of truth for all colors, spacing, radius, shadows & typography.
// ─────────────────────────────────────────────────────────────────────────────

export const Colors = {
  // ── Brand ──────────────────────────────────────────────────────────────────
  primary: '#002366',   // Deep Navy — primary brand
  primaryHover: '#002D80',
  primaryLight: '#EEF2FF',
  primaryMid: '#3B5BDB',
  gold: '#C9A84C',   // UA Gold accent
  goldLight: '#FDF6E3',

  // ── Navy shades ────────────────────────────────────────────────────────────
  navy50: '#F0F4FF',
  navy100: '#D9E3FF',
  navy200: '#ADBFFF',
  navy500: '#3B5BDB',
  navy700: '#002D80',
  navy900: '#001540',

  // ── Neutrals ───────────────────────────────────────────────────────────────
  white: '#FFFFFF',
  black: '#0A0F1E',

  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1E293B',
  slate900: '#0F172A',

  // ── Semantic ───────────────────────────────────────────────────────────────
  success: '#059669',
  successLight: '#D1FAE5',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  info: '#0EA5E9',
  infoLight: '#E0F2FE',

  // ── Surfaces ───────────────────────────────────────────────────────────────
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceMuted: '#F8FAFC',
  border: '#E2E8F0',
  borderFocus: '#002366',

  // ── Glass / overlay ────────────────────────────────────────────────────────
  overlay: 'rgba(0,0,0,0.45)',
  glassWhite: 'rgba(255, 255, 255, 0.92)',
  glassNavy: 'rgba(0, 35, 102, 0.08)',

  // ── Text ───────────────────────────────────────────────────────────────────
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',
};

export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
};

export const Shadows = {
  none: {},
  xs: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 8,
  },
  xl: {
    shadowColor: '#002366',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
    elevation: 12,
  },
  // Legacy aliases
  low: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  medium: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 6 },
  high: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 10 },
};

export const Typography = {
  header: {
    fontFamily: 'Inter_900Black',
    fontWeight: '800',
    fontSize: 40,
    letterSpacing: -1,
    color: '#0F172A',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 24,
    letterSpacing: -0.3,
    color: '#0F172A',
  },
  subtitle: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    fontSize: 18,
    letterSpacing: -0.2,
    color: '#1E293B',
  },
  body: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: '#334155',
  },
  bodySmall: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: '#475569',
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontWeight: '700',
    fontSize: 11,
    lineHeight: 16,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: '#64748B',
  },
  caption: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#94A3B8',
  },
  mono: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 13,
    letterSpacing: 0.5,
  },
};