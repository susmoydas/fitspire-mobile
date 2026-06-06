import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import SplashScreen from '../screens/SplashScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import WorkoutDetailScreen from '../screens/WorkoutDetailScreen';
import WorkoutTimerScreen from '../screens/WorkoutTimerScreen';
import WorkoutCompleteScreen from '../screens/WorkoutCompleteScreen';
import ActiveTrainingScreen from '../screens/ActiveTrainingScreen';
import TrainingDetailScreen from '../screens/TrainingDetailScreen';
import ActivityHistoryScreen from '../screens/ActivityHistoryScreen';
import ExerciseInstructionScreen from '../screens/ExerciseInstructionScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import StepDetailScreen from '../screens/StepDetailScreen';
import MovementMapScreen from '../screens/MovementMapScreen';
import HealthConnectOnboardingScreen from '../screens/HealthConnectOnboardingScreen';
import StepTrackingOnboardingScreen from '../screens/StepTrackingOnboardingScreen';
import { TrainingMode, Exercise, TrainingSession } from '../types';

export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  ProfileSetup: undefined;
  Main: undefined;
  WorkoutDetail: { workoutId: string; workoutTitle?: string };
  ExerciseInstruction: { exerciseId: string; exerciseData?: Exercise };
  WorkoutTimer: { planJson: string };
  WorkoutComplete: { workoutId: string; duration: number; exercisesCompleted: number; totalExercises: number; calories: number; workoutTitle: string; category: string; difficulty: string; targetMusclesJson: string; planId?: string; setLogJson?: string };
  ActiveTraining: { mode: TrainingMode };
  TrainingDetail: { session: TrainingSession };
  ActivityHistory: undefined;
  EditProfile: undefined;
  StepDetail: undefined;
  MovementMap: { date?: string } | undefined;
  HealthConnectOnboarding: undefined;
  StepTrackingOnboarding: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
      <Stack.Screen name="ExerciseInstruction" component={ExerciseInstructionScreen} />
      <Stack.Screen name="WorkoutTimer" component={WorkoutTimerScreen} />
      <Stack.Screen name="WorkoutComplete" component={WorkoutCompleteScreen} />
      <Stack.Screen name="ActiveTraining" component={ActiveTrainingScreen} options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
      <Stack.Screen name="TrainingDetail" component={TrainingDetailScreen} />
      <Stack.Screen name="ActivityHistory" component={ActivityHistoryScreen} />
      <Stack.Screen name="StepDetail" component={StepDetailScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="MovementMap" component={MovementMapScreen} />
      <Stack.Screen
        name="HealthConnectOnboarding"
        component={HealthConnectOnboardingScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name="StepTrackingOnboarding"
        component={StepTrackingOnboardingScreen}
        options={{ gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}
