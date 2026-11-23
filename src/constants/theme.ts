export const Colors = {
  light: {
    text: '#11181C',
    textSecondary: '#60646C',
    background: '#FFFFFF',
    tile: '#F0F0F3',
    tilePressed: '#E0E1E6',
    accent: '#208AEF',
    warning: '#E5484D',
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#B0B4BA',
    background: '#000000',
    tile: '#212225',
    tilePressed: '#2E3135',
    accent: '#4FA3F7',
    warning: '#FF6369',
  },
} as const;

export type ThemeColors = (typeof Colors)['light'] | (typeof Colors)['dark'];

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const Radius = {
  md: 12,
  lg: 16,
} as const;
