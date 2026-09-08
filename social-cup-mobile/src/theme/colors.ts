// Warm, natural specialty-coffee palette: Cream background, Espresso text, Olive as the
// primary accent, Pistachio/Pale Pistachio for soft cards and section backgrounds.
export const Colors = {
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
