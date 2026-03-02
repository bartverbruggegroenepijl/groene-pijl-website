export const colors = {
  primary: '#00A651',
  primaryDark: '#0B3D2E',
  black: '#111111',
  lightGray: '#F5F5F5',
  white: '#FFFFFF',
} as const;

export const fonts = {
  heading: 'Bebas Neue',
  body: 'Inter',
} as const;

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
} as const;

export const borderRadius = {
  sm: '0.25rem',
  md: '0.5rem',
  lg: '1rem',
  full: '9999px',
} as const;

export type Colors = typeof colors;
export type Fonts = typeof fonts;
