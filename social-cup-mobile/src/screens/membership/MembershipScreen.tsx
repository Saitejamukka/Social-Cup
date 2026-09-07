import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/colors';
import { Fonts } from '../../theme/typography';
import { FadeSlideIn } from '../../components/FadeSlideIn';
import { AnimatedPressable } from '../../components/AnimatedPressable';

type Props = NativeStackScreenProps<RootStackParamList, 'Membership'>;

const BENEFITS = [
  '30 drink credits every month at any partner cafe',
  'Priority access to new signature drinks',
  'A private drink diary that tracks every rating you leave',
  'Redeem at any cafe in the network with a code, no reservations',
];

export const MembershipScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>

        <FadeSlideIn style={styles.header}>
          <Text style={styles.title}>Social Cup Membership</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>$24.99</Text>
            <Text style={styles.priceUnit}>/ month</Text>
          </View>
        </FadeSlideIn>

        {/* Credit Card Banner */}
        <FadeSlideIn delay={80} style={styles.creditsBanner}>
          <Text style={styles.creditNumber}>30</Text>
          <Text style={styles.creditDesc}>
            drink credits every month — 1 credit ≈ $1 toward any drink at any
            partner cafe.
          </Text>
        </FadeSlideIn>

        {/* Benefits List */}
        <View style={styles.benefitsList}>
          {BENEFITS.map((benefit, index) => (
            <FadeSlideIn key={index} delay={140 + index * 50} style={styles.benefitRow}>
              <Text style={styles.checkIcon}>✓</Text>
              <Text style={styles.benefitText}>{benefit}</Text>
            </FadeSlideIn>
          ))}
        </View>

        <Text style={styles.disclaimer}>
          Credits reset every month and don't roll over. Cancel anytime — access
          continues to the end of your paid period.
        </Text>

        <AnimatedPressable
          style={styles.subscribeBtn}
          onPress={() => navigation.navigate('Payment')}
        >
          <Text style={styles.subscribeBtnText}>Subscribe — $24.99/mo</Text>
        </AnimatedPressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    padding: 24,
    gap: 22,
  },
  backBtn: {
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  backBtnText: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.ink,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.ink,
    fontFamily: Fonts.display,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  price: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.gold,
    fontFamily: Fonts.display,
  },
  priceUnit: {
    fontSize: 14,
    color: Colors.mute,
  },
  creditsBanner: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  creditNumber: {
    fontSize: 30,
    fontWeight: '700',
    color: Colors.gold,
    fontFamily: Fonts.display,
  },
  creditDesc: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.mute,
  },
  benefitsList: {
    gap: 14,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkIcon: {
    color: Colors.gold,
    fontWeight: '700',
    fontSize: 16,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.ink,
  },
  disclaimer: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.mute,
  },
  subscribeBtn: {
    backgroundColor: Colors.gold,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  subscribeBtnText: {
    color: Colors.ink,
    fontSize: 15,
    fontWeight: '600',
  },
});
