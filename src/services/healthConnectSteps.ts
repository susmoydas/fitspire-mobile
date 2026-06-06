import { Platform, Linking } from 'react-native';

export type HealthConnectStatus = {
  sdkAvailable: boolean;
  providerInstalled: boolean;
  permissionsGranted: boolean;
  notInstalled?: boolean;
  needsUpdate?: boolean;
};

const HEALTH_CONNECT_PLAY_STORE =
  'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata';

let healthConnectModule: any = null;
let sdkStatus: HealthConnectStatus | null = null;

function loadModule(): any {
  if (healthConnectModule !== null) return healthConnectModule;
  if (Platform.OS !== 'android') {
    healthConnectModule = false;
    return false;
  }
  try {
    healthConnectModule = require('react-native-health-connect');
    return healthConnectModule;
  } catch {
    healthConnectModule = false;
    return false;
  }
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function initHealthConnect(): Promise<HealthConnectStatus> {
  if (Platform.OS !== 'android') {
    const status: HealthConnectStatus = {
      sdkAvailable: false,
      providerInstalled: false,
      permissionsGranted: false,
    };
    sdkStatus = status;
    return status;
  }

  const mod = loadModule();
  if (!mod) {
    const status: HealthConnectStatus = {
      sdkAvailable: false,
      providerInstalled: false,
      permissionsGranted: false,
    };
    sdkStatus = status;
    return status;
  }

  try {
    const statusCode = await mod.getSdkStatus();
    const notInstalled = statusCode === 1;
    const needsUpdate = statusCode === 2;
    const sdkAvailable = statusCode === 3;

    if (!sdkAvailable) {
      const status: HealthConnectStatus = {
        sdkAvailable: false,
        providerInstalled: !notInstalled,
        permissionsGranted: false,
        notInstalled,
        needsUpdate,
      };
      sdkStatus = status;
      return status;
    }

    await mod.initialize();
    const granted = await mod.getGrantedPermissions();
    const hasSteps = Array.isArray(granted)
      ? granted.some(
          (p: any) =>
            p?.accessType === 'read' && p?.recordType === 'Steps'
        )
      : false;

    const status: HealthConnectStatus = {
      sdkAvailable: true,
      providerInstalled: true,
      permissionsGranted: hasSteps,
    };
    sdkStatus = status;
    return status;
  } catch {
    const status: HealthConnectStatus = {
      sdkAvailable: false,
      providerInstalled: false,
      permissionsGranted: false,
    };
    sdkStatus = status;
    return status;
  }
}

export function getCachedStatus(): HealthConnectStatus | null {
  return sdkStatus;
}

export async function requestHealthConnectPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  const mod = loadModule();
  if (!mod) return false;

  try {
    const granted = await mod.requestPermission([
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'Distance' },
    ]);
    const ok = Array.isArray(granted)
      ? granted.some(
          (p: any) => p?.accessType === 'read' && p?.recordType === 'Steps'
        )
      : false;
    if (sdkStatus) {
      sdkStatus = { ...sdkStatus, permissionsGranted: ok };
    }
    return ok;
  } catch {
    return false;
  }
}

async function readStepsBetween(start: Date, end: Date): Promise<number> {
  if (Platform.OS !== 'android') return 0;
  const mod = loadModule();
  if (!mod) return 0;

  try {
    const result = await mod.readRecords('Steps', {
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    });
    const records: any[] = Array.isArray(result?.records) ? result.records : [];
    let total = 0;
    for (const r of records) {
      const c = Number(r?.count);
      if (Number.isFinite(c) && c > 0) total += c;
    }
    return total;
  } catch {
    return 0;
  }
}

export async function getTodayStepsFromHealthConnect(): Promise<number> {
  return readStepsBetween(startOfDay(new Date()), new Date());
}

export async function getStepsForDay(date: Date): Promise<number> {
  return readStepsBetween(startOfDay(date), endOfDay(date));
}

export async function openHealthConnectInstall(): Promise<void> {
  try {
    await Linking.openURL(HEALTH_CONNECT_PLAY_STORE);
  } catch {
    // user cancelled or no browser
  }
}
