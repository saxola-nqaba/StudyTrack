import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DashboardScreen from '../screens/marks/DashboardScreen';
import ModuleDetailScreen from '../screens/marks/ModuleDetailScreen';
import AddModuleScreen from '../screens/marks/AddModuleScreen';
import EditModuleScreen from '../screens/marks/EditModuleScreen';
import AddAssessmentScreen from '../screens/marks/AddAssessmentScreen';
import EditAssessmentScreen from '../screens/marks/EditAssessmentScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

export type MarksStackParamList = {
  Dashboard: undefined;
  ModuleDetail: { moduleId: string };
  AddModule: undefined;
  EditModule: { moduleId: string };
  AddAssessment: { moduleId: string };
  EditAssessment: { moduleId: string; assessmentId: string };
  Profile: undefined;
};

const Stack = createStackNavigator<MarksStackParamList>();

export default function MarksNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="ModuleDetail" component={ModuleDetailScreen} />
      <Stack.Screen name="AddModule" component={AddModuleScreen} />
      <Stack.Screen name="EditModule" component={EditModuleScreen} />
      <Stack.Screen name="AddAssessment" component={AddAssessmentScreen} />
      <Stack.Screen name="EditAssessment" component={EditAssessmentScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}