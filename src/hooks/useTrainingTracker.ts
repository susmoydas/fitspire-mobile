import { useState, useRef, useCallback, useEffect } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import * as Location from 'expo-location';
import { Pedometer } from 'expo-sensors';
import * as TaskManager from 'expo-task-manager';
import type { Coordinate, TrainingMode, TrainingSession } from '../types';
import { useStore } from '../store/useStore';
import { calculateCaloriesFromDuration, getStrideLength, haversineDistanceKm } from '../utils/calculations';

const LOCATION_TASK = 'fitspire-background-location';

interface TrainingTrackerState {
  status: 'idle' | 'active' | 'paused' | 'finished';
  timer: number;
  distance: number;
  steps: number;
  calories: number;
  route: Coordinate[];
  currentLocation: Coordinate | null;
  avgPace: string;
}

const MAX_ROUTE_POINTS = 5000;

function calculatePace(duration: number, distance: number): string {
  if (distance < 1) return '--:--';
  const minutesPerKm = duration / 60 / (distance / 1000);
  const min = Math.floor(minutesPerKm);
  const sec = Math.round((minutesPerKm - min) * 60);
  return `${min}:${sec.toString().padStart(2, '0')} min/km`;
}

let bgCoords: Coordinate[] = [];

TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error) return;
  if (data && (data as any).locations) {
    const locations = (data as any).locations as Location.LocationObject[];
    for (const loc of locations) {
      bgCoords.push({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        timestamp: loc.timestamp,
      });
    }
  }
});

export function useTrainingTracker(mode: TrainingMode) {
  const profile = useStore((s) => s.profile);
  const addTrainingSession = useStore((s) => s.addTrainingSession);
  const setActiveSession = useStore((s) => s.setActiveSession);
  const updateActiveSession = useStore((s) => s.updateActiveSession);
  const activeSession = useStore((s) => s.activeSession);

  const getInitialStatus = (s: 'idle' | 'running' | 'paused' | null | undefined): 'idle' | 'active' | 'paused' => {
    if (s === 'running') return 'active';
    if (s === 'paused') return 'paused';
    return 'idle';
  };

  const [state, setState] = useState<TrainingTrackerState>(() => {
    if (activeSession && activeSession.activityType === mode && activeSession.status !== 'idle') {
      const recoveredRoute = Array.isArray(activeSession.route) ? activeSession.route : [];
      const recoveredDistance = activeSession.distanceKm > 0
        ? activeSession.distanceKm * 1000
        : (recoveredRoute.length > 1 ? haversineDistanceKm(recoveredRoute) * 1000 : 0);
      return {
        status: getInitialStatus(activeSession.status),
        timer: activeSession.durationSeconds,
        distance: recoveredDistance,
        steps: activeSession.steps,
        calories: activeSession.calories,
        route: recoveredRoute,
        currentLocation: recoveredRoute.length > 0 ? recoveredRoute[recoveredRoute.length - 1] : null,
        avgPace: recoveredDistance > 10 && activeSession.durationSeconds > 60
          ? calculatePace(activeSession.durationSeconds, recoveredDistance)
          : '--:--',
      };
    }
    return {
      status: 'idle',
      timer: 0,
      distance: 0,
      steps: 0,
      calories: 0,
      route: [],
      currentLocation: null,
      avgPace: '--:--',
    };
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const locationSub = useRef<Location.LocationSubscription | null>(null);
  const pedometerSub = useRef<any>(null);
  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  const pauseStartRef = useRef<number>(0);
  const lastStepRef = useRef<number>(0);
  const mountedRef = useRef(true);
  const saveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bgTaskStarted = useRef(false);

  const saveActiveSession = useCallback((s: TrainingTrackerState) => {
    const now = new Date().toISOString();
    updateActiveSession({
      durationSeconds: s.timer,
      steps: s.steps,
      distanceKm: Math.round((s.distance / 1000) * 100) / 100,
      calories: Math.round(s.calories * 10) / 10,
      endTime: now,
      route: s.route,
    });
  }, [updateActiveSession]);

  const startLocationTracking = useCallback(async (isBackground = false) => {
    if (locationSub.current) {
      locationSub.current.remove();
      locationSub.current = null;
    }
    if (isBackground) {
      const hasStarted = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
      if (!hasStarted) {
        await Location.startLocationUpdatesAsync(LOCATION_TASK, {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 10,
          timeInterval: 15000,
          showsBackgroundLocationIndicator: true,
        });
      }
      bgTaskStarted.current = true;
      return;
    }
    bgCoords = [];
    locationSub.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 3000 },
      (loc) => {
        if (!mountedRef.current) return;
        const coord: Coordinate = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          timestamp: loc.timestamp,
        };
        setState((prev) => {
          if (prev.status !== 'active') return prev;
          const newRoute = prev.route.length >= MAX_ROUTE_POINTS
            ? [...prev.route.slice(1), coord]
            : [...prev.route, coord];
          const dist = haversineDistanceKm(newRoute) * 1000;
          const pace = calculatePace(prev.timer, dist);
          return {
            ...prev,
            currentLocation: coord,
            route: newRoute,
            distance: dist,
            avgPace: pace,
          };
        });
      }
    );
  }, []);

  const flushBgCoords = useCallback(() => {
    if (bgCoords.length === 0) return;
    const coords = bgCoords.splice(0, bgCoords.length);
    setState((prev) => {
      if (prev.status !== 'active') return prev;
      const newRoute = prev.route.length + coords.length >= MAX_ROUTE_POINTS
        ? [...prev.route.slice(coords.length), ...coords]
        : [...prev.route, ...coords];
      const dist = haversineDistanceKm(newRoute) * 1000;
      const pace = calculatePace(prev.timer, dist);
      return {
        ...prev,
        route: newRoute,
        distance: dist,
        avgPace: pace,
        currentLocation: coords[coords.length - 1],
      };
    });
  }, []);

  const startTimer = useCallback(() => {
    if (timerInterval.current) clearInterval(timerInterval.current);
    timerInterval.current = setInterval(() => {
      setState((prev) => {
        if (prev.status !== 'active') return prev;
        const elapsed = Math.floor(
          (Date.now() - startTimeRef.current - pausedDurationRef.current) / 1000
        );
        const weight = profile.weight || 70;
        const cal = calculateCaloriesFromDuration(elapsed, weight, mode);
        const pace = calculatePace(elapsed, prev.distance);
        return {
          ...prev,
          timer: elapsed,
          calories: cal,
          avgPace: pace,
        };
      });
    }, 1000);
  }, [mode, profile.weight]);

  const startSaveInterval = useCallback(() => {
    if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
    saveIntervalRef.current = setInterval(() => {
      saveActiveSession(stateRef.current);
    }, 10000);
  }, [saveActiveSession]);

  const start = useCallback(async () => {
    if (!useStore.getState().locationTrackingEnabled) {
      return 'location_disabled' as const;
    }
    const fgStatus = await Location.requestForegroundPermissionsAsync();
    if (fgStatus.status !== 'granted') return 'location_denied' as const;

    let bgGranted = false;
    try {
      const bgStatus = await Location.requestBackgroundPermissionsAsync();
      bgGranted = bgStatus.status === 'granted';
    } catch {}

    lastStepRef.current = 0;

    if (bgGranted) {
      await startLocationTracking(true);
    }
    await startLocationTracking(false);

    try {
      const pedAvailable = await Pedometer.isAvailableAsync();
      if (pedAvailable) {
        pedometerSub.current = Pedometer.watchStepCount((result) => {
          if (!mountedRef.current) return;
          const delta = result.steps - lastStepRef.current;
          lastStepRef.current = result.steps;
          if (delta < 0) {
            lastStepRef.current = result.steps;
            return;
          }
          if (delta > 0 && delta < 10000) {
            setState((prev) => {
              if (prev.status !== 'active') return prev;
              const weight = profile.weight || 70;
              const heightCm = profile.height || 170;
              const strideLen = getStrideLength(heightCm, mode);
              const newSteps = prev.steps + delta;
              let newDistance = prev.distance;
              if (mode !== 'riding') {
                newDistance = newSteps * strideLen;
              }
              const cal = calculateCaloriesFromDuration(prev.timer, weight, mode);
              return {
                ...prev,
                steps: newSteps,
                distance: newDistance,
                calories: cal,
              };
            });
          }
        });
      }
    } catch {}

    startTimeRef.current = Date.now();
    pausedDurationRef.current = 0;

    const now = new Date().toISOString();
    setActiveSession({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 9),
      activityType: mode,
      status: 'running',
      startTime: now,
      endTime: null,
      pausedDurationMs: 0,
      lastPausedAt: null,
      durationSeconds: 0,
      steps: 0,
      distanceKm: 0,
      calories: 0,
      route: [],
      createdAt: now,
    });

    startTimer();
    startSaveInterval();

    setState((prev) => ({ ...prev, status: 'active', timer: 0, distance: 0, steps: 0, calories: 0, route: [] }));
  }, [mode, profile.weight, profile.height, setActiveSession, updateActiveSession, saveActiveSession, startLocationTracking, startTimer, startSaveInterval]);

  const pause = useCallback(() => {
    if (stateRef.current.status !== 'active') return;
    pauseStartRef.current = Date.now();
    locationSub.current?.remove();
    locationSub.current = null;
    pedometerSub.current?.remove();
    pedometerSub.current = null;
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
      saveIntervalRef.current = null;
    }
    saveActiveSession(stateRef.current);
    updateActiveSession({ status: 'paused', lastPausedAt: new Date().toISOString() });
    setState((prev) => ({ ...prev, status: 'paused' }));
  }, [updateActiveSession, saveActiveSession]);

  const resume = useCallback(async () => {
    if (stateRef.current.status !== 'paused') return;
    pausedDurationRef.current += Date.now() - pauseStartRef.current;
    flushBgCoords();
    await startLocationTracking(false);
    startTimer();
    startSaveInterval();
    updateActiveSession({ status: 'running', lastPausedAt: null });
    setState((prev) => ({ ...prev, status: 'active' }));
  }, [updateActiveSession, saveActiveSession, startLocationTracking, startTimer, startSaveInterval, flushBgCoords]);

  const finish = useCallback((): TrainingSession => {
    locationSub.current?.remove();
    locationSub.current = null;
    pedometerSub.current?.remove();
    pedometerSub.current = null;
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
      saveIntervalRef.current = null;
    }

    flushBgCoords();

    const s = stateRef.current;
    const now = new Date().toISOString();
    const startTime = activeSession?.startTime || now;

    const session: TrainingSession = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 9),
      mode,
      date: now.split('T')[0],
      startTime,
      endTime: now,
      duration: s.timer,
      distance: Math.round((s.distance / 1000) * 100) / 100,
      steps: s.steps,
      calories: Math.round(s.calories),
      route: s.route,
      avgPace: s.avgPace,
      status: 'completed',
    };

    addTrainingSession(session);
    setActiveSession(null);
    setState((prev) => ({ ...prev, status: 'finished' }));
    return session;
  }, [mode, addTrainingSession, setActiveSession, activeSession, flushBgCoords]);

  const reset = useCallback(() => {
    locationSub.current?.remove();
    locationSub.current = null;
    pedometerSub.current?.remove();
    pedometerSub.current = null;
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
      saveIntervalRef.current = null;
    }
    setActiveSession(null);
    setState({
      status: 'idle',
      timer: 0,
      distance: 0,
      steps: 0,
      calories: 0,
      route: [],
      currentLocation: null,
      avgPace: '--:--',
    });
  }, [setActiveSession]);

  const handleAppStateChange = useCallback((nextState: AppStateStatus) => {
    const s = stateRef.current;
    if (s.status !== 'active') return;

    if (nextState === 'background' || nextState === 'inactive') {
      saveActiveSession(stateRef.current);
      if (Platform.OS === 'android') {
        if (timerInterval.current) {
          clearInterval(timerInterval.current);
          timerInterval.current = null;
        }
        if (saveIntervalRef.current) {
          clearInterval(saveIntervalRef.current);
          saveIntervalRef.current = null;
        }
      }
    } else if (nextState === 'active') {
      flushBgCoords();
      if (!timerInterval.current) startTimer();
      if (!saveIntervalRef.current) startSaveInterval();
    }
  }, [saveActiveSession, startTimer, startSaveInterval, flushBgCoords]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      sub.remove();
      mountedRef.current = false;
      locationSub.current?.remove();
      pedometerSub.current?.remove();
      if (timerInterval.current) clearInterval(timerInterval.current);
      if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
    };
  }, [handleAppStateChange]);

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return {
    ...state,
    formatTime,
    start,
    pause,
    resume,
    finish,
    reset,
  };
}
