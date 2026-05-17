export const colors = {
  // Modern Minimalist Banking Palette (Sage Green)
  primary: '#4CAF7D', // Main Green
  primaryLight: '#A8D5BA', // Soft Green
  primaryDark: '#388E3C', // Darker Green for text/active
  secondary: '#E8F5E9', // Ultra Pale Green/Surface
  accent: '#A8D5BA',

  background: '#F5F5F5', // Off-white/Gray
  backgroundGradient: ['#E8F5E9', '#FFFFFF'], // Gradient for background

  surface: '#FFFFFF', // Pure White
  surfaceSubtle: '#FAFAFA',

  text: '#1A1A1A', // Dark Gray/Black
  textSubtle: '#666666', // Muted Gray
  textOnPrimary: '#FFFFFF',

  border: '#E0E0E0', // Subtle light border
  success: '#4CAF50',
  error: '#FF5252',
  warning: '#FFC107',
};

export const spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  fontFamily: 'System',
  sizes: {
    xs: 12,
    s: 14,
    m: 16,
    l: 18,
    xl: 24,
    xxl: 32,
    huge: 40,
  },
  weights: {
    regular: '400',
    medium: '500',
    bold: '700',
    black: '900',
  },
};

export const appStyles = {
  // Modern Minimalist specific styles
  elevation: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  pill: {
    borderRadius: 999,
  },
  card: {
    borderRadius: 24,
  },
  border: {
    borderWidth: 1,
    borderColor: colors.border,
  }
};
