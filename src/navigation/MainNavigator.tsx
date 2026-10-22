import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colours } from '../constants/colours';
import MarksNavigator from './MarksNavigator';
import GoalsNavigator from './GoalsNavigator';
import DeadlinesNavigator from './DeadlinesNavigator';
import InsightsNavigator from './InsightsNavigator';
import { View, Text, StyleSheet } from 'react-native';

export type MainTabParamList = {
  Marks: undefined;
  Goals: undefined;
  Deadlines: undefined;
  Insights: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TabIcon = ({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) => (
  <View style={styles.tabItem}>
    <Text style={styles.tabEmoji}>{emoji}</Text>
    <Text style={[styles.tabLabel, { color: focused ? colours.primary : colours.grey4 }]}>
      {label}
    </Text>
  </View>
);

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          borderTopColor: colours.grey3,
          backgroundColor: colours.white,
          height: 72,
          paddingBottom: 8,
        },
      }}
    >
      <Tab.Screen
        name="Marks"
        component={MarksNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📊" label="Marks" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Goals"
        component={GoalsNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🎯" label="Goals" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Deadlines"
        component={DeadlinesNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📅" label="Deadlines" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="💡" label="Insights" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabEmoji: {
    fontSize: 22,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});