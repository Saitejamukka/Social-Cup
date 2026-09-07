import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

interface Props {
  children: React.ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

/** Scale + fade pop, for a single focal element (QR reveal, success checkmark). */
export function PopIn({ children, delay = 0, style }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 320, delay, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, delay, useNativeDriver: true, speed: 14, bounciness: 8 }),
    ]);
    animation.start();
    return () => animation.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Animated.View style={[style, { opacity, transform: [{ scale }] }]}>{children}</Animated.View>;
}
