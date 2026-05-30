import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { useNotifications } from './useNotifications';

const DAILY_TARGET_STEPS = 14000;
const MILESTONES = [0.25, 0.50, 0.75, 1.0];

export function useStepGoalNotifier() {
  const todaySteps = useStore((s) => s.todaySteps);
  const todayDate = useStore((s) => s.todayDate);
  const profile = useStore((s) => s.profile);
  const { scheduleStepGoalNotification, showLiveActivity, cancelLiveActivity } =
    useNotifications();

  const notifiedMilestones = useRef<Set<string>>(new Set());
  const prevDateRef = useRef(todayDate);
  const lastLiveUpdate = useRef(0);

  useEffect(() => {
    if (todayDate !== prevDateRef.current) {
      notifiedMilestones.current.clear();
      prevDateRef.current = todayDate;
      cancelLiveActivity();
    }
  }, [todayDate, cancelLiveActivity]);

  useEffect(() => {
    const weightKg = profile?.weight || 70;
    const calories = Math.round(3.5 * weightKg * (todaySteps / (10000 / 0.5)));
    const progress = Math.min(todaySteps / DAILY_TARGET_STEPS, 1);

    const now = Date.now();
    if (todaySteps > 0 && now - lastLiveUpdate.current > 30000) {
      lastLiveUpdate.current = now;
      showLiveActivity(todaySteps, calories, progress);
    }

    for (const milestone of MILESTONES) {
      const threshold = Math.round(DAILY_TARGET_STEPS * milestone);
      if (todaySteps >= threshold) {
        const key = `${prevDateRef.current}-${milestone}`;
        if (!notifiedMilestones.current.has(key)) {
          notifiedMilestones.current.add(key);
          scheduleStepGoalNotification(milestone * 100);
        }
      }
    }
  }, [todaySteps, profile, scheduleStepGoalNotification, showLiveActivity]);

  return null;
}
