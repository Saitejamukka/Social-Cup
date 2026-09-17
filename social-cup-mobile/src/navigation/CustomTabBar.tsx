import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme/ThemeContext';
import { ColorPalette } from '../theme/colors';
import { AnimatedPressable } from '../components/AnimatedPressable';

/**
 * A floating, elevated bottom nav — structurally inspired by the "lifted card
 * above the page" pattern common in polished delivery/marketplace apps
 * (rounded top corners, soft shadow, a highlighted pill behind the active
 * icon), rendered entirely with this app's own palette/icons/typography so it
 * reads as a natural evolution of the existing tab bar, not a reskin of
 * anyone else's app.
 *
 * Replaces React Navigation's default tab bar (via the `tabBar` prop) because
 * getting a real per-tab pop/pill transition and press feedback isn't
 * reachable through tabBarStyle/tabBarIcon options alone.
 */
export const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors: Colors } = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);

  return (
    <View
      style={[
        styles.wrapper,
        { paddingBottom: Math.max(insets.bottom, Platform.OS === 'web' ? 14 : 10) },
      ]}
    >
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : route.name;
          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabButton
              key={route.key}
              focused={focused}
              label={label}
              onPress={onPress}
              styles={styles}
              renderIcon={(color) => options.tabBarIcon?.({ focused, color, size: 21 }) ?? null}
            />
          );
        })}
      </View>
    </View>
  );
};

const TabButton: React.FC<{
  focused: boolean;
  label: string;
  onPress: () => void;
  renderIcon: (color: string) => React.ReactNode;
  styles: ReturnType<typeof createStyles>;
}> = ({ focused, label, onPress, renderIcon, styles }) => {
  const { colors: Colors } = useTheme();
  // Drives three small, fast transitions together: the pill background fading
  // and scaling in, and the icon giving a subtle "pop" — never a full re-layout,
  // so switching tabs stays quick and doesn't jump.
  const anim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      speed: 22,
      bounciness: 6,
    }).start();
  }, [focused, anim]);

  const iconScale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });
  const pillScale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
  const color = focused ? Colors.gold : Colors.mute;

  return (
    // AnimatedPressable only forwards `style` to its *inner* Animated.View, not
    // to the Pressable that's actually the flex item in the row below — so a
    // flex:1 passed straight into it never reaches the real layout node, and
    // every tab button collapses to content width instead of sharing the bar
    // evenly. This wrapper is the thing that actually needs to be flex:1.
    <View style={styles.tabButtonWrapper}>
      <AnimatedPressable style={styles.tabButton} onPress={onPress}>
        {/* The pill lives inside its own fixed-size slot (rather than being
            absolutely offset against the whole button) so it's always exactly
            concentric with the icon, regardless of label length or padding. */}
        <View style={styles.iconSlot}>
          <Animated.View style={[styles.pill, { opacity: anim, transform: [{ scale: pillScale }] }]} />
          <Animated.View style={{ transform: [{ scale: iconScale }] }}>{renderIcon(color)}</Animated.View>
        </View>
        <Text style={[styles.label, { color, fontWeight: focused ? '700' : '600' }]}>{label}</Text>
      </AnimatedPressable>
    </View>
  );
};

function createStyles(Colors: ColorPalette) {
  return StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    borderColor: Colors.line,
    // A shadow on the top edge only is what actually sells "lifted above the
    // page content" — elevation covers Android, shadow* covers iOS/web. Fixed
    // black regardless of theme — shadowColor represents cast darkness, not
    // ink's light-in-dark-mode value, which would look like a glow instead.
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 10,
  },
  tabButtonWrapper: {
    flex: 1,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconSlot: {
    width: 44,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    position: 'absolute',
    width: 44,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.panel,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.1,
    marginTop: 3,
  },
  });
}
