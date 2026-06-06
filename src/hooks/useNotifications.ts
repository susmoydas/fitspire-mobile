import { useCallback, useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import { colors } from '../theme/colors';

const CHANNEL_ID = 'fitspire-steps';
const CHANNEL_NAME = 'Step Tracking';
const LIVE_NOTIFICATION_ID = 'fitspire-live-activity';
const CATEGORY_ID = 'step_tracker';
const ACTION_OPEN = 'OPEN_APP';
const ACTION_PAUSE = 'PAUSE_TRACKING';
const ACTION_STOP = 'STOP_TRACKING';

let NotificationsModule: any = null;
try {
  NotificationsModule = require('expo-notifications');
} catch {}

function safeNotif(): any {
  return NotificationsModule;
}

export type StepNotificationActionHandler = (action: 'open' | 'pause' | 'stop') => void;

let externalActionHandler: StepNotificationActionHandler | null = null;

export function setStepNotificationActionHandler(handler: StepNotificationActionHandler | null) {
  externalActionHandler = handler;
}

export interface LiveStepsPayload {
  steps: number;
  calories: number;
  distanceKm: number;
  paused: boolean;
  goal: number;
}

function formatNumber(n: number): string {
  return Math.round(n).toLocaleString();
}

function buildLiveContent(p: LiveStepsPayload) {
  const content: any = {
    title: p.paused ? 'Step Tracking Paused' : 'Step Tracker & Pedometer',
    body: p.paused
      ? 'Tap to resume'
      : `👣 ${formatNumber(p.steps)} · 🔥 ${p.calories} kcal · 📍 ${p.distanceKm.toFixed(1)} km`,
    data: {
      type: 'live_activity',
      paused: p.paused,
      steps: p.steps,
      calories: p.calories,
      distanceKm: p.distanceKm,
      goal: p.goal,
    },
    categoryIdentifier: CATEGORY_ID,
    ...(Platform.OS === 'android' && {
      channelId: CHANNEL_ID,
      ongoing: !p.paused,
      autoDismiss: false,
      sticky: !p.paused,
      color: colors.primary,
    }),
  };
  if (Platform.OS === 'android' && !p.paused) {
    content.android = {
      priority: 'min',
      progress: {
        max: Math.max(p.goal, 1),
        current: Math.min(p.steps, p.goal),
        indeterminate: false,
      },
    };
  }
  return content;
}

export function useNotifications() {
  const categoryRegistered = useRef(false);

  useEffect(() => {
    if (!safeNotif()) return;
    try {
      safeNotif().setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldShowBanner: false,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });
    } catch {}

    setupChannel();
    registerCategory();

    const sub = safeNotif().addNotificationResponseReceivedListener((response: any) => {
      const actionId = response?.actionIdentifier;
      const data = response?.notification?.request?.content?.data;
      if (data?.type !== 'live_activity' && actionId === 'default') return;
      if (actionId === ACTION_PAUSE) externalActionHandler?.('pause');
      else if (actionId === ACTION_STOP) externalActionHandler?.('stop');
      else externalActionHandler?.('open');
    });

    return () => {
      try {
        sub?.remove?.();
      } catch {}
    };
  }, []);

  const setupChannel = async () => {
    if (Platform.OS !== 'android' || !safeNotif()) return;
    try {
      await safeNotif().setNotificationChannelAsync(CHANNEL_ID, {
        name: CHANNEL_NAME,
        importance: 1,
        vibrationPattern: [0, 0],
        sound: null,
        showBadge: false,
      });
    } catch {}
  };

  const registerCategory = async () => {
    if (categoryRegistered.current) return;
    if (!safeNotif()) return;
    try {
      await safeNotif().setNotificationCategoryAsync(CATEGORY_ID, [
        { identifier: ACTION_OPEN, buttonTitle: 'Open', options: { opensAppToForeground: true } },
        { identifier: ACTION_PAUSE, buttonTitle: 'Pause', options: { opensAppToForeground: false } },
        { identifier: ACTION_STOP, buttonTitle: 'Stop', options: { opensAppToForeground: false, isDestructive: true } },
      ]);
      categoryRegistered.current = true;
    } catch {}
  };

  const requestPermission = async () => {
    if (!safeNotif()) return false;
    try {
      const { status } = await safeNotif().requestPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  };

  const scheduleStepGoalNotification = useCallback(
    async (percentage: number) => {
      if (!safeNotif()) return;
      const pct = Math.min(percentage, 100);
      let body = '';
      if (pct >= 100) body = `🎉 You've hit your daily step goal! Amazing work today.`;
      else if (pct >= 75) body = `🔥 ${pct}% of your goal reached — keep going!`;
      else if (pct >= 50) body = `👟 ${pct}% of your goal so far. Keep moving!`;
      else if (pct >= 25) body = `🚶 ${pct}% of your goal reached. Great start!`;
      if (!body) return;

      try {
        await safeNotif().scheduleNotificationAsync({
          identifier: `step-milestone-${pct}`,
          content: {
            title: 'Daily Goal Progress',
            body,
            data: { type: 'step_milestone', percentage: pct },
            ...(Platform.OS === 'android' && { channelId: CHANNEL_ID }),
          },
          trigger: null,
        });
      } catch {}
    },
    [],
  );

  const updateLiveSteps = useCallback(async (payload: LiveStepsPayload) => {
    if (!safeNotif()) return;
    try {
      await safeNotif().scheduleNotificationAsync({
        identifier: LIVE_NOTIFICATION_ID,
        content: buildLiveContent(payload),
        trigger: null,
      });
    } catch {}
  }, []);

  const clearLiveSteps = useCallback(async () => {
    if (!safeNotif()) return;
    try {
      await safeNotif().dismissNotificationAsync(LIVE_NOTIFICATION_ID);
    } catch {}
  }, []);

  return {
    scheduleStepGoalNotification,
    updateLiveSteps,
    clearLiveSteps,
    requestPermission,
  };
}
