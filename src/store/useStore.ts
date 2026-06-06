import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const persistStorage = {
  getItem: async (name: string) => {
    const raw = await AsyncStorage.getItem(name);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },
  setItem: async (name: string, value: unknown) => {
    await AsyncStorage.setItem(name, JSON.stringify(value));
  },
  removeItem: async (name: string) => {
    await AsyncStorage.removeItem(name);
  },
};
import type {
  UserProfile,
  Set,
  ExerciseCategory,
  Achievement,
} from '../types';
import type {
  WorkoutSession,
  DailyActivity,
  Notification,
  Goal,
  WorkoutExercise,
  TrainingSession,
  ActiveSession,
  CompletedWorkout,
} from '../types';

interface FitspireState {
  // User Profile
  profile: Partial<UserProfile>;
  setProfile: (p: Partial<UserProfile>) => void;
  clearProfile: () => void;

  // Workouts
  workoutSessions: WorkoutSession[];
  currentWorkout: WorkoutSession | null;
  addWorkoutSession: (session: WorkoutSession) => void;
  updateWorkoutSession: (id: string, updates: Partial<WorkoutSession>) => void;
  setCurrentWorkout: (session: WorkoutSession | null) => void;
  completeWorkout: (id: string) => void;
  deleteWorkoutSession: (id: string) => void;

  // Exercises - workout builder
  selectedCategory: ExerciseCategory;
  setSelectedCategory: (cat: ExerciseCategory) => void;
  workoutBuilder: WorkoutExercise[];
  addExerciseToWorkout: (exerciseId: string, sets: Set[]) => void;
  removeExerciseFromWorkout: (exerciseId: string) => void;
  updateSetInWorkout: (exerciseId: string, setId: string, updates: Partial<Set>) => void;
  addSetToWorkoutExercise: (exerciseId: string, set: Set) => void;
  removeSetFromWorkoutExercise: (exerciseId: string, setId: string) => void;
  clearWorkoutBuilder: () => void;

  // Activity
  activityLog: DailyActivity[];
  updateActivity: (activity: DailyActivity) => void;
  getActivityByDate: (date: string) => DailyActivity | null;

  // Step Tracking (persistent)
  todaySteps: number;
  todayDate: string;
  setTodaySteps: (steps: number, date: string) => void;

  // Notifications
  notifications: Notification[];
  addNotification: (n: Notification) => void;
  markNotificationRead: (id: string) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Training Sessions
  trainingSessions: TrainingSession[];
  addTrainingSession: (session: TrainingSession) => void;
  deleteTrainingSession: (id: string) => void;

  // Active Session
  activeSession: ActiveSession | null;
  setActiveSession: (session: ActiveSession | null) => void;
  updateActiveSession: (updates: Partial<ActiveSession>) => void;
  clearActiveSession: () => void;

  // Achievements
  achievements: Achievement[];
  unlockAchievement: (id: string) => void;

  // Completed Workout Log
  completedWorkoutLog: CompletedWorkout[];
  addCompletedWorkout: (cw: CompletedWorkout) => void;

  // Goals
  goals: Goal[];
  updateGoal: (goal: Goal) => void;
  addGoal: (goal: Goal) => void;

  // Saved Workouts
  savedWorkoutIds: string[];
  toggleSavedWorkout: (id: string) => void;

  // Health Connectors
  healthConnectors: Record<string, boolean>;
  setHealthConnectors: (connectors: Record<string, boolean>) => void;

  // Health Connect opt-in (user's choice about the explainer screen)
  healthConnectOptIn: 'pending' | 'granted' | 'denied' | 'dismissed';
  setHealthConnectOptIn: (v: 'pending' | 'granted' | 'denied' | 'dismissed') => void;

  // Tracking toggles (user-controlled)
  stepTrackingEnabled: boolean;
  setStepTrackingEnabled: (v: boolean) => void;
  locationTrackingEnabled: boolean;
  setLocationTrackingEnabled: (v: boolean) => void;
  backgroundNotificationEnabled: boolean;
  setBackgroundNotificationEnabled: (v: boolean) => void;

  // First-install decision gate
  stepTrackingDecision: 'pending' | 'allowed' | 'declined';
  setStepTrackingDecision: (v: 'pending' | 'allowed' | 'declined') => void;

  // Hard reset today's step counters
  clearTodaySteps: () => void;
}

export const useStore = create<FitspireState>()(
  persist(
    (set, get) => ({
      // Profile
      profile: {},
      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      clearProfile: () => set({ profile: {} }),

      // Workouts
      workoutSessions: [],
      currentWorkout: null,
      addWorkoutSession: (session) =>
        set((s) => ({ workoutSessions: [...s.workoutSessions, session] })),
      updateWorkoutSession: (id, updates) =>
        set((s) => ({
          workoutSessions: s.workoutSessions.map((ws) =>
            ws.id === id ? { ...ws, ...updates } : ws
          ),
        })),
      setCurrentWorkout: (session) => set({ currentWorkout: session }),
      completeWorkout: (id) =>
        set((s) => ({
          workoutSessions: s.workoutSessions.map((ws) =>
            ws.id === id
              ? { ...ws, completed: true, completedAt: new Date().toISOString() }
              : ws
          ),
          currentWorkout: null,
        })),
      deleteWorkoutSession: (id) =>
        set((s) => ({
          workoutSessions: s.workoutSessions.filter((ws) => ws.id !== id),
        })),

      // Exercise builder
      selectedCategory: 'All' as ExerciseCategory,
      setSelectedCategory: (cat) => set({ selectedCategory: cat }),
      workoutBuilder: [],
      addExerciseToWorkout: (exerciseId, sets) =>
        set((s) => ({
          workoutBuilder: [...s.workoutBuilder, { exerciseId, sets }],
        })),
      removeExerciseFromWorkout: (exerciseId) =>
        set((s) => ({
          workoutBuilder: s.workoutBuilder.filter((w) => w.exerciseId !== exerciseId),
        })),
      updateSetInWorkout: (exerciseId, setId, updates) =>
        set((s) => ({
          workoutBuilder: s.workoutBuilder.map((w) =>
            w.exerciseId === exerciseId
              ? {
                  ...w,
                  sets: w.sets.map((set) =>
                    set.id === setId ? { ...set, ...updates } : set
                  ),
                }
              : w
          ),
        })),
      addSetToWorkoutExercise: (exerciseId, newSet) =>
        set((s) => ({
          workoutBuilder: s.workoutBuilder.map((w) =>
            w.exerciseId === exerciseId
              ? { ...w, sets: [...w.sets, newSet] }
              : w
          ),
        })),
      removeSetFromWorkoutExercise: (exerciseId, setId) =>
        set((s) => ({
          workoutBuilder: s.workoutBuilder
            .map((w) =>
              w.exerciseId === exerciseId
                ? { ...w, sets: w.sets.filter((set) => set.id !== setId) }
                : w
            )
            .filter((w) => w.sets.length > 0),
        })),
      clearWorkoutBuilder: () => set({ workoutBuilder: [] }),

      // Activity
      activityLog: [],
      updateActivity: (activity) =>
        set((s) => {
          const existing = s.activityLog.findIndex((a) => a.date === activity.date);
          if (existing >= 0) {
            const updated = [...s.activityLog];
            updated[existing] = activity;
            return { activityLog: updated };
          }
          return { activityLog: [...s.activityLog, activity] };
        }),
      getActivityByDate: (date) =>
        get().activityLog.find((a) => a.date === date) || null,

      // Step Tracking (persistent)
      todaySteps: 0,
      todayDate: '',
      setTodaySteps: (steps, date) => set({ todaySteps: steps, todayDate: date }),

      // Notifications
      notifications: [],
      addNotification: (n) =>
        set((s) => ({ notifications: [n, ...s.notifications] })),
      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      removeNotification: (id) =>
        set((s) => ({
          notifications: s.notifications.filter((n) => n.id !== id),
        })),
      clearNotifications: () => set({ notifications: [] }),

      // Active Session
      activeSession: null,
      setActiveSession: (session) => set({ activeSession: session }),
      updateActiveSession: (updates) =>
        set((s) => ({
          activeSession: s.activeSession ? { ...s.activeSession, ...updates } : null,
        })),
      clearActiveSession: () => set({ activeSession: null }),

      // Completed Workout Log
      completedWorkoutLog: [],
      addCompletedWorkout: (cw) =>
        set((s) => ({ completedWorkoutLog: [cw, ...s.completedWorkoutLog] })),

      // Achievements
      achievements: [
        { id: 'first_workout', icon: '💪', title: 'First Workout', subtitle: 'Complete your first workout', unlocked: false },
        { id: 'step_master', icon: '👣', title: 'Step Master', subtitle: 'Walk 10,000 steps in a day', unlocked: false },
        { id: 'calorie_burner', icon: '🔥', title: 'Calorie Burner', subtitle: 'Burn 500 calories in a session', unlocked: false },
        { id: 'early_bird', icon: '🌅', title: 'Early Bird', subtitle: 'Work out before 7 AM', unlocked: false },
        { id: 'streak_3', icon: '⭐', title: '3-Day Streak', subtitle: 'Work out 3 days in a row', unlocked: false },
        { id: 'streak_7', icon: '🏆', title: 'Week Warrior', subtitle: 'Work out 7 days in a row', unlocked: false },
      ],
      unlockAchievement: (id) =>
        set((s) => ({
          achievements: s.achievements.map((a) =>
            a.id === id && !a.unlocked
              ? { ...a, unlocked: true, unlockedAt: new Date().toISOString() }
              : a
          ),
        })),

      // Goals
      goals: [],
      updateGoal: (goal) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === goal.id ? goal : g)),
        })),
  addGoal: (goal) => set((s) => ({ goals: [...s.goals, goal] })),

      // Saved Workouts
      savedWorkoutIds: [],
      toggleSavedWorkout: (id) =>
        set((s) => ({
          savedWorkoutIds: s.savedWorkoutIds.includes(id)
            ? s.savedWorkoutIds.filter((i) => i !== id)
            : [...s.savedWorkoutIds, id],
        })),

      // Health Connectors
      healthConnectors: {},
      setHealthConnectors: (connectors) => set({ healthConnectors: connectors }),

      // Health Connect opt-in
      healthConnectOptIn: 'pending',
      setHealthConnectOptIn: (v) => set({ healthConnectOptIn: v }),

  // Tracking toggles — default OFF so the app never asks for permissions
  // until the user explicitly opts in on the Step Tracking onboarding screen.
  stepTrackingEnabled: false,
  setStepTrackingEnabled: (v) => set({ stepTrackingEnabled: v }),
  locationTrackingEnabled: false,
  setLocationTrackingEnabled: (v) => set({ locationTrackingEnabled: v }),
  backgroundNotificationEnabled: false,
  setBackgroundNotificationEnabled: (v) => set({ backgroundNotificationEnabled: v }),

      // First-install decision gate
      stepTrackingDecision: 'pending',
      setStepTrackingDecision: (v) => set({ stepTrackingDecision: v }),

      // Hard reset today's step counters
      clearTodaySteps: () => {
        const todayKey = new Date().toISOString().split('T')[0];
        set((s) => ({
          todaySteps: 0,
          todayDate: todayKey,
          activityLog: s.activityLog.filter((a) => a.date !== todayKey),
        }));
      },

      // Training Sessions
      trainingSessions: [],
      addTrainingSession: (session) =>
        set((s) => ({ trainingSessions: [session, ...s.trainingSessions] })),
      deleteTrainingSession: (id) =>
        set((s) => ({
          trainingSessions: s.trainingSessions.filter((t) => t.id !== id),
        })),
}),
    {
      name: 'fitspire-storage',
      storage: persistStorage,
      version: 2,
      migrate: (persisted: any, version: number) => {
        if (!persisted) return persisted;
        if (version < 2) {
          return {
            ...persisted,
            stepTrackingEnabled: persisted.stepTrackingEnabled ?? true,
            locationTrackingEnabled: persisted.locationTrackingEnabled ?? false,
            backgroundNotificationEnabled: persisted.backgroundNotificationEnabled ?? true,
            stepTrackingDecision: persisted.stepTrackingDecision ?? 'allowed',
          };
        }
        return persisted;
      },
      merge: (persisted, current) => {
        if (!persisted || typeof persisted !== 'object') return current;
        const p = persisted as Record<string, unknown>;
        const out: FitspireState = {
          ...current,
          ...(p as Partial<FitspireState>),
        };
        out.stepTrackingEnabled =
          typeof p.stepTrackingEnabled === 'boolean'
            ? (p.stepTrackingEnabled as boolean)
            : current.stepTrackingEnabled;
        out.locationTrackingEnabled =
          typeof p.locationTrackingEnabled === 'boolean'
            ? (p.locationTrackingEnabled as boolean)
            : current.locationTrackingEnabled;
        out.backgroundNotificationEnabled =
          typeof p.backgroundNotificationEnabled === 'boolean'
            ? (p.backgroundNotificationEnabled as boolean)
            : current.backgroundNotificationEnabled;
        out.stepTrackingDecision =
          p.stepTrackingDecision === 'allowed' || p.stepTrackingDecision === 'declined'
            ? (p.stepTrackingDecision as FitspireState['stepTrackingDecision'])
            : current.stepTrackingDecision;
        return out;
      },
    }
  )
);

export default useStore;
