import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  View,
  StyleSheet,
} from 'react-native';
import { Text } from '../components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import AppIcon, { AppIconName } from '../components/AppIcon';
import MarksNavigator from './MarksNavigator';
import GoalsNavigator from './GoalsNavigator';
import DeadlinesNavigator from './DeadlinesNavigator';
import InsightsNavigator from './InsightsNavigator';

export type MainTabParamList = {
  Marks: undefined;
  Goals: undefined;
  Deadlines: undefined;
  Insights: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

// Colour icons can't be re-tinted, so the active tab gets a soft pill
// behind its icon and full opacity; inactive tabs are faded.
const TabIcon = ({ icon, label, focused }: { icon: AppIconName; label: string; focused: boolean }) => {
  const { colours } = useTheme();
  return (
    <View style={styles.tabItem}>
      <View style={[styles.pill, focused && { backgroundColor: colours.primaryPale }]}>
        <AppIcon name={icon} size={26} style={{ opacity: focused ? 1 : 0.5 }} />
      </View>
      <Text
        style={[styles.tabLabel, { color: focused ? colours.accent : colours.grey4 }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
};

export default function MainNavigator() {
  const { colours } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          borderTopColor: colours.grey3,
          backgroundColor: colours.card,
          // Sits above the iPhone home bar / Android gesture bar on every phone
          height: 64 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom,
        },
      }}
    >
      <Tab.Screen
        name="Marks"
        component={MarksNavigator}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="marks" label="Marks" focused={focused} />,
          tabBarAccessibilityLabel: 'Marks',
        }}
      />
      <Tab.Screen
        name="Goals"
        component={GoalsNavigator}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="goals" label="Goals" focused={focused} />,
          tabBarAccessibilityLabel: 'Goals',
        }}
      />
      <Tab.Screen
        name="Deadlines"
        component={DeadlinesNavigator}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="deadlines" label="Deadlines" focused={focused} />,
          tabBarAccessibilityLabel: 'Deadlines',
        }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsNavigator}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="insights" label="Insights" focused={focused} />,
          tabBarAccessibilityLabel: 'Insights',
        }}
      />
    </Tab.Navigator>
  );
}

// Layout only — colours come from the theme above
const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    width: 76,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 3,
    borderRadius: 14,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});
