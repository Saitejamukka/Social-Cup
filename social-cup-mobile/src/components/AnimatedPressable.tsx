import React, { useRef } from 'react';
import { Animated, GestureResponderEvent, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

interface Props extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Drop-in replacement for TouchableOpacity on primary CTAs — a subtle scale-down on
 * press instead of just an opacity dim, so key actions feel tactile rather than flat. */
export function AnimatedPressable({ children, style, onPressIn, onPressOut, disabled, ...rest }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: GestureResponderEvent) => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 60, bounciness: 0 }).start();
    onPressIn?.(e);
  };
  const handlePressOut = (e: GestureResponderEvent) => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
    onPressOut?.(e);
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} disabled={disabled} {...rest}>
      <Animated.View style={[style, { transform: [{ scale }] }, disabled && { opacity: 0.6 }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
