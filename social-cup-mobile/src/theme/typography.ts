// Cormorant Garamond for headings (elegant, editorial serif), Inter for everything else —
// both are static per-weight font files, so pair each with the matching fontWeight value
// only where React Native needs it for layout math, not for the visual weight itself
// (the file IS that weight).
export const Fonts = {
  display: 'CormorantGaramond_600SemiBold',
  displayBold: 'CormorantGaramond_700Bold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
} as const;
