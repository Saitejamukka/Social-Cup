import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { Colors } from '../theme/colors';
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
export const BackButton: React.FC<Props> = ({ onPress, style }) => (
  <View style={style}>
    <AnimatedPressable style={styles.button} onPress={onPress}>
      <ArrowLeft color={Colors.gold} size={20} strokeWidth={2.3} />
    </AnimatedPressable>
  </View>
);

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.panel,
    borderWidth: 1,
    borderColor: 'rgba(53, 42, 36, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    // A photo header can be just as light as this button's fill, so the button
    // leans on a strong drop shadow (not fill-color contrast alone) to stay
    // legible regardless of what's behind it.
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
});
