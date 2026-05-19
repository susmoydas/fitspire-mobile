import { useState, useRef, useCallback, useEffect } from 'react';

interface UseTimerReturn {
  seconds: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: (initialSeconds?: number) => void;
  setTime: (s: number) => void;
}

export function useTimer(initialSeconds: number = 0): UseTimerReturn {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clearTimer();
    startTimeRef.current = Date.now();
    elapsedRef.current = 0;
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      elapsedRef.current = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setSeconds(elapsedRef.current);
    }, 200);
  }, [clearTimer]);

  const pause = useCallback(() => {
    clearTimer();
    setIsRunning(false);
  }, [clearTimer]);

  const resume = useCallback(() => {
    startTimeRef.current = Date.now();
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      elapsedRef.current = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setSeconds(elapsedRef.current);
    }, 200);
  }, [clearTimer]);

  const stop = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    setSeconds(0);
    elapsedRef.current = 0;
  }, [clearTimer]);

  const reset = useCallback((initial?: number) => {
    clearTimer();
    setIsRunning(false);
    setSeconds(initial ?? 0);
    elapsedRef.current = 0;
  }, [clearTimer]);

  const setTime = useCallback((s: number) => {
    setSeconds(s);
  }, []);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  return { seconds, isRunning, start, pause, resume, stop, reset, setTime };
}
