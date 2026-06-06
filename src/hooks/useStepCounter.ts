import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { useStore } from '../store/useStore';
import type { EventSubscription } from 'expo-modules-core';
import {
  initHealthConnect,
  getTodayStepsFromHealthConnect,
  getStepsForDay,
  requestHealthConnectPermissions,
} from '../services/healthConnectSteps';
import { refreshPermissionStatuses } from '../services/permissions';

function getStrideLength(heightCm: number): number {
  return (heightCm * 0.415) / 100;
}

function getDateKey(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function useStepCounter() {
  const [steps, setSteps] = useState(0);
  const [isAvailable, setIsAvailable] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [healthConnectActive, setHealthConnectActive] = useState(false);
  const [needsHealthConnectInstall, setNeedsHealthConnectInstall] = useState(false);

  const updateActivity = useStore((s) => s.updateActivity);
  const setTodaySteps = useStore((s) => s.setTodaySteps);
  const setHealthConnectOptIn = useStore((s) => s.setHealthConnectOptIn);
  const stepTrackingEnabled = useStore((s) => s.stepTrackingEnabled);
  const profile = useStore((s) => s.profile);

  const lastStepCount = useRef(0);
  const dailyStepsAccum = useRef(0);
  const healthConnectFloor = useRef(0);
  const currentDate = useRef('');
  const subscription = useRef<EventSubscription | null>(null);
  const saveInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const firstPedometerEvent = useRef(true);
  const lastHCSyncAt = useRef(0);

  const todayRef = useRef('');

  const heightCm = profile.height || 170;
  const weightKg = profile.weight || 70;
  const strideLen = getStrideLength(heightCm);
  const distanceKm = (steps * strideLen) / 1000;
  const calories = Math.round(3.5 * weightKg * (steps / (10000 / 0.5)));

  const writeStepsToStore = useCallback(
    (totalSteps: number, dateKey: string) => {
      if (!dateKey) return;
      const store = useStore.getState();
      const existing = store.activityLog.find((a) => a.date === dateKey);
      updateActivity({
        date: dateKey,
        steps: totalSteps,
        caloriesBurned: existing?.caloriesBurned || 0,
        sleepHours: existing?.sleepHours || 0,
        waterGlasses: existing?.waterGlasses || 0,
      });
      setTodaySteps(totalSteps, dateKey);
    },
    [updateActivity, setTodaySteps]
  );

  const flushPreviousDayFromHC = useCallback(
    async (previousDateKey: string) => {
      if (Platform.OS !== 'android') return;
      if (!previousDateKey) return;
      const prev = new Date(previousDateKey + 'T00:00:00');
      const total = await getStepsForDay(prev);
      if (total > 0) {
        const store = useStore.getState();
        const existing = store.activityLog.find((a) => a.date === previousDateKey);
        updateActivity({
          date: previousDateKey,
          steps: total,
          caloriesBurned: existing?.caloriesBurned || 0,
          sleepHours: existing?.sleepHours || 0,
          waterGlasses: existing?.waterGlasses || 0,
        });
      }
    },
    [updateActivity]
  );

  const syncFromHealthConnect = useCallback(
    async (force = false) => {
      if (Platform.OS !== 'android') return;
      const now = Date.now();
      if (!force && now - lastHCSyncAt.current < 5000) return;
      lastHCSyncAt.current = now;

      try {
        const todayTotal = await getTodayStepsFromHealthConnect();
        const todayKey = getDateKey(new Date());
        if (currentDate.current && currentDate.current !== todayKey) {
          await flushPreviousDayFromHC(currentDate.current);
          currentDate.current = todayKey;
          todayRef.current = todayKey;
          healthConnectFloor.current = todayTotal;
          dailyStepsAccum.current = Math.max(dailyStepsAccum.current, todayTotal);
          setSteps(dailyStepsAccum.current);
          writeStepsToStore(dailyStepsAccum.current, todayKey);
          return;
        }
        healthConnectFloor.current = todayTotal;
        const next = Math.max(dailyStepsAccum.current, todayTotal);
        if (next !== dailyStepsAccum.current) {
          dailyStepsAccum.current = next;
          setSteps(next);
        }
        if (currentDate.current !== todayKey) {
          currentDate.current = todayKey;
          todayRef.current = todayKey;
        }
        writeStepsToStore(dailyStepsAccum.current, todayKey);
      } catch {
        // ignore — local pedometer remains the source
      }
    },
    [flushPreviousDayFromHC, writeStepsToStore]
  );

  useEffect(() => {
    let mounted = true;

    if (!stepTrackingEnabled) {
      setIsAvailable(false);
      setPermissionGranted(false);
      setHealthConnectActive(false);
      setNeedsHealthConnectInstall(false);
      return;
    }

    async function setup() {
      try {
        // Only check existing permissions — never request at app launch.
        // The user grants permissions explicitly on the Step Tracking
        // onboarding screen (or later from Profile).
        let statuses;
        try {
          statuses = await refreshPermissionStatuses();
        } catch {
          statuses = {
            activityRecognition: 'unavailable' as const,
            location: 'unavailable' as const,
            notification: 'unavailable' as const,
          };
        }
        if (!mounted) return;
        if (statuses.activityRecognition === 'granted') {
          setPermissionGranted(true);
        } else {
          setPermissionGranted(false);
        }
        const todayKey = getDateKey(new Date());
        currentDate.current = todayKey;
        todayRef.current = todayKey;

        if (Platform.OS === 'android') {
          let status;
          try {
            status = await initHealthConnect();
          } catch {
            status = {
              sdkAvailable: false,
              providerInstalled: false,
              permissionsGranted: false,
            };
          }
          if (!mounted) return;

          if (!status || status.notInstalled) {
            setNeedsHealthConnectInstall(true);
            setHealthConnectActive(false);
          } else if (!status.sdkAvailable) {
            setNeedsHealthConnectInstall(!!status.needsUpdate);
            setHealthConnectActive(false);
          } else {
            setNeedsHealthConnectInstall(false);
            const granted = !!status.permissionsGranted;
            if (granted) {
              setHealthConnectOptIn('granted');
            }
            setHealthConnectActive(granted);
            if (granted) {
              try {
                await syncFromHealthConnect(true);
              } catch {
                /* ignore */
              }
              if (!mounted) return;
            }
          }
        }

        let available = false;
        try {
          available = await Pedometer.isAvailableAsync();
        } catch {
          available = false;
        }
        if (!mounted) return;
        if (!available) {
          setIsAvailable(false);
          return;
        }
        setIsAvailable(true);

      const storeState = useStore.getState();
      const savedDate = storeState.todayDate;
      const savedSteps = storeState.todaySteps;

      if (Platform.OS !== 'android') {
        try {
          const end = new Date();
          const start = new Date();
          start.setHours(0, 0, 0, 0);
          const pastResult = await Pedometer.getStepCountAsync(start, end);
          if (mounted && pastResult && typeof pastResult.steps === 'number') {
            const pedometerSteps = pastResult.steps;
            const restoredSteps =
              savedDate === todayKey ? Math.max(savedSteps, pedometerSteps) : pedometerSteps;
            dailyStepsAccum.current = restoredSteps;
            setSteps(restoredSteps);
            setTodaySteps(restoredSteps, todayKey);
          } else if (savedDate === todayKey && savedSteps > 0) {
            dailyStepsAccum.current = savedSteps;
            setSteps(savedSteps);
          }
        } catch {
          if (savedDate === todayKey && savedSteps > 0) {
            dailyStepsAccum.current = savedSteps;
            setSteps(savedSteps);
          }
        }
      } else {
        if (savedDate && savedDate !== todayKey) {
          await flushPreviousDayFromHC(savedDate);
          if (!mounted) return;
        }
        if (savedDate === todayKey && savedSteps > 0) {
          const floor = healthConnectFloor.current;
          const restored = Math.max(floor, savedSteps);
          dailyStepsAccum.current = restored;
          if (restored !== savedSteps) {
            setSteps(restored);
            writeStepsToStore(restored, todayKey);
          } else {
            setSteps(restored);
          }
        } else if (healthConnectFloor.current > 0) {
          dailyStepsAccum.current = healthConnectFloor.current;
          setSteps(healthConnectFloor.current);
          writeStepsToStore(healthConnectFloor.current, todayKey);
        }
      }

      lastStepCount.current = 0;
      firstPedometerEvent.current = true;

      const sub = Pedometer.watchStepCount((result) => {
        if (!mounted) return;
        if (!useStore.getState().stepTrackingEnabled) return;

        const nowKey = getDateKey(new Date());
        if (nowKey !== currentDate.current) {
          writeStepsToStore(dailyStepsAccum.current, currentDate.current);
          currentDate.current = nowKey;
          todayRef.current = nowKey;
          healthConnectFloor.current = 0;
          dailyStepsAccum.current = 0;
          lastStepCount.current = 0;
          firstPedometerEvent.current = true;
          if (Platform.OS === 'android') {
            syncFromHealthConnect(true);
          }
          return;
        }

        if (firstPedometerEvent.current) {
          firstPedometerEvent.current = false;
          lastStepCount.current = result.steps;
          if (healthConnectFloor.current > dailyStepsAccum.current) {
            dailyStepsAccum.current = healthConnectFloor.current;
            setSteps(dailyStepsAccum.current);
          }
          return;
        }

        const delta = result.steps - lastStepCount.current;
        lastStepCount.current = result.steps;

        if (delta < 0) {
          dailyStepsAccum.current = Math.max(
            healthConnectFloor.current,
            result.steps
          );
          setSteps(dailyStepsAccum.current);
        } else if (delta > 0 && delta < 10000) {
          dailyStepsAccum.current += delta;
          if (
            healthConnectFloor.current > 0 &&
            dailyStepsAccum.current < healthConnectFloor.current
          ) {
            dailyStepsAccum.current = healthConnectFloor.current;
          }
          setSteps(dailyStepsAccum.current);
        }
      });

      subscription.current = sub;

      saveInterval.current = setInterval(() => {
        if (currentDate.current) {
          writeStepsToStore(dailyStepsAccum.current, currentDate.current);
        }
      }, 30000);
      } catch {
        // Never let a tracking/permission error crash the app.
        if (!mounted) return;
        setIsAvailable(false);
        setPermissionGranted(false);
        setHealthConnectActive(false);
      }
    }

    setup();

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && Platform.OS === 'android') {
        syncFromHealthConnect(true);
      }
    });

    return () => {
      mounted = false;
      if (subscription.current) {
        subscription.current.remove();
      }
      if (saveInterval.current) {
        clearInterval(saveInterval.current);
      }
      if (currentDate.current && dailyStepsAccum.current >= 0) {
        writeStepsToStore(dailyStepsAccum.current, currentDate.current);
      }
      appStateSub.remove();
    };
  }, [
    syncFromHealthConnect,
    flushPreviousDayFromHC,
    setHealthConnectOptIn,
    setTodaySteps,
    writeStepsToStore,
  ]);

  return {
    steps,
    distanceKm: Math.round(distanceKm * 100) / 100,
    calories: Math.round(calories),
    isAvailable,
    permissionGranted,
    healthConnectActive,
    needsHealthConnectInstall,
  };
}
