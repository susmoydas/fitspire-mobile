import { NativeModules, Platform } from 'react-native';

const { StepCounter } = NativeModules;

class StepForegroundService {
  static async start(): Promise<void> {
    if (Platform.OS !== 'android') return;
    if (!StepCounter) {
      console.warn('StepCounter native module not available');
      return;
    }
    await StepCounter.startForegroundService();
  }

  static async stop(): Promise<void> {
    if (Platform.OS !== 'android') return;
    if (!StepCounter) {
      console.warn('StepCounter native module not available');
      return;
    }
    await StepCounter.stopForegroundService();
  }

  static async getStepCount(): Promise<number> {
    if (Platform.OS !== 'android') return 0;
    if (!StepCounter) {
      console.warn('StepCounter native module not available');
      return 0;
    }
    return await StepCounter.getStepCount();
  }

  static async isRunning(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    if (!StepCounter) {
      console.warn('StepCounter native module not available');
      return false;
    }
    return await StepCounter.isServiceRunning();
  }
}

export default StepForegroundService;