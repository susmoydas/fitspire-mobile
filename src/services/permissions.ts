import { Platform, Linking, PermissionsAndroid } from 'react-native';
import * as Location from 'expo-location';

let NotificationsModule: any = null;
try {
  NotificationsModule = require('expo-notifications');
} catch {}

function safeNotif(): any {
  return NotificationsModule;
}

export type PermissionLevel = 'granted' | 'denied' | 'undetermined' | 'unavailable';

export interface PermissionStatuses {
  activityRecognition: PermissionLevel;
  location: PermissionLevel;
  notification: PermissionLevel;
}

const UNAVAILABLE: PermissionStatuses = {
  activityRecognition: 'unavailable',
  location: 'unavailable',
  notification: 'unavailable',
};

async function readActivityRecognition(): Promise<PermissionLevel> {
  if (Platform.OS !== 'android') return 'unavailable';
  const perm: any = (PermissionsAndroid.PERMISSIONS as any).ACTIVITY_RECOGNITION;
  if (!perm) return 'unavailable';
  try {
    const result = await PermissionsAndroid.check(perm);
    return result ? 'granted' : 'denied';
  } catch {
    return 'undetermined';
  }
}

async function readLocation(): Promise<PermissionLevel> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'undetermined';
  } catch {
    return 'unavailable';
  }
}

async function readNotification(): Promise<PermissionLevel> {
  const mod = safeNotif();
  if (!mod) return 'unavailable';
  try {
    const { status } = await mod.getPermissionsAsync();
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'undetermined';
  } catch {
    return 'unavailable';
  }
}

export async function refreshPermissionStatuses(): Promise<PermissionStatuses> {
  const [activityRecognition, location, notification] = await Promise.all([
    readActivityRecognition(),
    readLocation(),
    readNotification(),
  ]);
  return { activityRecognition, location, notification };
}

export interface RequestOptions {
  askLocation?: boolean;
  askNotification?: boolean;
}

export async function requestAllPermissions(
  opts: RequestOptions = {},
): Promise<PermissionStatuses> {
  const result: PermissionStatuses = { ...UNAVAILABLE };

  if (Platform.OS === 'android') {
    const perms: string[] = [];
    const perm: any = (PermissionsAndroid.PERMISSIONS as any).ACTIVITY_RECOGNITION;
    if (perm) perms.push(perm);
    if (Platform.Version >= 33) {
      const notif: any = (PermissionsAndroid.PERMISSIONS as any).POST_NOTIFICATIONS;
      if (notif && opts.askNotification !== false) perms.push(notif);
    }
    if (perms.length > 0) {
      try {
        const granted = await PermissionsAndroid.requestMultiple(perms as any);
        const ar = perm ? (granted as any)[perm] : 'granted';
        result.activityRecognition =
          ar === PermissionsAndroid.RESULTS.GRANTED
            ? 'granted'
            : ar === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
            ? 'denied'
            : 'denied';
        if (Platform.Version >= 33) {
          const notifPerm: any = (PermissionsAndroid.PERMISSIONS as any).POST_NOTIFICATIONS;
          if (notifPerm) {
            const n = (granted as any)[notifPerm];
            result.notification =
              n === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied';
          } else {
            result.notification = 'granted';
          }
        } else {
          result.notification = 'granted';
        }
      } catch {
        result.activityRecognition = 'undetermined';
        result.notification = 'undetermined';
      }
    } else {
      result.activityRecognition = 'unavailable';
      result.notification = 'unavailable';
    }
  } else {
    result.activityRecognition = 'unavailable';
    const mod = safeNotif();
    if (mod && opts.askNotification !== false) {
      try {
        const { status } = await mod.requestPermissionsAsync();
        result.notification = status === 'granted' ? 'granted' : 'denied';
      } catch {
        result.notification = 'undetermined';
      }
    } else {
      result.notification = 'granted';
    }
  }

  if (opts.askLocation) {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      result.location = status === 'granted' ? 'granted' : 'denied';
    } catch {
      result.location = 'undetermined';
    }
  } else {
    result.location = await readLocation();
  }

  return result;
}

export async function openAppSettings(): Promise<void> {
  try {
    await Linking.openSettings();
  } catch {
    // ignore
  }
}
