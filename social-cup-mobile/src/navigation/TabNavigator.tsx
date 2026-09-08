import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Coffee, Search, BookOpen, User } from 'lucide-react-native';
import { TabParamList } from './types';
import { Colors } from '../theme/colors';

import { DiscoverScreen } from '../screens/discover/DiscoverScreen';
import { ExploreScreen } from '../screens/explore/ExploreScreen';
import { DiaryScreen } from '../screens/diary/DiaryScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator<TabParamList>();

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
        tabBarShowLabel: true,
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.mute,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="DiscoverTab"
        component={DiscoverScreen}
        options={{
          tabBarLabel: 'Discover',
          tabBarIcon: ({ color, size }) => (
            <Coffee color={color} size={size || 20} strokeWidth={2.2} />
          ),
        }}
      />
      <Tab.Screen
        name="ExploreTab"
        component={ExploreScreen}
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: ({ color, size }) => (
            <Search color={color} size={size || 20} strokeWidth={2.2} />
          ),
        }}
      />
      <Tab.Screen
        name="DiaryTab"
        component={DiaryScreen}
        options={{
          tabBarLabel: 'Diary',
          tabBarIcon: ({ color, size }) => (
            <BookOpen color={color} size={size || 20} strokeWidth={2.2} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <User color={color} size={size || 20} strokeWidth={2.2} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    // Web's tab items are real <a> elements carrying React Navigation's own internal
    // 5px top/bottom padding (not reachable via tabBarItemStyle) on top of a 25px icon —
    // 64 was too tight and clipped the label; measured via devtools against real content.
    height: Platform.OS === 'web' ? 80 : 72,
    paddingBottom: Platform.OS === 'web' ? 10 : 16,
    paddingTop: 8,
    elevation: 8,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  // React Navigation's web tab items carry their own default 5px padding, which stacks
  // on top of tabBar's paddingTop/paddingBottom above and clips the label against the
  // bar's fixed height. Zeroing it out here gives the bar's own padding full control.
  tabItem: {
    paddingTop: 0,
    paddingBottom: 0,
  },
});
