import type { DailyActivity, CompletedWorkout, WorkoutSession } from '../types';
import { getExerciseById } from '../data/exercises';

export interface WeekDayStatus {
  date: Date;
  label: string;
  status: 'completed' | 'rest' | 'missed' | 'upcoming';
  workoutsCompleted: number;
}

export interface TrainingWeekSummary {
  days: WeekDayStatus[];
  completedCount: number;
  weeklyGoal: number;
  completionPercent: number;
  percentOnTrack: number;
}

export interface WorkoutSummaryData {
  completedThisWeek: number;
  weeklyGoal: number;
  completionPercent: number;
  totalWorkouts: number;
  totalActiveMinutes: number;
  totalCaloriesBurned: number;
  avgDurationMinutes: number;
  mostLoggedCategory: string;
  totalSets: number;
}

export interface PersonalRecord {
  exerciseName: string;
  value: number;
  unit: string;
  achievedAt: string;
  change?: number;
  previousValue?: number;
}

export interface MuscleSummary {
  muscle: string;
  count: number;
}

export interface StepDayData {
  date: Date;
  steps: number;
  key: string;
  goal: number;
}

// Helpers
function getDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getWeekId(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
}

function getWeekRange(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: monday, end: sunday };
}

function getDaysInWeek(date: Date): Date[] {
  const { start } = getWeekRange(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function getDaysInMonth(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;
  return Array.from({ length: totalCells }, (_, i) => {
    const d = new Date(year, month, 1 + i - offset);
    return d;
  });
}

// Step data
export function getWeeklyStepData(
  activityLog: DailyActivity[],
  date: Date,
  stepGoal: number
): StepDayData[] {
  const days = getDaysInWeek(date);
  return days.map((d) => {
    const key = getDateKey(d);
    const dayLog = activityLog.find((a) => a.date === key);
    return { date: d, steps: dayLog?.steps || 0, key, goal: stepGoal };
  });
}

export function getMonthlyStepData(
  activityLog: DailyActivity[],
  date: Date,
  stepGoal: number
): StepDayData[] {
  const days = getDaysInMonth(date);
  return days.map((d) => {
    const key = getDateKey(d);
    const dayLog = activityLog.find((a) => a.date === key);
    return { date: d, steps: dayLog?.steps || 0, key, goal: stepGoal };
  });
}

export function getStepStats(
  data: StepDayData[],
  currentDate: Date
): { totalSteps: number; avgSteps: number; bestDay: number; goalRate: number; activeDays: number } {
  const todayKey = getDateKey(currentDate);
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const filtered = data.filter(
    (d) => d.date.getMonth() === currentMonth && d.date.getFullYear() === currentYear && d.date <= currentDate
  );
  const totalSteps = filtered.reduce((sum, d) => sum + d.steps, 0);
  const activeDays = filtered.filter((d) => d.steps > 0).length;
  const avgSteps = activeDays > 0 ? Math.round(totalSteps / activeDays) : 0;
  const bestDay = filtered.length > 0 ? Math.max(...filtered.map((d) => d.steps)) : 0;
  const goalRate = filtered.length > 0
    ? Math.round((filtered.filter((d) => d.steps >= d.goal).length / filtered.length) * 100)
    : 0;
  return { totalSteps, avgSteps, bestDay, goalRate, activeDays };
}

// Training week status
export function getTrainingWeekStatus(
  completedWorkoutLog: CompletedWorkout[],
  date: Date,
  weeklyGoal: number
): TrainingWeekSummary {
  const days = getDaysInWeek(date);
  const now = new Date();
  const todayKey = getDateKey(now);

  const dayStatuses: WeekDayStatus[] = days.map((d) => {
    const key = getDateKey(d);
    const dayWorkouts = completedWorkoutLog.filter((cw) => {
      const cwDate = cw.completedAt.substring(0, 10);
      return cwDate === key;
    });
    const isFuture = d > now;
    const isToday = key === todayKey;
    const hasCompleted = dayWorkouts.length > 0;

    let status: WeekDayStatus['status'];
    if (isFuture) {
      status = 'upcoming';
    } else if (hasCompleted) {
      status = 'completed';
    } else if (isToday) {
      status = 'upcoming';
    } else {
      status = 'missed';
    }

    return {
      date: d,
      label: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()],
      status,
      workoutsCompleted: dayWorkouts.length,
    };
  });

  const completedCount = dayStatuses.filter((d) => d.status === 'completed').length;
  const pastDays = dayStatuses.filter((d) => d.status !== 'upcoming').length;
  const completionPercent = pastDays > 0
    ? Math.round((completedCount / Math.max(pastDays, weeklyGoal)) * 100)
    : 0;
  const percentOnTrack = weeklyGoal > 0
    ? Math.round((completedCount / weeklyGoal) * 100)
    : 0;

  return {
    days: dayStatuses,
    completedCount,
    weeklyGoal,
    completionPercent: Math.min(completionPercent, 100),
    percentOnTrack: Math.min(percentOnTrack, 100),
  };
}

// Workout summary
export function getWorkoutSummary(
  completedWorkoutLog: CompletedWorkout[],
  date: Date,
  weeklyGoal: number
): WorkoutSummaryData {
  const weekId = getWeekId(date);
  const weekWorkouts = completedWorkoutLog.filter((cw) => {
    const cwDate = cw.completedAt.substring(0, 10);
    const cwWeekId = getWeekId(new Date(cwDate));
    return cwWeekId === weekId;
  });

  const completedThisWeek = weekWorkouts.length;
  const totalWorkouts = completedWorkoutLog.length;
  const totalActiveMinutes = weekWorkouts.reduce((sum, w) => sum + Math.round(w.duration / 60), 0);
  const totalCaloriesBurned = weekWorkouts.reduce((sum, w) => sum + (w.calories || 0), 0);
  const avgDurationSeconds =
    weekWorkouts.length > 0
      ? Math.round(weekWorkouts.reduce((sum, w) => sum + w.duration, 0) / weekWorkouts.length)
      : 0;
  const avgDurationMinutes = Math.round(avgDurationSeconds / 60);

  const categoryCounts: Record<string, number> = {};
  weekWorkouts.forEach((w) => {
    categoryCounts[w.category] = (categoryCounts[w.category] || 0) + 1;
  });
  const mostLoggedCategory =
    Object.entries(categoryCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || '';

  const totalSets = weekWorkouts.reduce((sum, w) => sum + (w.exercisesCompleted || 0), 0);

  const completionPercent = weeklyGoal > 0
    ? Math.min(Math.round((completedThisWeek / weeklyGoal) * 100), 100)
    : completedThisWeek > 0 ? 100 : 0;

  return {
    completedThisWeek,
    weeklyGoal,
    completionPercent,
    totalWorkouts,
    totalActiveMinutes,
    totalCaloriesBurned,
    avgDurationMinutes,
    mostLoggedCategory,
    totalSets,
  };
}

// Personal records
export function getPersonalRecords(
  workoutSessions: WorkoutSession[]
): PersonalRecord[] {
  const completed = workoutSessions.filter((s) => s.completed && s.exercises?.length > 0);
  if (completed.length === 0) return [];

  const exerciseMaxes: Record<string, { maxKg: number; maxReps: number; date: string }> = {};

  completed.forEach((session) => {
    (session.exercises || []).forEach((we) => {
      const exercise = getExerciseById(we.exerciseId);
      const name = exercise?.name || we.exerciseId;

      (we.sets || []).forEach((set) => {
        if (set.completed) {
          if (!exerciseMaxes[name]) {
            exerciseMaxes[name] = { maxKg: 0, maxReps: 0, date: session.completedAt || session.date };
          }
          if (set.kg > exerciseMaxes[name].maxKg) {
            exerciseMaxes[name].maxKg = set.kg;
            exerciseMaxes[name].date = session.completedAt || session.date;
          }
          if (set.reps > exerciseMaxes[name].maxReps) {
            exerciseMaxes[name].maxReps = set.reps;
          }
        }
      });
    });
  });

  return Object.entries(exerciseMaxes)
    .filter(([, data]) => data.maxKg > 0 || data.maxReps > 0)
    .sort(([, a], [, b]) => b.maxKg - a.maxKg)
    .slice(0, 10)
    .map(([name, data]) => ({
      exerciseName: name,
      value: data.maxKg > 0 ? data.maxKg : data.maxReps,
      unit: data.maxKg > 0 ? 'kg' : 'reps',
      achievedAt: data.date,
    }));
}

// Muscle summary
export function getMuscleSummary(
  completedWorkoutLog: CompletedWorkout[]
): MuscleSummary[] {
  const muscleCounts: Record<string, number> = {};

  const recentLogs = completedWorkoutLog.slice(0, 50);

  recentLogs.forEach((cw) => {
    (cw.targetMuscles || []).forEach((muscle) => {
      muscleCounts[muscle] = (muscleCounts[muscle] || 0) + 1;
    });
  });

  return Object.entries(muscleCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([muscle, count]) => ({ muscle, count }));
}

// Next workout
export function getNextWorkout(
  completedWorkoutLog: CompletedWorkout[],
  plans: { id: string; title: string; imageUrl: string; duration: number; exerciseCount: number; targetMuscles: string[]; difficulty: string; category: string }[]
): {
  plan: typeof plans[0] | null;
  label: string;
} | null {
  if (plans.length === 0) return null;

  const lastCompleted = completedWorkoutLog[0];
  if (!lastCompleted) {
    return { plan: plans[0], label: 'Start Here' };
  }

  const lastIndex = plans.findIndex((p) => p.id === lastCompleted.workoutId);
  const nextIndex = lastIndex >= 0 && lastIndex < plans.length - 1 ? lastIndex + 1 : 0;

  const now = new Date();
  const lastDate = lastCompleted.completedAt ? new Date(lastCompleted.completedAt) : now;
  const daysSince = Math.round((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  let label: string;
  if (daysSince === 0) label = 'Today';
  else if (daysSince === 1) label = 'Yesterday';
  else if (daysSince <= 3) label = `${daysSince} days ago`;
  else label = 'Start fresh';

  return { plan: plans[nextIndex], label };
}

// Recent workouts with plan images
export function getRecentWorkoutsWithImages(
  completedWorkoutLog: CompletedWorkout[],
  plans: { id: string; imageUrl: string; title: string }[],
  limit = 5
): (CompletedWorkout & { imageUrl?: string })[] {
  return completedWorkoutLog.slice(0, limit).map((cw) => {
    const plan = plans.find((p) => p.id === cw.workoutId || p.title === cw.workoutTitle);
    return { ...cw, imageUrl: plan?.imageUrl || '' };
  });
}

// Volume trend
export function getVolumeTrend(
  completedWorkoutLog: CompletedWorkout[],
  workoutSessions: WorkoutSession[]
): { weeks: { label: string; volume: number; workoutCount: number }[]; currentWeekVolume: number; lastWeekVolume: number; changePercent: number } {
  const now = new Date();
  const weeks: { label: string; volume: number; workoutCount: number }[] = [];

  for (let w = 4; w >= 0; w--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1 - w * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const weekWorkouts = completedWorkoutLog.filter((cw) => {
      const cwDate = new Date(cw.completedAt);
      return cwDate >= weekStart && cwDate <= weekEnd;
    });

    const weekSessions = workoutSessions.filter((ws) => {
      const wsDate = new Date(ws.completedAt || ws.date);
      return wsDate >= weekStart && wsDate <= weekEnd;
    });

    let volume = 0;
    weekSessions.forEach((ws) => {
      (ws.exercises || []).forEach((we) => {
        (we.sets || []).forEach((set) => {
          if (set.completed) volume += (set.kg || 0) * (set.reps || 0);
        });
      });
    });

    volume += weekWorkouts.length * 100;

    const label = `W${w === 0 ? 'This' : String(-w)}`;
    weeks.push({ label, volume, workoutCount: weekWorkouts.length });
  }

  const currentWeekVolume = weeks[weeks.length - 1]?.volume || 0;
  const lastWeekVolume = weeks[weeks.length - 2]?.volume || 0;
  const changePercent = lastWeekVolume > 0
    ? Math.round(((currentWeekVolume - lastWeekVolume) / lastWeekVolume) * 100)
    : currentWeekVolume > 0 ? 100 : 0;

  return { weeks, currentWeekVolume, lastWeekVolume, changePercent };
}
