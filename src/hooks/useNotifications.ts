import { useCallback, useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import { colors } from '../theme/colors';

const CHANNEL_ID = 'fitspire-steps';
const CHANNEL_NAME = 'Step Tracking';
const LIVE_NOTIFICATION_ID = 'fitspire-live-activity';
const DAILY_TARGET_STEPS = 14000;

let NotificationsModule: any = null;
try {
  NotificationsModule = require('expo-notifications');
} catch {}

function safeNotif(): any {
  return NotificationsModule;
}

export function useNotifications() {
  const notifResponded = useRef(false);

  useEffect(() => {
    if (!safeNotif()) return;
    try {
      safeNotif().setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });
    } catch {}

    setupChannel();
    requestPermission();
  }, []);

  const setupChannel = async () => {
    if (Platform.OS !== 'android' || !safeNotif()) return;
    try {
      await safeNotif().setNotificationChannelAsync(CHANNEL_ID, {
        name: CHANNEL_NAME,
        importance: 4,
        vibrationPattern: [0, 0],
        sound: null,
      });
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
      const targetK = DAILY_TARGET_STEPS / 1000;
      const achievedK = Math.round((DAILY_TARGET_STEPS * pct) / 100 / 1000);

      let body = '';
      if (pct >= 100) {
        body = `🎉 You've hit ${targetK}K steps! Amazing work today.`;
      } else if (pct >= 75) {
        body = `🔥 ${achievedK}K steps done — just ${targetK - achievedK}K to go!`;
      } else if (pct >= 50) {
        body = `👟 ${achievedK}K steps so far. Keep moving!`;
      } else if (pct >= 25) {
        body = `🚶 ${achievedK}K steps recorded. Great start!`;
      }

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
    []
  );

  const showLiveActivity = useCallback(
    async (steps: number, calories: number, progress: number) => {
      if (!safeNotif()) return;
      const progressPct = Math.round(progress * 100);
      const targetK = DAILY_TARGET_STEPS / 1000;
      const achievedK = (steps / 1000).toFixed(1);
      const walkingMinutes = Math.round(steps / (100 / 60));
      const durationStr = walkingMinutes >= 60
        ? `${Math.floor(walkingMinutes / 60)}h ${walkingMinutes % 60}m`
        : `${walkingMinutes}m`;

      try {
        await safeNotif().dismissNotificationAsync(LIVE_NOTIFICATION_ID);
      } catch {}

      try {
        const notifContent: any = {
          title: `🚶 ${steps.toLocaleString()} steps`,
          body: `🔥 ${calories} kcal • ${progressPct}% of ${targetK}K goal`,
          data: {
            type: 'live_activity',
            steps,
            calories,
            progress,
            duration: durationStr,
            achievedK,
            targetK,
          },
          ...(Platform.OS === 'android' && {
            channelId: CHANNEL_ID,
            ongoing: true,
            autoDismiss: false,
            color: colors.primary,
          }),
        };

        if (Platform.OS === 'android') {
          notifContent.android = {
            priority: 'high',
            progress: {
              max: DAILY_TARGET_STEPS,
              current: steps,
              indeterminate: false,
            },
          };
        }

        await safeNotif().scheduleNotificationAsync({
          identifier: LIVE_NOTIFICATION_ID,
          content: notifContent,
          trigger: null,
        });
      } catch {}
    },
    []
  );

  const cancelLiveActivity = useCallback(async () => {
    if (!safeNotif()) return;
    try {
      await safeNotif().dismissNotificationAsync(LIVE_NOTIFICATION_ID);
    } catch {}
  }, []);

  return {
    scheduleStepGoalNotification,
    showLiveActivity,
    cancelLiveActivity,
    requestPermission,
  };
}
