import React, { useMemo } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { ColorPalette } from '../theme/colors';
import { AnimatedPressable } from './AnimatedPressable';

interface Props {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

// The one shared back-button look used everywhere in the app: a soft, elevated
// Pale Pistachio circle with an Olive arrow, sized and shadowed to read clearly
// whether it's sitting on a plain background or floating over a photo header.
//
// `style` (e.g. position: 'absolute' for a photo header) is applied to this outer
// View, never merged into AnimatedPressable's own style — AnimatedPressable applies
// its style to an inner Animated.View wrapped by a plain Pressable, so a position
// value merged in there positions that inner view while the outer Pressable (whose
// only child just left normal flow) collapses to zero size and effectively vanishes.
export const BackButton: React.FC<Props> = ({ onPress, style }) => {
  const { colors: Colors } = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);

  return (
    <View style={style}>
      <AnimatedPressable style={styles.button} onPress={onPress}>
        <ArrowLeft color={Colors.gold} size={20} strokeWidth={2.3} />
      </AnimatedPressable>
    </View>
  );
};

function createStyles(Colors: ColorPalette) {
  return StyleSheet.create({
    button: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: Colors.panel,
      borderWidth: 1,
      borderColor: Colors.line,
      alignItems: 'center',
      justifyContent: 'center',
      // A photo header can be just as light as this button's fill, so the button
      // leans on a strong drop shadow (not fill-color contrast alone) to stay
      // legible regardless of what's behind it. Shadows read as "cast darkness"
      // regardless of theme, so this is deliberately a fixed black, not Colors.ink
      // (which is a light cream in dark mode and would look like a glow, not a shadow).
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 6,
    },
  });
}
