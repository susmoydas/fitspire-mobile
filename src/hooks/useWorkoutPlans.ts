import { useState, useEffect } from 'react';
import { getWorkoutPlans, usedApiSuccessfully, type WorkoutPlan } from '../data/workoutPlans';

export function useWorkoutPlans() {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const result = await getWorkoutPlans();
        if (mounted) {
          setPlans(result);
          if (!usedApiSuccessfully()) {
            setIsOffline(true);
            setError('Limited workouts available — you are offline');
          }
        }
      } catch (e) {
        if (mounted) {
          setIsOffline(true);
          setError('Could not load workouts. Please try again.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return { plans, loading, error, isOffline };
}