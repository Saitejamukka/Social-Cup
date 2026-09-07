// Source Serif 4 for headings (elegant, editorial), Work Sans for everything else.
// Both are static per-weight font files — pair each with the matching fontWeight
// value only where React Native needs it for layout math, not for the visual
// weight itself (the file IS that weight).
export const Fonts = {
  display: 'SourceSerif4_600SemiBold',
  displayBold: 'SourceSerif4_700Bold',
  body: 'WorkSans_400Regular',
  bodyMedium: 'WorkSans_500Medium',
  bodySemiBold: 'WorkSans_600SemiBold',
  bodyBold: 'WorkSans_700Bold',
} as const;
