import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import InsightsScreen from '../screens/insights/InsightsScreen';

export type InsightsStackParamList = {
  Insights: undefined;
};

const Stack = createStackNavigator<InsightsStackParamList>();

export default function InsightsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Insights" component={InsightsScreen} />
    </Stack.Navigator>
  );
}