import { StyleSheet } from 'react-native';
import { ColorPalette } from './colors';

// The one shared primary-button look used everywhere in the app: fully pill-shaped,
// flat Olive fill, white label, a soft shadow for lift. Spread `primary` into a
// screen's own button style (for layout props like marginTop/width) rather than
// duplicating these values — this file is the single place to change them all.
//
// A function (not a static StyleSheet.create) because the fill color has to
// track the live theme — call it from inside a component via
// `useMemo(() => createPillButtonStyles(colors), [colors])`, same pattern as
// every other screen's own createStyles(Colors).
export function createPillButtonStyles(Colors: ColorPalette) {
  return StyleSheet.create({
    primary: {
      backgroundColor: Colors.gold,
      borderRadius: 999,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      // Fixed black regardless of theme — see the same note in CustomTabBar/BackButton.
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 3,
    },
    primaryText: {
      color: Colors.white,
      fontSize: 15,
      fontWeight: '600',
    },
  });
}
