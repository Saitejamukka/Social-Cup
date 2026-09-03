import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

import { TabNavigator } from './TabNavigator';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { VerifyEmailScreen } from '../screens/auth/VerifyEmailScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';

import { CafeDetailScreen } from '../screens/discover/CafeDetailScreen';
import { RedeemPickerScreen } from '../screens/redeem/RedeemPickerScreen';
import { RedeemConfirmScreen } from '../screens/redeem/RedeemConfirmScreen';
import { RedeemCodeScreen } from '../screens/redeem/RedeemCodeScreen';
import { RedeemSuccessScreen } from '../screens/redeem/RedeemSuccessScreen';
import { RedeemFailedScreen } from '../screens/redeem/RedeemFailedScreen';

import { MembershipScreen } from '../screens/membership/MembershipScreen';
import { PaymentScreen } from '../screens/membership/PaymentScreen';
import { SocialScreen } from '../screens/social/SocialScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* Auth & Onboarding Flow */}
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />

      {/* Main Tabs */}
      <Stack.Screen name="MainTabs" component={TabNavigator} />

      {/* Cafe Detail */}
      <Stack.Screen name="CafeDetail" component={CafeDetailScreen} />

      {/* Redemption Flow */}
      <Stack.Screen name="RedeemPicker" component={RedeemPickerScreen} />
      <Stack.Screen name="RedeemConfirm" component={RedeemConfirmScreen} />
      <Stack.Screen name="RedeemCode" component={RedeemCodeScreen} />
      <Stack.Screen name="RedeemSuccess" component={RedeemSuccessScreen} />
      <Stack.Screen name="RedeemFailed" component={RedeemFailedScreen} />

      {/* Membership & Payment */}
      <Stack.Screen name="Membership" component={MembershipScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />

      {/* Social & Midpoint Meetup */}
      <Stack.Screen name="Social" component={SocialScreen} />
    </Stack.Navigator>
  );
};
