const STRIDE_FACTORS = { walking: 0.415, running: 0.65, riding: 0 };
const MET_VALUES = { walking: 3.5, running: 8.0, riding: 6.0 };
const STEPS_PER_MINUTE = { walking: 100, running: 160, riding: 0 };

export function getStrideLength(
  heightCm: number,
  mode: 'walking' | 'running' | 'riding' = 'walking'
): number {
  return (heightCm * STRIDE_FACTORS[mode]) / 100;
}

export function calculateCaloriesFromSteps(
  steps: number,
  weightKg: number,
  mode: 'walking' | 'running' | 'riding' = 'walking'
): number {
  const met = MET_VALUES[mode];
  const spm = STEPS_PER_MINUTE[mode];
  if (spm === 0) return 0;
  const hours = steps / spm / 60;
  return Math.round(met * weightKg * hours);
}

export function calculateCaloriesFromDuration(
  durationSeconds: number,
  weightKg: number,
  mode: 'walking' | 'running' | 'riding' = 'walking'
): number {
  const hours = durationSeconds / 3600;
  return Math.round(MET_VALUES[mode] * weightKg * hours);
}

export function calculateDistanceKm(
  steps: number,
  heightCm: number,
  mode: 'walking' | 'running' | 'riding' = 'walking'
): number {
  const strideLen = getStrideLength(heightCm, mode);
  if (strideLen === 0) return 0;
  return Math.round((steps * strideLen) / 1000 * 100) / 100;
}

export function haversineDistanceKm(coords: { latitude: number; longitude: number }[]): number {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const lat1 = coords[i - 1].latitude * Math.PI / 180;
    const lon1 = coords[i - 1].longitude * Math.PI / 180;
    const lat2 = coords[i].latitude * Math.PI / 180;
    const lon2 = coords[i].longitude * Math.PI / 180;
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    total += 6371 * c;
  }
  return Math.round(total * 100) / 100;
}

export function getDateKey(d: Date): string {
  return d.toISOString().split('T')[0];
}