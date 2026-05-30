import { useState, useEffect, useRef, useCallback } from 'react';
import { Pedometer } from 'expo-sensors';
import { useStore } from '../store/useStore';
import type { EventSubscription } from 'expo-modules-core';

function getStrideLength(heightCm: number): number {
  return (heightCm * 0.415) / 100;
}

export function useStepCounter() {
  const [steps, setSteps] = useState(0);
  const [isAvailable, setIsAvailable] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const updateActivity = useStore((s) => s.updateActivity);
  const setTodaySteps = useStore((s) => s.setTodaySteps);
  const profile = useStore((s) => s.profile);

  const lastStepCount = useRef(0);
  const dailyStepsAccum = useRef(0);
  const currentDate = useRef('');
  const subscription = useRef<EventSubscription | null>(null);
  const saveInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const todayRef = useRef('');

  const heightCm = profile.height || 170;
  const weightKg = profile.weight || 70;
  const strideLen = getStrideLength(heightCm);
  const distanceKm = (steps * strideLen) / 1000;
  const calories = Math.round(3.5 * weightKg * (steps / (10000 / 0.5)));

  const saveSteps = useCallback(() => {
    const today = todayRef.current;
    if (!today) return;
    const store = useStore.getState();
    const existing = store.activityLog.find((a) => a.date === today);
    updateActivity({
      date: today,
      steps: dailyStepsAccum.current,
      caloriesBurned: existing?.caloriesBurned || 0,
      sleepHours: existing?.sleepHours || 0,
      waterGlasses: existing?.waterGlasses || 0,
    });
    setTodaySteps(dailyStepsAccum.current, today);
  }, [updateActivity, setTodaySteps]);

  useEffect(() => {
    let mounted = true;

    async function setup() {
      const available = await Pedometer.isAvailableAsync();
      if (!mounted) return;
      if (!available) {
        setIsAvailable(false);
        return;
      }
      setIsAvailable(true);

      const { status } = await Pedometer.requestPermissionsAsync();
      if (!mounted) return;
      if (status !== 'granted') {
        setPermissionGranted(false);
        return;
      }
      setPermissionGranted(true);

      const today = new Date().toISOString().split('T')[0];
      currentDate.current = today;
      todayRef.current = today;

      const storeState = useStore.getState();
      const savedDate = storeState.todayDate;
      const savedSteps = storeState.todaySteps;

      try {
        const end = new Date();
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const pastResult = await Pedometer.getStepCountAsync(start, end);
        if (mounted && pastResult && typeof pastResult.steps === 'number') {
          const pedometerSteps = pastResult.steps;
          const restoredSteps = savedDate === today ? Math.max(savedSteps, pedometerSteps) : pedometerSteps;
          dailyStepsAccum.current = restoredSteps;
          setSteps(restoredSteps);
          setTodaySteps(restoredSteps, today);
        } else if (savedDate === today && savedSteps > 0) {
          dailyStepsAccum.current = savedSteps;
          setSteps(savedSteps);
        }
      } catch {
        if (savedDate === today && savedSteps > 0) {
          dailyStepsAccum.current = savedSteps;
          setSteps(savedSteps);
        }
      }

      lastStepCount.current = 0;

      const sub = Pedometer.watchStepCount((result) => {
        if (!mounted) return;

        const now = new Date().toISOString().split('T')[0];
        if (now !== currentDate.current) {
          saveSteps();
          dailyStepsAccum.current = 0;
          currentDate.current = now;
          todayRef.current = now;
          lastStepCount.current = 0;
        }

        if (lastStepCount.current === 0) {
          lastStepCount.current = result.steps;
          dailyStepsAccum.current = result.steps;
          setSteps(dailyStepsAccum.current);
          return;
        }

        const delta = result.steps - lastStepCount.current;
        if (delta < 0) {
          dailyStepsAccum.current = result.steps;
          setSteps(dailyStepsAccum.current);
        } else if (delta > 0 && delta < 10000) {
          dailyStepsAccum.current += delta;
          setSteps(dailyStepsAccum.current);
        }
        lastStepCount.current = result.steps;
      });

      subscription.current = sub;

      saveInterval.current = setInterval(() => {
        saveSteps();
      }, 30000);
    }

    setup();

    return () => {
      mounted = false;
      saveSteps();
      if (subscription.current) {
        subscription.current.remove();
      }
      if (saveInterval.current) {
        clearInterval(saveInterval.current);
      }
    };
  }, [saveSteps, updateActivity, setTodaySteps]);

  return {
    steps,
    distanceKm: Math.round(distanceKm * 100) / 100,
    calories: Math.round(calories),
    isAvailable,
    permissionGranted,
  };
}
