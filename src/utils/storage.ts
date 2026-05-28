import { WorkoutPlan, WorkoutHistoryEntry } from '../types';

const PLANS_KEY = 'beast_mode_workout_plans';
const HISTORY_KEY = 'beast_mode_workout_history';

const DEFAULT_PLANS: WorkoutPlan[] = [
  {
    id: 'beast_default_fullbody',
    name: 'Beast Full Body Smash',
    type: 'SETS',
    exercises: [
      {
        id: 'ex1',
        name: 'Explosive Push-ups',
        icon: 'zap',
        sets: 3,
        workDuration: 45,
        restDuration: 15,
        nextExerciseRest: 30
      },
      {
        id: 'ex2',
        name: 'Heavy Goblet Squats',
        icon: 'dumbbell',
        sets: 3,
        workDuration: 45,
        restDuration: 15,
        nextExerciseRest: 30
      },
      {
        id: 'ex3',
        name: 'Kettlebell Swings',
        icon: 'flame',
        sets: 3,
        workDuration: 45,
        restDuration: 15,
        nextExerciseRest: 30
      },
      {
        id: 'ex4',
        name: 'Hollow Body Plank Hold',
        icon: 'shield',
        sets: 3,
        workDuration: 30,
        restDuration: 15,
        nextExerciseRest: 30
      }
    ],
    amrapDuration: 0,
    createdAt: 1716595200000 // Fixed old date
  },
  {
    id: 'beast_default_hiit',
    name: 'HIIT Fat Burn Burner',
    type: 'SETS',
    exercises: [
      {
        id: 'hiit1',
        name: 'Burpees Out of Hell',
        icon: 'flame',
        sets: 4,
        workDuration: 40,
        restDuration: 20
      },
      {
        id: 'hiit2',
        name: 'Db Thrusters & Pushpress',
        icon: 'dumbbell',
        sets: 4,
        workDuration: 40,
        restDuration: 20
      },
      {
        id: 'hiit3',
        name: 'Speed Mountain Climbers',
        icon: 'footprints',
        sets: 4,
        workDuration: 30,
        restDuration: 15
      }
    ],
    amrapDuration: 0,
    createdAt: 1716595210000
  },
  {
    id: 'beast_default_amrap',
    name: 'AMRAP Iron Gladiator',
    type: 'AMRAP',
    exercises: [
      { id: 'a1', name: '10x Dumbbell Thrusters', icon: 'dumbbell', sets: 1, workDuration: 0, restDuration: 0 },
      { id: 'a2', name: '15x Kettlebell Swings', icon: 'flame', sets: 1, workDuration: 0, restDuration: 0 },
      { id: 'a3', name: '10x Plyo Push-ups', icon: 'zap', sets: 1, workDuration: 0, restDuration: 0 },
      { id: 'a4', name: '10x V-Ups Core Crush', icon: 'shield', sets: 1, workDuration: 0, restDuration: 0 }
    ],
    amrapDuration: 900, // 15 minutes
    createdAt: 1716595220000
  }
];

export function getWorkoutPlans(): WorkoutPlan[] {
  try {
    const plansJson = localStorage.getItem(PLANS_KEY);
    if (!plansJson) {
      localStorage.setItem(PLANS_KEY, JSON.stringify(DEFAULT_PLANS));
      return DEFAULT_PLANS;
    }
    const plans = JSON.parse(plansJson) as WorkoutPlan[];
    // Ensure default plans are always present
    const merged = [...plans];
    DEFAULT_PLANS.forEach(df => {
      if (!merged.some(m => m.id === df.id)) {
        merged.push(df);
      }
    });
    return merged;
  } catch (e) {
    console.error('Failed to parse workout plans', e);
    return DEFAULT_PLANS;
  }
}

export function saveWorkoutPlan(plan: WorkoutPlan): WorkoutPlan[] {
  const current = getWorkoutPlans();
  const index = current.findIndex(p => p.id === plan.id);
  if (index >= 0) {
    current[index] = plan;
  } else {
    current.push(plan);
  }
  localStorage.setItem(PLANS_KEY, JSON.stringify(current));
  return current;
}

export function deleteWorkoutPlan(id: string): WorkoutPlan[] {
  const current = getWorkoutPlans().filter(p => p.id !== id || id.startsWith('beast_default_'));
  localStorage.setItem(PLANS_KEY, JSON.stringify(current));
  return current;
}

export function getWorkoutHistory(): WorkoutHistoryEntry[] {
  try {
    const histJson = localStorage.getItem(HISTORY_KEY);
    if (!histJson) return [];
    return JSON.parse(histJson) as WorkoutHistoryEntry[];
  } catch (e) {
    console.warn('Failed to parse history', e);
    return [];
  }
}

export function addHistoryEntry(entry: WorkoutHistoryEntry): WorkoutHistoryEntry[] {
  const current = getWorkoutHistory();
  current.unshift(entry); // Newest first
  localStorage.setItem(HISTORY_KEY, JSON.stringify(current));
  return current;
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}
