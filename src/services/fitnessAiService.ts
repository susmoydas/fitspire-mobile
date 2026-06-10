import { AI_CONFIG } from '../config/aiConfig';
import { useStore } from '../store/useStore';
import { sendGroqChatCompletion } from './ai/groqService';
import {
  getCurrentExerciseForAI,
  getCurrentWorkoutSessionForAI,
  type CurrentExerciseContext,
  type CurrentWorkoutSessionContext,
} from './fitnessAiContext';
import type { CompletedWorkout, DailyActivity, Goal } from '../types';

function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getMonthStart(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function sumStepsBetween(activityLog: DailyActivity[], fromDate: string, toDate: string): number {
  return activityLog
    .filter((a) => a.date >= fromDate && a.date <= toDate)
    .reduce((sum, a) => sum + (a.steps || 0), 0);
}

export interface FitnessContext {
  todaySteps: number | null;
  weeklySteps: number | null;
  monthlySteps: number | null;
  completedWorkoutsToday: CompletedWorkout[];
  recentWorkoutHistory: CompletedWorkout[];
  lastCompletedWorkout: CompletedWorkout | null;
  currentExerciseOnDetailPage: CurrentExerciseContext | null;
  currentWorkoutSession: CurrentWorkoutSessionContext | null;
  workoutDurationToday: number | null;
  totalWorkoutMinutesThisWeek: number | null;
  caloriesBurnedToday: number | null;
  waterIntakeToday: number | null;
  dailyWaterGoal: number | null;
  userGoal: string | null;
  userLevel: string | null;
  userAge: number | null;
  userHeight: number | null;
  userWeight: number | null;
  targetWeight: number | null;
  stepGoal: number | null;
  streakCount: number | null;
  restDayStatus: boolean | null;
  availableEquipment: string[] | null;
}

export function getFitnessAIContext(): FitnessContext {
  const state = useStore.getState();
  const today = getTodayDate();
  const weekStart = getWeekStart();
  const monthStart = getMonthStart();

  const profile = state.profile || {};
  const activityLog = state.activityLog || [];
  const completedWorkoutLog = state.completedWorkoutLog || [];
  const goals = state.goals || [];

  const todayActivity = activityLog.find((a) => a.date === today) || null;

  const todayWorkouts = completedWorkoutLog.filter((cw) => {
    const cwDate = cw.completedAt ? cw.completedAt.substring(0, 10) : '';
    return cwDate === today;
  });

  const weekWorkouts = completedWorkoutLog.filter((cw) => {
    const cwDate = cw.completedAt ? cw.completedAt.substring(0, 10) : '';
    return cwDate >= weekStart && cwDate <= today;
  });

  const waterGoal = goals.find((g: Goal) => g.type === 'water');
  const weightGoal = goals.find((g: Goal) => g.type === 'weight');
  const calorieGoal = goals.find((g: Goal) => g.type === 'calories');
  const stepGoal = goals.find((g: Goal) => g.type === 'steps');

  const lastWorkout = completedWorkoutLog.length > 0 ? completedWorkoutLog[0] : null;

  const caloriesBurnedToday = todayActivity?.caloriesBurned ?? null;

  let streakCount = 0;
  if (completedWorkoutLog.length > 0) {
    const dates = [...new Set(completedWorkoutLog.map((w) => w.completedAt.split('T')[0]))].sort().reverse();
    streakCount = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) streakCount++;
      else break;
    }
  }

  return {
    todaySteps: state.todaySteps ?? null,
    weeklySteps: sumStepsBetween(activityLog, weekStart, today) || null,
    monthlySteps: sumStepsBetween(activityLog, monthStart, today) || null,
    completedWorkoutsToday: todayWorkouts,
    recentWorkoutHistory: completedWorkoutLog.slice(0, 10),
    lastCompletedWorkout: lastWorkout,
    currentExerciseOnDetailPage: getCurrentExerciseForAI(),
    currentWorkoutSession: getCurrentWorkoutSessionForAI(),
    workoutDurationToday: todayWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0) || null,
    totalWorkoutMinutesThisWeek: weekWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0) || null,
    caloriesBurnedToday,
    waterIntakeToday: todayActivity?.waterGlasses ?? null,
    dailyWaterGoal: waterGoal?.target ?? null,
    userGoal: profile.fitnessGoal ?? null,
    userLevel: profile.experience ?? null,
    userWeight: profile.weight ?? null,
    userHeight: profile.height ?? null,
    userAge: profile.age ?? null,
    targetWeight: weightGoal?.target ?? null,
    stepGoal: stepGoal?.target ?? profile.stepGoal ?? null,
    streakCount: streakCount || null,
    restDayStatus: todayWorkouts.length === 0,
    availableEquipment: null,
  };
}

function containsBangla(text: string): boolean {
  return /[\u0980-\u09FF]/.test(text);
}

function containsHindi(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

function languageInstruction(userMessage: string): string {
  const hasBangla = containsBangla(userMessage);
  const hasHindi = containsHindi(userMessage);
  const hasEnglish = /[a-zA-Z]/.test(userMessage);
  if (hasBangla && hasEnglish) return 'Reply in the same mixed Bangla-English style the user used.';
  if (hasBangla) return 'Reply in Bangla.';
  if (hasHindi) return 'Reply in Hindi.';
  return 'Reply in English.';
}

const SYSTEM_PROMPT = `You are FitAI, a specialized fitness assistant inside Fitspire, a workout tracking app.

You help users with:
- Workout guidance (how to perform exercises, sets, reps, rest)
- Nutrition advice (food before/after workout, hydration, meal timing)
- Progress tracking (steps, calories, water, streak, weight)
- Fitness planning (what workout to do, how to improve)
- Recovery and rest guidance
- Bodybuilding, gym training, and general fitness

You must use the provided app data:
- Profile: goal, level, age, weight, height
- Today's activity: steps, calories burned, water intake
- Completed workouts today and this week
- Current exercise on detail page
- Active workout session
- Recent workout history
- Workout streak
- Rest day status

If data is not available, say "I don't have that data yet" and give a general suggestion.
NEVER say "I don't have access to your data" or "I can't see your data" — you DO have it and should use what's provided.

Always reply in the same language the user used.

Answer style:
- Short, practical, friendly
- Easy to understand
- Use bullet points when useful
- No long paragraphs

Use this structure when helpful:
Quick answer:
[short direct answer]

Based on your data:
• point

Suggestion:
• point

Safety:
Stop if you feel pain, dizziness, chest pain, or breathing problem.

Rules:
- Do not give medical diagnosis or treatment advice.
- Do not suggest extreme dieting or unsafe overtraining.
- Do not guarantee weight loss or muscle gain.
- Do not say supplements are required.
- For injury, chest pain, dizziness, fainting, breathing difficulty, pregnancy-related fitness, or serious health conditions, tell the user to consult a doctor or certified fitness professional.
- If user asks about the current workout, explain using current exercise or active session data.
- Do NOT mention API keys, environment variables, setup, configuration, or technical errors.
- Do NOT show subscription or upgrade messages.
- Always remind the user to listen to their body.`;

function buildContextString(ctx: FitnessContext): string {
  const parts: string[] = [];

  if (ctx.userGoal) parts.push(`User goal: ${ctx.userGoal}`);
  if (ctx.userLevel) parts.push(`Fitness level: ${ctx.userLevel}`);
  if (ctx.userAge != null) parts.push(`Age: ${ctx.userAge}`);
  if (ctx.userWeight != null) parts.push(`Weight: ${ctx.userWeight} kg`);
  if (ctx.userHeight != null) parts.push(`Height: ${ctx.userHeight} cm`);
  if (ctx.targetWeight != null) parts.push(`Target weight: ${ctx.targetWeight} kg`);
  if (ctx.stepGoal != null) parts.push(`Daily step goal: ${ctx.stepGoal}`);
  if (ctx.streakCount != null) parts.push(`Workout streak: ${ctx.streakCount} days`);

  if (ctx.todaySteps != null) parts.push(`Today's steps: ${ctx.todaySteps}`);
  if (ctx.weeklySteps != null) parts.push(`Weekly steps: ${ctx.weeklySteps}`);
  if (ctx.monthlySteps != null) parts.push(`Monthly steps: ${ctx.monthlySteps}`);

  if (ctx.completedWorkoutsToday.length > 0) {
    parts.push(`Workouts completed today: ${ctx.completedWorkoutsToday.length}`);
    ctx.completedWorkoutsToday.forEach((w) => {
      parts.push(`  - ${w.workoutTitle} (${w.duration}s, source: ${w.source || 'app'})`);
    });
  } else {
    parts.push('Workouts completed today: 0');
  }

  if (ctx.workoutDurationToday != null) parts.push(`Workout duration today (seconds): ${ctx.workoutDurationToday}`);
  if (ctx.totalWorkoutMinutesThisWeek != null) {
    parts.push(`Total workout time this week (seconds): ${ctx.totalWorkoutMinutesThisWeek}`);
  }

  if (ctx.caloriesBurnedToday != null) parts.push(`Calories burned today: ${ctx.caloriesBurnedToday}`);

  if (ctx.waterIntakeToday != null) parts.push(`Water intake today (glasses): ${ctx.waterIntakeToday}`);
  if (ctx.dailyWaterGoal != null) parts.push(`Daily water goal (glasses): ${ctx.dailyWaterGoal}`);

  if (ctx.restDayStatus != null) {
    parts.push(ctx.restDayStatus ? 'Rest day status: no workout logged today yet' : 'User has trained today');
  }

  if (ctx.lastCompletedWorkout) {
    const lw = ctx.lastCompletedWorkout;
    parts.push(`Last workout: ${lw.workoutTitle} (${lw.category}, ${lw.difficulty})`);
  }

  if (ctx.recentWorkoutHistory.length > 0) {
    const recent = ctx.recentWorkoutHistory
      .slice(0, 5)
      .map((w) => w.workoutTitle)
      .join(', ');
    parts.push(`Recent workouts: ${recent}`);
  }

  if (ctx.currentExerciseOnDetailPage) {
    const ex = ctx.currentExerciseOnDetailPage;
    parts.push(`Current exercise on detail page: ${ex.exerciseName}`);
    if (ex.sets != null && ex.reps != null) parts.push(`  Sets/reps: ${ex.sets} x ${ex.reps}`);
    if (ex.restTime != null) parts.push(`  Rest: ${ex.restTime}s`);
    if (ex.equipment) parts.push(`  Equipment: ${ex.equipment}`);
    if (ex.bodyPart) parts.push(`  Body part: ${ex.bodyPart}`);
    if (ex.targetMuscle) parts.push(`  Target: ${ex.targetMuscle}`);
    if (ex.instructions?.length) {
      parts.push(`  Instructions: ${ex.instructions.slice(0, 5).join(' | ')}`);
    }
  }

  if (ctx.currentWorkoutSession) {
    const s = ctx.currentWorkoutSession;
    parts.push(`Active workout session: ${s.workoutTitle}`);
    if (s.exerciseName) parts.push(`  Current exercise: ${s.exerciseName}`);
    if (s.source) parts.push(`  Source: ${s.source}`);
  }

  return parts.join('\n');
}

export interface FitnessChatResult {
  success: boolean;
  reply?: string;
  error?: string;
}

export async function sendFitnessChatMessage(
  userMessage: string,
  fitnessContext?: FitnessContext,
): Promise<FitnessChatResult> {
  if (!userMessage?.trim()) {
    return { success: false, error: 'Please write your question first.' };
  }

  const key = AI_CONFIG.geminiApiKey;
  if (!key) {
    return {
      success: false,
      error: 'AI assistant is not available right now. Please try again later.',
    };
  }

  const ctx = fitnessContext ?? getFitnessAIContext();
  const contextStr = buildContextString(ctx);
  const langInstruction = languageInstruction(userMessage);

  const userPrompt = `User question: ${userMessage.trim()}

Current app data:
${contextStr || 'No app data available yet.'}

${langInstruction}

Answer using the structure when helpful. Preserve line breaks.`;

  const result = await sendGroqChatCompletion(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    0.6,
    800,
  );

  if (!result.success) {
    return { success: false, error: result.error || 'AI assistant is not available right now. Please try again later.' };
  }

  return { success: true, reply: result.content };
}

export function isGroqConfigured(): boolean {
  const key = AI_CONFIG.geminiApiKey;
  return !!key;
}
