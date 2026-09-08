import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, TextInput, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import {
  useFonts as useCormorantGaramondFonts,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
} from '@expo-google-fonts/cormorant-garamond';
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

// Inter becomes the app-wide default for every <Text>/<TextInput> that doesn't
// specify its own fontFamily, replacing the OS default. Screens that explicitly
// set fontFamily: 'serif' for headings still override this — see the
// Fonts.display swap done across screens.
//
// Note: defaultProps.style only ever applies when a component omits the style
// prop entirely — every screen here passes its own explicit style, so this
// never actually overrides anything in practice. Harmless to leave in case a
// future component omits style, but not a real "global default" — see the CSS
// injection below for the one fix that had to bypass this limitation for real.
function applyDefaultFont() {
  const TextAny = Text as any;
  TextAny.defaultProps = TextAny.defaultProps || {};
  TextAny.defaultProps.style = [{ fontFamily: Fonts.body }, TextAny.defaultProps.style];

  const TextInputAny = TextInput as any;
  TextInputAny.defaultProps = TextInputAny.defaultProps || {};
  TextInputAny.defaultProps.style = [{ fontFamily: Fonts.body }, TextInputAny.defaultProps.style];
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
  const [serifLoaded] = useCormorantGaramondFonts({ CormorantGaramond_600SemiBold, CormorantGaramond_700Bold });
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
    <SafeAreaProvider>
      <View style={styles.outerContainer}>
        <View style={styles.phoneContainer}>
          <StripeRoot>
            <NavigationContainer>
              <StatusBar style="dark" />
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
