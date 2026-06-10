import { Platform } from 'react-native';
import { useStore } from '../store/useStore';
import { calculateCaloriesFromSteps } from '../utils/calculations';

type HealthConnectorId = 'apple_health' | 'google_fit' | 'health_connect' | 'fitbit' | 'samsung_health';

interface HealthData {
  steps: number;
  heartRate: number;
  distanceKm: number;
  calories: number;
}

let appleHealthModule: any = null;
let healthConnectModule: any = null;

async function loadAppleHealth() {
  try {
    appleHealthModule = require('react-native-health');
    return true;
  } catch {
    return false;
  }
}

async function loadHealthConnect() {
  try {
    healthConnectModule = require('react-native-health-connect');
    return true;
  } catch {
    return false;
  }
}

export async function isConnectorAvailable(id: HealthConnectorId): Promise<boolean> {
  switch (id) {
    case 'apple_health':
      if (Platform.OS !== 'ios') return false;
      await loadAppleHealth();
      return !!appleHealthModule;
    case 'health_connect':
      if (Platform.OS !== 'android') return false;
      await loadHealthConnect();
      return !!healthConnectModule;
    case 'google_fit':
      return Platform.OS === 'android';
    case 'samsung_health':
    case 'fitbit':
      return false;
  }
}

export async function requestConnect(id: HealthConnectorId): Promise<boolean> {
  switch (id) {
    case 'apple_health': {
      await loadAppleHealth();
      if (!appleHealthModule) return false;
      try {
        const hasPermissions = await appleHealthModule.isHealthKitAvailable();
        if (!hasPermissions) return false;
        const permissions = {
          permissions: {
            read: [
              appleHealthModule.HealthKitPermissions.HeartRate,
              appleHealthModule.HealthKitPermissions.StepCount,
              appleHealthModule.HealthKitPermissions.DistanceWalkingRunning,
              appleHealthModule.HealthKitPermissions.ActiveEnergyBurned,
              appleHealthModule.HealthKitPermissions.Workout,
            ],
            write: [
              appleHealthModule.HealthKitPermissions.ActiveEnergyBurned,
              appleHealthModule.HealthKitPermissions.Workout,
            ],
          },
        };
        const granted = await appleHealthModule.requestPermissions(permissions);
        const allGranted = Object.values(granted).every(Boolean);
        return allGranted;
      } catch {
        return false;
      }
    }
    case 'health_connect': {
      await loadHealthConnect();
      if (!healthConnectModule) return false;
      try {
        const permissions = await healthConnectModule.requestPermission([
          { accessType: 'read', recordType: 'Steps' },
          { accessType: 'read', recordType: 'HeartRate' },
          { accessType: 'read', recordType: 'Distance' },
          { accessType: 'read', recordType: 'ExerciseSession' },
        ]);
        return permissions.length > 0;
      } catch {
        return false;
      }
    }
    case 'google_fit':
    case 'samsung_health':
    case 'fitbit':
      return false;
  }
}

export async function fetchHealthData(id: HealthConnectorId): Promise<Partial<HealthData> | null> {
  switch (id) {
    case 'apple_health': {
      await loadAppleHealth();
      if (!appleHealthModule) return null;
      try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const options = { startDate: startOfDay.toISOString(), endDate: now.toISOString() };

        const [steps, heartRate, distance, energy] = await Promise.allSettled([
          appleHealthModule.getStepCount(options),
          appleHealthModule.getHeartRateSamples(options),
          appleHealthModule.getDistanceWalkingRunning(options),
          appleHealthModule.getActiveEnergyBurned(options),
        ]);

        return {
          steps: steps.status === 'fulfilled' ? steps.value?.value ?? 0 : 0,
          heartRate: heartRate.status === 'fulfilled' && heartRate.value?.length
            ? Math.round(heartRate.value[heartRate.value.length - 1]?.value ?? 0)
            : 0,
          distanceKm: distance.status === 'fulfilled' ? (distance.value?.value ?? 0) / 1000 : 0,
          calories: energy.status === 'fulfilled' ? Math.round(energy.value?.value ?? 0) : 0,
        };
      } catch {
        return null;
      }
    }
    case 'health_connect': {
      await loadHealthConnect();
      if (!healthConnectModule) return null;
      try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const timeFilter = {
          operator: 'after',
          startTime: startOfDay.toISOString(),
          endTime: now.toISOString(),
        };

        const [stepsRecord, heartRateRecord, distanceRecord] = await Promise.allSettled([
          healthConnectModule.getSteps(timeFilter),
          healthConnectModule.getHeartRate(timeFilter),
          healthConnectModule.getDistance(timeFilter),
        ]);

        const steps = stepsRecord.status === 'fulfilled'
          ? stepsRecord.value?.reduce((sum: number, r: any) => sum + (r.count ?? 0), 0) ?? 0
          : 0;

        const heartRateSamples = heartRateRecord.status === 'fulfilled' ? heartRateRecord.value ?? [] : [];
        const avgHeartRate = heartRateSamples.length > 0
          ? Math.round(heartRateSamples.reduce((sum: number, s: any) => sum + (s.value ?? 0), 0) / heartRateSamples.length)
          : 0;

        const distance = distanceRecord.status === 'fulfilled'
          ? distanceRecord.value?.reduce((sum: number, r: any) => sum + (r.distance?.inMeters ?? 0), 0) ?? 0
          : 0;

        return {
          steps,
          heartRate: avgHeartRate,
          distanceKm: distance / 1000,
          calories: calculateCaloriesFromSteps(steps, 70),
        };
      } catch {
        return null;
      }
    }
    default:
      return null;
  }
}

export async function disconnect(id: HealthConnectorId): Promise<void> {
  const store = useStore.getState();
  const connectors = store.healthConnectors || {};
  store.setHealthConnectors({ ...connectors, [id]: false });
}

export async function getConnectorStatus(id: HealthConnectorId): Promise<boolean> {
  const store = useStore.getState();
  return store.healthConnectors?.[id] ?? false;
}
