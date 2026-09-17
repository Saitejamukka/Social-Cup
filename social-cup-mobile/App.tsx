import React, { useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme, Theme } from '@react-navigation/native';
import { View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import * as RN from 'react-native';
import {
  useFonts as useAlegreyaFonts,
  Alegreya_600SemiBold,
  Alegreya_700Bold,
} from '@expo-google-fonts/alegreya';
import {
  useFonts as useInterFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { RootNavigator } from './src/navigation/RootNavigator';
import { RateModal } from './src/components/RateModal';
import { StripeRoot } from './src/components/StripeRoot';
import { Colors } from './src/theme/colors';
import { Fonts } from './src/theme/typography';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';

// Inter becomes the app-wide default for every <Text>/<TextInput> that doesn't
// specify its own fontFamily, replacing the OS default. Screens that explicitly
// set their own fontFamily (e.g. Fonts.display for headings) still override
// this, since the default is merged in first and their own style comes after.
//
// MOB-002: the previous approach set Text.defaultProps.style — which turned out
// to be a complete no-op, not a partial one. React 19 (this app's version)
// dropped defaultProps support for function components entirely, and RN's Text
// has been a function component for a while now, so nothing was ever reading
// that assignment. The actual fix has to replace the exported component itself:
// every existing `import { Text } from 'react-native'` across the app compiles
// (via Babel's CommonJS interop) to a property read on this same shared module
// object rather than a one-time destructure, so reassigning RN.Text here —
// once, before anything else renders — retroactively patches every call site.
let defaultFontApplied = false;
function applyDefaultFont() {
  if (defaultFontApplied) return;
  defaultFontApplied = true;

  const OriginalText = RN.Text;
  const OriginalTextInput = RN.TextInput;

  const PatchedText = React.forwardRef<any, any>((props, ref) => (
    <OriginalText ref={ref} {...props} style={[{ fontFamily: Fonts.body }, props.style]} />
  ));
  const PatchedTextInput = React.forwardRef<any, any>((props, ref) => (
    <OriginalTextInput ref={ref} {...props} style={[{ fontFamily: Fonts.body }, props.style]} />
  ));

  (RN as any).Text = PatchedText;
  (RN as any).TextInput = PatchedTextInput;
}

// The real fix for the browser's blue focus outline on web <input> elements —
// injected as actual CSS so it applies regardless of how any screen's style
// prop is set, unlike the defaultProps approach above.
function injectWebFocusReset() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (document.getElementById('sc-focus-reset')) return;
  const style = document.createElement('style');
  style.id = 'sc-focus-reset';
  style.textContent = 'input:focus, textarea:focus { outline: none; box-shadow: none; }';
  document.head.appendChild(style);
}

export default function App() {
  const [serifLoaded] = useAlegreyaFonts({ Alegreya_600SemiBold, Alegreya_700Bold });
  const [sansLoaded] = useInterFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!serifLoaded || !sansLoaded) {
    return (
      <View style={[styles.outerContainer, styles.loadingContainer]}>
        <ActivityIndicator color={Colors.gold} />
      </View>
    );
  }

  applyDefaultFont();
  injectWebFocusReset();

  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}

// Split out from App() so it can call useTheme() — which needs a ThemeProvider
// ancestor, so it can't be called in App() itself above where that's mounted.
function AppShell() {
  const { colors, scheme } = useTheme();

  // React Navigation renders its own default scene backgrounds (stack screen
  // containers, tab scene containers) using whatever theme is passed to
  // NavigationContainer — and falls back to its built-in light theme
  // (background '#fff') if none is given. That default white was showing
  // through in dark mode wherever our own UI clips its background with a
  // border radius (e.g. CustomTabBar's rounded top corners), since the
  // corner cutout reveals this navigation-level background, not ours.
  const navTheme: Theme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: colors.background,
        card: colors.surface,
        border: colors.line,
        text: colors.ink,
        primary: colors.gold,
      },
    };
  }, [scheme, colors]);

  return (
    <SafeAreaProvider>
      <View style={[styles.outerContainer, { backgroundColor: Platform.OS === 'web' ? colors.panel : colors.background }]}>
        <View style={[styles.phoneContainer, { backgroundColor: colors.background, borderColor: colors.line }]}>
          <StripeRoot>
            <NavigationContainer theme={navTheme}>
              {/* expo-status-bar's "auto" reads the OS theme directly, which would
                  fight our own light/dark/system choice — tie it explicitly to the
                  resolved scheme instead so it always matches what's on screen. */}
              <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
              <RootNavigator />
              <RateModal />
            </NavigationContainer>
          </StripeRoot>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerContainer: {
    flex: 1,
    backgroundColor: Platform.OS === 'web' ? '#F0F2EB' : '#FCFCF8',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  phoneContainer: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 430 : '100%',
    backgroundColor: '#FCFCF8',
    ...(Platform.OS === 'web'
      ? {
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: '#DEE3D0',
        }
      : {}),
  },
});
