import { Exercise, ExerciseCategory } from '../types';

export const exerciseCategories: ExerciseCategory[] = ['All', 'Chest', 'Back', 'Arms', 'Core', 'Legs'];

export const exercises: Exercise[] = [
  {
    id: 'chest-1',
    name: 'Bench Press',
    category: 'Chest',
    imageUrl: 'https://raw.githubusercontent.com/wrkout/exercises-data/main/exercises/bench-press.png',
    videoUrl: '',
    instructions: ['Lie flat on bench', 'Grip bar shoulder-width', 'Lower bar to chest', 'Press up'],
    defaultSets: 4,
    defaultReps: 10,
  },
  {
    id: 'chest-2',
    name: 'Push Ups',
    category: 'Chest',
    imageUrl: 'https://raw.githubusercontent.com/wrkout/exercises-data/main/exercises/push-up.png',
    videoUrl: '',
    instructions: ['Keep body straight', 'Lower chest to ground', 'Push back up'],
    defaultSets: 3,
    defaultReps: 15,
  },
  {
    id: 'chest-3',
    name: 'Dumbbell Fly',
    category: 'Chest',
    imageUrl: 'https://raw.githubusercontent.com/wrkout/exercises-data/main/exercises/dumbbell-fly.png',
    videoUrl: '',
    instructions: ['Lie on bench with dumbbells', 'Arms extended above chest', 'Lower arms out wide', 'Squeeze chest to return'],
    defaultSets: 3,
    defaultReps: 12,
  },
  {
    id: 'back-1',
    name: 'Pull Ups',
    category: 'Back',
    imageUrl: 'https://raw.githubusercontent.com/wrkout/exercises-data/main/exercises/pull-up.png',
    videoUrl: '',
    instructions: ['Grip bar overhand', 'Pull body up', 'Lower down controlled'],
    defaultSets: 3,
    defaultReps: 8,
  },
  {
    id: 'back-2',
    name: 'Bent Over Row',
    category: 'Back',
    imageUrl: 'https://raw.githubusercontent.com/wrkout/exercises-data/main/exercises/bent-over-row.png',
    videoUrl: '',
    instructions: ['Hinge at hips', 'Pull bar to lower chest', 'Squeeze back muscles'],
    defaultSets: 4,
    defaultReps: 10,
  },
  {
    id: 'back-3',
    name: 'Lat Pulldown',
    category: 'Back',
    imageUrl: 'https://raw.githubusercontent.com/wrkout/exercises-data/main/exercises/lat-pulldown.png',
    videoUrl: '',
    instructions: ['Sit at machine', 'Pull bar down to chest', 'Slow release'],
    defaultSets: 3,
    defaultReps: 12,
  },
  {
    id: 'arms-1',
    name: 'Bicep Curl',
    category: 'Arms',
    imageUrl: 'https://raw.githubusercontent.com/wrkout/exercises-data/main/exercises/bicep-curl.png',
    videoUrl: '',
    instructions: ['Stand with dumbbells', 'Curl weight to shoulder', 'Lower controlled'],
    defaultSets: 3,
    defaultReps: 12,
  },
  {
    id: 'arms-2',
    name: 'Tricep Dip',
    category: 'Arms',
    imageUrl: 'https://raw.githubusercontent.com/wrkout/exercises-data/main/exercises/tricep-dip.png',
    videoUrl: '',
    instructions: ['Grip bench edge', 'Lower body down', 'Push back up'],
    defaultSets: 3,
    defaultReps: 10,
  },
  {
    id: 'arms-3',
    name: 'Hammer Curl',
    category: 'Arms',
    imageUrl: 'https://raw.githubusercontent.com/wrkout/exercises-data/main/exercises/hammer-curl.png',
    videoUrl: '',
    instructions: ['Neutral grip dumbbells', 'Curl to shoulder', 'Lower slowly'],
    defaultSets: 3,
    defaultReps: 12,
  },
  {
    id: 'core-1',
    name: 'Plank',
    category: 'Core',
    imageUrl: 'https://raw.githubusercontent.com/wrkout/exercises-data/main/exercises/plank.png',
    videoUrl: '',
    instructions: ['Forearms on ground', 'Body straight line', 'Hold position'],
    defaultSets: 3,
    defaultReps: 30,
  },
  {
    id: 'core-2',
    name: 'Crunches',
    category: 'Core',
    imageUrl: 'https://raw.githubusercontent.com/wrkout/exercises-data/main/exercises/crunch.png',
    videoUrl: '',
    instructions: ['Lie on back knees bent', 'Curl shoulders up', 'Lower controlled'],
    defaultSets: 3,
    defaultReps: 20,
  },
  {
    id: 'core-3',
    name: 'Leg Raises',
    category: 'Core',
    imageUrl: 'https://raw.githubusercontent.com/wrkout/exercises-data/main/exercises/leg-raise.png',
    videoUrl: '',
    instructions: ['Lie flat on back', 'Raise legs to 90°', 'Lower slowly'],
    defaultSets: 3,
    defaultReps: 15,
  },
  {
    id: 'legs-1',
    name: 'Squat',
    category: 'Legs',
    imageUrl: 'https://raw.githubusercontent.com/wrkout/exercises-data/main/exercises/squat.png',
    videoUrl: '',
    instructions: ['Feet shoulder-width', 'Lower hips back', 'Go to parallel', 'Drive up'],
    defaultSets: 4,
    defaultReps: 12,
  },
  {
    id: 'legs-2',
    name: 'Lunges',
    category: 'Legs',
    imageUrl: 'https://raw.githubusercontent.com/wrkout/exercises-data/main/exercises/lunge.png',
    videoUrl: '',
    instructions: ['Step forward', 'Lower back knee', 'Push through front heel'],
    defaultSets: 3,
    defaultReps: 10,
  },
  {
    id: 'legs-3',
    name: 'Leg Press',
    category: 'Legs',
    imageUrl: 'https://raw.githubusercontent.com/wrkout/exercises-data/main/exercises/leg-press.png',
    videoUrl: '',
    instructions: ['Sit on machine', 'Press platform away', 'Return slow'],
    defaultSets: 4,
    defaultReps: 10,
  },
];

export const getExercisesByCategory = (category: ExerciseCategory): Exercise[] => {
  if (category === 'All') return exercises;
  return exercises.filter((e) => e.category === category);
};

export const getExerciseById = (id: string): Exercise | undefined => {
  return exercises.find((e) => e.id === id);
};

export const getCategoryImageUrl = (category: ExerciseCategory): string => {
  const map: Record<string, string> = {
    All: 'https://raw.githubusercontent.com/wrkout/exercises-data/main/exercises/push-up.png',
    Chest: 'https://raw.githubusercontent.com/wrkout/exercises-data/main/exercises/bench-press.png',
    Back: 'https://raw.githubusercontent.com/wrkout/exercises-data/main/exercises/pull-up.png',
    Arms: 'https://raw.githubusercontent.com/wrkout/exercises-data/main/exercises/bicep-curl.png',
    Core: 'https://raw.githubusercontent.com/wrkout/exercises-data/main/exercises/plank.png',
    Legs: 'https://raw.githubusercontent.com/wrkout/exercises-data/main/exercises/squat.png',
  };
  return map[category] || '';
};
