import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Coffee, Search, BookOpen, User } from 'lucide-react-native';
import { TabParamList } from './types';
import { CustomTabBar } from './CustomTabBar';

import { DiscoverScreen } from '../screens/discover/DiscoverScreen';
import { ExploreScreen } from '../screens/explore/ExploreScreen';
import { DiaryScreen } from '../screens/diary/DiaryScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator<TabParamList>();

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
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
