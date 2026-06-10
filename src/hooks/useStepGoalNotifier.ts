import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import {
  setStepNotificationActionHandler,
  useNotifications,
} from './useNotifications';
import { calculateCaloriesFromSteps, calculateDistanceKm } from '../utils/calculations';

const DEBOUNCE_MS = 30000;

export function useStepLiveActivity(opts: { permissionGranted: boolean; isAvailable: boolean }) {
  const { permissionGranted, isAvailable } = opts;
  const todaySteps = useStore((s) => s.todaySteps);
  const todayDate = useStore((s) => s.todayDate);
  const profile = useStore((s) => s.profile);
  const stepTrackingEnabled = useStore((s) => s.stepTrackingEnabled);
  const backgroundNotificationEnabled = useStore((s) => s.backgroundNotificationEnabled);
  const setStepTrackingEnabled = useStore((s) => s.setStepTrackingEnabled);
  const clearTodaySteps = useStore((s) => s.clearTodaySteps);

  const { updateLiveSteps, clearLiveSteps } = useNotifications();

  const lastTick = useRef(0);
  const lastDate = useRef(todayDate);

  useEffect(() => {
    setStepNotificationActionHandler((action) => {
      if (action === 'pause') {
        setStepTrackingEnabled(false);
      } else if (action === 'stop') {
        setStepTrackingEnabled(false);
        clearTodaySteps();
      } else if (action === 'open') {
        // The OS brings the app to foreground. Nothing to do.
      }
    });
    return () => setStepNotificationActionHandler(null);
  }, [setStepTrackingEnabled, clearTodaySteps]);

  useEffect(() => {
    if (lastDate.current && lastDate.current !== todayDate) {
      clearLiveSteps();
      lastDate.current = todayDate;
    }
  }, [todayDate, clearLiveSteps]);

  useEffect(() => {
    const canShow =
      stepTrackingEnabled &&
      backgroundNotificationEnabled &&
      permissionGranted &&
      isAvailable;

    if (!canShow) {
      clearLiveSteps();
      return;
    }

    const weightKg = profile?.weight || 70;
    const heightCm = profile?.height || 170;
    const calories = calculateCaloriesFromSteps(todaySteps, weightKg);
    const distanceKm = calculateDistanceKm(todaySteps, heightCm);
    const goal = profile?.stepGoal || 10000;

    const now = Date.now();
    if (now - lastTick.current < DEBOUNCE_MS) return;
    lastTick.current = now;
    updateLiveSteps({
      steps: todaySteps,
      calories,
      distanceKm,
      paused: false,
      goal,
    });
  }, [
    todaySteps,
    profile,
    stepTrackingEnabled,
    backgroundNotificationEnabled,
    permissionGranted,
    isAvailable,
    updateLiveSteps,
    clearLiveSteps,
  ]);
}
