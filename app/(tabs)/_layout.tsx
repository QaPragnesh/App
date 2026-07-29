import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { FloatingChatButton } from '@/components/floating-chat-button';
import { MaterialIcons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <View style={styles.root}>
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#10B981', // Emerald green matching onboarding and theme
        tabBarInactiveTintColor: '#737373',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: '#262626', // Dark background
          borderTopWidth: 1,
          borderTopColor: '#3A3A3A',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <MaterialIcons size={26} name="dashboard" color={color} />,
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: 'Budget',
          tabBarIcon: ({ color }) => <MaterialIcons size={26} name="account-balance-wallet" color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add Expense',
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="add-circle" color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <MaterialIcons size={26} name="history" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <MaterialIcons size={26} name="person" color={color} />,
        }}
      />
    </Tabs>
    <FloatingChatButton />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
