import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colours } from '../constants/colours';
import MarksNavigator from './MarksNavigator';
import GoalsNavigator from './GoalsNavigator';
import DeadlinesNavigator from './DeadlinesNavigator';
import InsightsNavigator from './InsightsNavigator';

const Tab = createBottomTabNavigator();

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colours.primary,
        tabBarInactiveTintColor: colours.grey4,
        tabBarStyle: {
          borderTopColor: colours.grey3,
          backgroundColor: colours.white,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen name="Marks" component={MarksNavigator} />
      <Tab.Screen name="Goals" component={GoalsNavigator} />
      <Tab.Screen name="Deadlines" component={DeadlinesNavigator} />
      <Tab.Screen name="Insights" component={InsightsNavigator} />
    </Tab.Navigator>
  );
}