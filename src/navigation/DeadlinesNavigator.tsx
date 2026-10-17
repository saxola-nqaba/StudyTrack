import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DeadlinesScreen from '../screens/deadlines/DeadlinesScreen';
import AddDeadlineScreen from '../screens/deadlines/AddDeadlineScreen';

export type DeadlinesStackParamList = {
  DeadlinesList: undefined;
  AddDeadline: undefined;
};

const Stack = createStackNavigator<DeadlinesStackParamList>();

export default function DeadlinesNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DeadlinesList" component={DeadlinesScreen} />
      <Stack.Screen name="AddDeadline" component={AddDeadlineScreen} />
    </Stack.Navigator>
  );
}