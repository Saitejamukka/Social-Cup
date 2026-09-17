// Warm, natural specialty-coffee palette: Cream background, Espresso text, Olive as the
// primary accent, Pistachio/Pale Pistachio for soft cards and section backgrounds.
export const lightColors = {
  background: '#F9F5EA', // Cream
  surface: '#FFFFFF',
  panel: '#E8EBD9', // Pale Pistachio
  ink: '#352A24', // Espresso
  gold: '#687451', // Olive — primary accent (kept the `gold` key to avoid touching every call site)
  goldDark: '#4E5A3F', // Darker Olive, for pressed/emphasis states
  line: '#DEE3C9', // Soft sage border, between Cream and Pistachio
  mute: '#6F6555', // Muted warm brown-olive, for secondary text
  pale: '#A39C87', // Lighter warm tan-gray, for placeholders/tertiary text
  success: '#4F7A3E',
  successBg: '#E8EBD9', // Pale Pistachio
  danger: '#B84C3E',
  dangerBg: '#F6E3DF',
  white: '#FFFFFF',

  // Full-bleed dark moments (redemption success screen, the Visitor "become a
  // member" promo card) — Espresso doubles as the palette's dark tone.
  darkBg: '#352A24',

  demoBorder: '#C9D1B3',
  rowBorder: '#F1ECDF',
};

// Same warm coffee identity, inverted for a night/espresso-bar feel rather than
// a flat black-and-white "invert everything" dark mode — a deep warm brown
// background (not pure black), cream ink, and the olive accent lifted a shade
// brighter so it still reads clearly against the dark surfaces.
export const darkColors: typeof lightColors = {
  background: '#1E1812',
  surface: '#2A231C',
  panel: '#332B22',
  ink: '#F3EFE4',
  gold: '#9CB47E',
  goldDark: '#B7C49A',
  line: '#43392C',
  mute: '#B6AC97',
  pale: '#8A8071',
  success: '#8FBF71',
  successBg: '#2C3324',
  danger: '#E08A78',
  dangerBg: '#3A2620',
  white: '#FFFFFF',

  darkBg: '#100C08',

  demoBorder: '#4A4030',
  rowBorder: '#2A2318',
};

export type ColorPalette = typeof lightColors;

// Kept as the default/static export so any screen not yet wired up to
// useTheme() still compiles and renders (always in the light palette) rather
// than breaking — see src/theme/ThemeContext.tsx for the live, switchable version.
export const Colors = lightColors;
