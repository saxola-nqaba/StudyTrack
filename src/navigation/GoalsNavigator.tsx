import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import GoalsScreen from '../screens/goals/GoalsScreen';
import EditGoalScreen from '../screens/goals/EditGoalScreen';

export type GoalsStackParamList = {
  Goals: undefined;
  EditGoal: { moduleId: string; moduleName: string };
};

const Stack = createStackNavigator<GoalsStackParamList>();

export default function GoalsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Goals" component={GoalsScreen} />
      <Stack.Screen name="EditGoal" component={EditGoalScreen} />
    </Stack.Navigator>
  );
}