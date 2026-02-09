export const colors = {
  // Neo-Brutalism Palette
  primary: '#FF5A5F', // Vibrant Red/Pink
  secondary: '#3D5AFE', // Electric Blue
  accent: '#FFD600', // Bright Yellow
  background: '#F0F0F0', // Light Gray
  surface: '#FFFFFF', // White
  text: '#1A1A1A', // Nearly Black
  border: '#000000', // Pure Black for borders
  success: '#00E676', // Bright Green
  error: '#FF1744', // Red
  warning: '#FF9100', // Orange
};

export const spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 40,
};

export const typography = {
  fontFamily: 'System', // Use system font for now, could be replaced with custom font
  sizes: {
    xs: 12,
    s: 14,
    m: 16,
    l: 20,
    xl: 24,
    xxl: 32,
  },
  weights: {
    regular: '400',
    bold: '700',
    black: '900',
  },
};

export const neoStyles = {
  // Neo-Brutalism specific styles
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4, // For Android
  },
  border: {
    borderWidth: 2,
    borderColor: '#000',
  },
  pill: {
    borderRadius: 999,
  },
  card: {
    borderRadius: 16,
  },
};
