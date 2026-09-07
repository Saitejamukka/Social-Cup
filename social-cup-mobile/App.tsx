import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, TextInput, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import {
  useFonts as useSourceSerif4Fonts,
  SourceSerif4_600SemiBold,
  SourceSerif4_700Bold,
} from '@expo-google-fonts/source-serif-4';
import {
  useFonts as useWorkSansFonts,
  WorkSans_400Regular,
  WorkSans_500Medium,
  WorkSans_600SemiBold,
  WorkSans_700Bold,
} from '@expo-google-fonts/work-sans';
import { RootNavigator } from './src/navigation/RootNavigator';
import { RateModal } from './src/components/RateModal';
import { StripeRoot } from './src/components/StripeRoot';
import { Colors } from './src/theme/colors';
import { Fonts } from './src/theme/typography';

// Work Sans becomes the app-wide default for every <Text>/<TextInput> that
// doesn't specify its own fontFamily, replacing the OS default. Screens that
// explicitly set fontFamily: 'serif' for headings still override this — see
// the Fonts.display swap done across screens.
function applyDefaultFont() {
  const TextAny = Text as any;
  TextAny.defaultProps = TextAny.defaultProps || {};
  TextAny.defaultProps.style = [{ fontFamily: Fonts.body }, TextAny.defaultProps.style];

  const TextInputAny = TextInput as any;
  TextInputAny.defaultProps = TextInputAny.defaultProps || {};
  TextInputAny.defaultProps.style = [{ fontFamily: Fonts.body }, TextInputAny.defaultProps.style];
}

export default function App() {
  const [serifLoaded] = useSourceSerif4Fonts({ SourceSerif4_600SemiBold, SourceSerif4_700Bold });
  const [sansLoaded] = useWorkSansFonts({
    WorkSans_400Regular,
    WorkSans_500Medium,
    WorkSans_600SemiBold,
    WorkSans_700Bold,
  });

  if (!serifLoaded || !sansLoaded) {
    return (
      <View style={[styles.outerContainer, styles.loadingContainer]}>
        <ActivityIndicator color={Colors.gold} />
      </View>
    );
  }

  applyDefaultFont();

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
