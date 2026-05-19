import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import UserSetupScreen from '../screens/UserSetupScreen';
import ExerciseDetailScreen from '../screens/ExerciseDetailScreen';
import WorkoutTimerScreen from '../screens/WorkoutTimerScreen';
import WorkoutCompleteScreen from '../screens/WorkoutCompleteScreen';
import GoalsScreen from '../screens/GoalsScreen';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  UserSetup: undefined;
  Main: undefined;
  ExerciseDetail: { exerciseId: string };
  WorkoutTimer: undefined;
  WorkoutComplete: { sessionId: string; duration: number };
  Goals: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="UserSetup" component={UserSetupScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
      <Stack.Screen name="WorkoutTimer" component={WorkoutTimerScreen} />
      <Stack.Screen name="WorkoutComplete" component={WorkoutCompleteScreen} />
      <Stack.Screen name="Goals" component={GoalsScreen} />
    </Stack.Navigator>
  );
}
