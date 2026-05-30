import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import ProgressScreen from '../screens/ProgressScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors, borderRadius } from '../theme/colors';

export type MainTabParamList = {
  Home: undefined;
  Workouts: undefined;
  Progress: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const iconMap: Record<string, { focused: keyof typeof MaterialIcons.glyphMap; unfocused: keyof typeof MaterialIcons.glyphMap }> = {
  Home: { focused: 'home', unfocused: 'home' },
  Workouts: { focused: 'fitness-center', unfocused: 'fitness-center' },
  Progress: { focused: 'bar-chart', unfocused: 'bar-chart' },
  Profile: { focused: 'person', unfocused: 'person' },
};

export default function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => {
          const icons = iconMap[route.name] || iconMap.Home;
          return (
            <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
              <MaterialIcons
                name={focused ? icons.focused : icons.unfocused}
                size={22}
                color={focused ? colors.tabActive : colors.tabInactive}
              />
            </View>
          );
        },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: tabStyles.label,
        tabBarStyle: {
          backgroundColor: colors.bgSecondary,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Workouts" component={WorkoutScreen} options={{ tabBarLabel: 'Workouts' }} />
      <Tab.Screen name="Progress" component={ProgressScreen} options={{ tabBarLabel: 'Progress' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

const tabStyles = StyleSheet.create({
  label: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  iconWrap: {
    padding: 4,
  },
  iconWrapActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.tabActive,
    paddingBottom: 2,
  },
});
