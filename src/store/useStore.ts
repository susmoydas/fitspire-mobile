import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserProfile,
  WorkoutSession,
  Meal,
  DailyActivity,
  Notification,
  Goal,
  WorkoutExercise,
  Set,
  ExerciseCategory,
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

  // Meals
  meals: Meal[];
  addMeal: (meal: Meal) => void;
  deleteMeal: (id: string) => void;
  getMealsByDate: (date: string) => Meal[];

  // Activity
  activityLog: DailyActivity[];
  updateActivity: (activity: DailyActivity) => void;
  getActivityByDate: (date: string) => DailyActivity | null;

  // Notifications
  notifications: Notification[];
  addNotification: (n: Notification) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  // Goals
  goals: Goal[];
  updateGoal: (goal: Goal) => void;
  addGoal: (goal: Goal) => void;
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

      // Meals
      meals: [],
      addMeal: (meal) => set((s) => ({ meals: [...s.meals, meal] })),
      deleteMeal: (id) =>
        set((s) => ({ meals: s.meals.filter((m) => m.id !== id) })),
      getMealsByDate: (date) => get().meals.filter((m) => m.date === date),

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
      clearNotifications: () => set({ notifications: [] }),

      // Goals
      goals: [],
      updateGoal: (goal) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === goal.id ? goal : g)),
        })),
      addGoal: (goal) => set((s) => ({ goals: [...s.goals, goal] })),
    }),
    {
      name: 'fitspire-storage',
      getStorage: () => AsyncStorage,
    }
  )
);

export default useStore;
