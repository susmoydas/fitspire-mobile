# P0+P1 Fix Plan — Step Counter, Performance, Images & Calories

## P0-1: Fix Rest Timer Interval Churn

**File:** `src/screens/WorkoutTimerScreen.tsx`

**Symptoms:** Rest timer interval is re-created every second, causing jank/stutter during rest periods.

**Root Cause:** The `useEffect` at line 197 depends on `restTimer` which changes every second. This clears and re-creates the `setInterval` on every tick.

**Fix:** Remove `restTimer` from the dependency array. The interval's callback already uses functional updater `setRestTimer((prev) => ...)` so it never needs the current state value. Also remove the `restTimer <= 0` guard (the functional updater handles reaching zero internally).

**Change (lines 197-211):**
```typescript
// BEFORE:
useEffect(() => {
    if (isPaused || phase !== 'rest' || restTimer <= 0) return;
    restIntervalRef.current = setInterval(() => {
      setRestTimer((prev) => {
        if (prev <= 1) {
          if (restIntervalRef.current) clearInterval(restIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    };
  }, [isPaused, phase, restTimer]);

// AFTER:
useEffect(() => {
    if (isPaused || phase !== 'rest') return;
    restIntervalRef.current = setInterval(() => {
      setRestTimer((prev) => {
        if (prev <= 1) {
          if (restIntervalRef.current) clearInterval(restIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    };
  }, [isPaused, phase]);
```

---

## P0-2: Fix Step Counter Delta Filter & Negative Delta Handling

**File:** `src/hooks/useStepCounter.ts`

**Symptoms:** Steps not counted on some Android devices; step counter stalls silently.

**Root Causes:**
1. Delta cap at 1000 (`line 117: if (delta > 0 && delta < 1000)`) drops legitimate batches on devices that report steps in bursts
2. No handling for negative deltas (system counter resets on some devices)

**Fix:**
1. Increase delta cap from 1000 to 10000 (covers virtually all realistic step burst scenarios)
2. When delta is negative, reset accumulator to current pedometer reading (this handles counter reset gracefully)

**Change (lines 111-133):**
```typescript
// BEFORE:
if (lastStepCount.current === 0) {
  lastStepCount.current = result.steps;
  return;
}

const delta = result.steps - lastStepCount.current;
if (delta > 0 && delta < 1000) {
  dailyStepsAccum.current += delta;
  setSteps(dailyStepsAccum.current);
  const store = useStore.getState();
  const existing = store.activityLog.find(
    (a) => a.date === currentDate.current
  );
  updateActivity({
    date: currentDate.current,
    steps: dailyStepsAccum.current,
    caloriesBurned: existing?.caloriesBurned || 0,
    sleepHours: existing?.sleepHours || 0,
    waterGlasses: existing?.waterGlasses || 0,
  });
  setTodaySteps(dailyStepsAccum.current, currentDate.current);
}
lastStepCount.current = result.steps;

// AFTER:
if (lastStepCount.current === 0) {
  lastStepCount.current = result.steps;
  dailyStepsAccum.current = result.steps;
  setSteps(dailyStepsAccum.current);
  return;
}

const delta = result.steps - lastStepCount.current;
if (delta < 0) {
  // System pedometer reset — reinitialize
  dailyStepsAccum.current = result.steps;
  setSteps(dailyStepsAccum.current);
} else if (delta > 0 && delta < 10000) {
  dailyStepsAccum.current += delta;
  setSteps(dailyStepsAccum.current);
}
lastStepCount.current = result.steps;
```

---

## P0-3: Reduce Step Counter Store Writes

**File:** `src/hooks/useStepCounter.ts`

**Symptoms:** UI stutters when walking; excessive AsyncStorage write operations.

**Root Cause:** Every step event triggers `updateActivity()` + `setTodaySteps()`, each of which triggers Zustand persist writes to AsyncStorage.

**Fix:** Remove per-step store writes; only persist via the existing 30-second save interval. The local `steps` state maintains display responsiveness without I/O overhead.

**Change (lines 119-131):** Remove the store write block from within the `delta > 0` condition:
```typescript
// BEFORE (inside the delta > 0 block):
if (delta > 0 && delta < 10000) {
  dailyStepsAccum.current += delta;
  setSteps(dailyStepsAccum.current);
  const store = useStore.getState();
  const existing = store.activityLog.find(
    (a) => a.date === currentDate.current
  );
  updateActivity({
    date: currentDate.current,
    steps: dailyStepsAccum.current,
    caloriesBurned: existing?.caloriesBurned || 0,
    sleepHours: existing?.sleepHours || 0,
    waterGlasses: existing?.waterGlasses || 0,
  });
  setTodaySteps(dailyStepsAccum.current, currentDate.current);
}

// AFTER (inside the delta > 0 block):
if (delta < 0) {
  dailyStepsAccum.current = result.steps;
  setSteps(dailyStepsAccum.current);
} else if (delta > 0 && delta < 10000) {
  dailyStepsAccum.current += delta;
  setSteps(dailyStepsAccum.current);
}
```

The 30-second interval at line 138 (`setInterval(() => { saveSteps(); }, 30000)`) will handle persist. The cleanup at line 147 (`saveSteps()`) ensures data is saved on unmount.

---

## P1-1: Add Persistent Image Caching & Preloading

### Part A: Add disk cache policy to ExerciseHeroImage

**File:** `src/components/ExerciseHeroImage.tsx`

**Fix:** Add explicit `cachePolicy` to the `expo-image` component.

**Change (line 51-57):**
```typescript
// BEFORE:
<Image
  source={{ uri: currentUrl }}
  style={[styles.image, imageStyle]}
  contentFit={contentFit}
  transition={200}
  onError={handleError}
/>

// AFTER:
<Image
  source={{ uri: currentUrl }}
  style={[styles.image, imageStyle]}
  contentFit={contentFit}
  cachePolicy="disk"
  transition={200}
  onError={handleError}
/>
```

### Part B: Preload next exercise image in WorkoutTimerScreen

**File:** `src/screens/WorkoutTimerScreen.tsx`

**Fix:** Use `Image.prefetch()` to preload the next exercise image when resting.

Add import:
```typescript
import { Image } from 'expo-image';
```

Add useEffect (after the current exercise index changes, around line 163-165):
```typescript
useEffect(() => {
  // Preload next exercise image
  const nextIdx = currentExerciseIndex + 1;
  if (nextIdx < exercises.length) {
    const nextEx = exercises[nextIdx];
    const urls = getWorkoutExerciseImageUrls(nextEx);
    urls.forEach((url) => {
      if (url) Image.prefetch(url);
    });
  }
}, [currentExerciseIndex, exercises]);
```

---

## P1-2: Add React.memo to Key Components

### SetTrackerRow

**File:** `src/components/SetTrackerRow.tsx`

Wrap the default export:
```typescript
export default React.memo(SetTrackerRow);
```

### MetricCard

**File:** `src/components/MetricCard.tsx`

```typescript
export default React.memo(MetricCard);
```

### ExerciseCard

**File:** `src/components/ExerciseCard.tsx`

```typescript
export default React.memo(ExerciseCard);
```

### InfoStatCard

**File:** `src/components/InfoStatCard.tsx`

Locate the export and wrap with `React.memo`.

### RestTimerCard

**File:** `src/components/RestTimerCard.tsx`

Wrap the default export with `React.memo`.

### ExerciseHeroImage

**File:** `src/components/ExerciseHeroImage.tsx`

The component receives `urls` (array) which will re-create on every render in parent. Need to ensure stable reference or use custom comparator:

```typescript
export default React.memo(ExerciseHeroImage, (prev, next) => {
  if (prev.urls.length !== next.urls.length) return false;
  return prev.urls.every((u, i) => u === next.urls[i])
    && prev.name === next.name
    && prev.aspectRatio === next.aspectRatio;
});
```

---

## P1-3: Fix Difficulty Color Inconsistency

**File:** `src/components/ExerciseCard.tsx`

**Issue:** Uses `colors.success` (green) for Beginner, while all other screens use `colors.warning` (amber) for Beginner.

**Change (line 16):**
```typescript
// BEFORE:
const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: colors.success,
  Intermediate: colors.warning,
  Advanced: colors.error,
};

// AFTER:
const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: colors.warning,
  Intermediate: colors.warning,
  Advanced: colors.error,
};
```

---

## P1-4: Fix Hardcoded 70kg in StepDetailScreen

**File:** `src/screens/StepDetailScreen.tsx`

**Issue:** Line 43 hardcodes 70kg in `estimateCalories()`.

**Fix:** Read from `profile.weight` with 70 as fallback:

**Change (line 42-44):**
```typescript
// BEFORE:
function estimateCalories(steps: number): number {
  return Math.round(3.5 * 70 * (steps / (10000 / 0.5)));
}

// AFTER:
function estimateCalories(steps: number, weightKg: number): number {
  return Math.round(3.5 * weightKg * (steps / (10000 / 0.5)));
}
```

Then update the call site inside the component where it's used. Look for `estimateCalories(` calls and pass `profile.weight || 70`:
```typescript
estimateCalories(todaySteps, profile.weight || 70)
```

---

## Summary of File Changes

| File | Changes |
|------|---------|
| `src/screens/WorkoutTimerScreen.tsx` | P0-1: Fix rest timer deps; P1-1B: Add image preloading |
| `src/hooks/useStepCounter.ts` | P0-2: Fix delta filter + negative delta; P0-3: Reduce store writes |
| `src/components/ExerciseHeroImage.tsx` | P1-1A: Add cachePolicy="disk"; P1-2: Add React.memo |
| `src/components/ExerciseCard.tsx` | P1-2: Add React.memo; P1-3: Fix difficulty color |
| `src/components/SetTrackerRow.tsx` | P1-2: Add React.memo |
| `src/components/MetricCard.tsx` | P1-2: Add React.memo |
| `src/components/InfoStatCard.tsx` | P1-2: Add React.memo |
| `src/components/RestTimerCard.tsx` | P1-2: Add React.memo |
| `src/screens/StepDetailScreen.tsx` | P1-4: Fix hardcoded weight |
