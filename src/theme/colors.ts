import { Dimensions } from 'react-native';

const BASE_WIDTH = 375;
const screenWidth = Dimensions.get('window').width;
const fontScale = Math.min(Math.max(screenWidth / BASE_WIDTH, 0.85), 1.3);

function scaleFont(size: number): number {
  return Math.round(size * fontScale);
}

export const colors = {
  bg: '#050505',
  bgSecondary: '#0E0E0F',
  card: '#151515',
  cardElevated: '#202023',
  primary: '#FF7A1A',
  primaryLight: '#FF8A3D',
  primaryDark: '#E86A0F',
  primaryGradientStart: '#FF6B2B',
  primaryGradientEnd: '#FF9F45',
  text: '#FFFFFF',
  textSecondary: '#A7A7A7',
  textMuted: '#6F6F6F',
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.12)',
  success: '#34C759',
  warning: '#FFB020',
  error: '#FF453A',
  info: '#5AC8FA',
  tabActive: '#FF7A1A',
  tabInactive: '#6F6F6F',
  overlay: 'rgba(0,0,0,0.6)',
  skeleton: '#1A1A1C',
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const fontSize = {
  xs: scaleFont(12),
  sm: scaleFont(14),
  md: scaleFont(16),
  lg: scaleFont(18),
  xl: scaleFont(22),
  xxl: scaleFont(28),
  title: scaleFont(32),
  hero: scaleFont(38),
  giant: scaleFont(52),
};

export const borderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 22,
  card: 24,
  bigCard: 28,
  sheet: 30,
  full: 999,
};

export const buttonHeight = {
  sm: 44,
  md: 50,
  lg: 56,
};

export const cardPadding = {
  sm: 12,
  md: 16,
  lg: 20,
};

export const typography = {
  fontFamily: 'Lexend_400Regular',
  weight: {
    regular: 'Lexend_400Regular',
    medium: 'Lexend_500Medium',
    semiBold: 'Lexend_600SemiBold',
    bold: 'Lexend_700Bold',
    extraBold: 'Lexend_800ExtraBold',
    black: 'Lexend_900Black',
  },
};
