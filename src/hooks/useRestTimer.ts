import { useState, useRef, useCallback, useEffect } from 'react';

interface UseRestTimerReturn {
  remaining: number;
  isRunning: boolean;
  startRest: (seconds: number) => void;
  pause: () => void;
  resume: () => void;
  skip: () => void;
}

export function useRestTimer(): UseRestTimerReturn {
  const [remaining, setRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef = useRef<number>(0);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const diff = Math.max(0, Math.floor((endTimeRef.current - Date.now()) / 1000));
    setRemaining(diff);
    if (diff <= 0) {
      clearTimer();
      setIsRunning(false);
    }
  }, [clearTimer]);

  const startRest = useCallback((seconds: number) => {
    clearTimer();
    endTimeRef.current = Date.now() + seconds * 1000;
    setRemaining(seconds);
    setIsRunning(true);
    intervalRef.current = setInterval(tick, 200);
  }, [clearTimer, tick]);

  const pause = useCallback(() => {
    clearTimer();
    setIsRunning(false);
  }, [clearTimer]);

  const resume = useCallback(() => {
    endTimeRef.current = Date.now() + remaining * 1000;
    setIsRunning(true);
    intervalRef.current = setInterval(tick, 200);
  }, [tick, remaining, clearTimer]);

  const skip = useCallback(() => {
    clearTimer();
    setRemaining(0);
    setIsRunning(false);
  }, [clearTimer]);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  return { remaining, isRunning, startRest, pause, resume, skip };
}
