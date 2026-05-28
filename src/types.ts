export type WorkoutType = 'SETS' | 'AMRAP';

export type AppTheme = 'BEAST' | 'ZEN' | 'ENERGY';

export interface Exercise {
  id: string;
  name: string;
  icon: string; // 'dumbbell' | 'flame' | 'zap' | 'heart' | 'footprints' | 'trending-up' | 'shield'
  sets: number;
  workDuration: number; // in seconds
  restDuration: number; // in seconds
  nextExerciseRest?: number; // in seconds
}

export interface WorkoutPlan {
  id: string;
  name: string;
  type: WorkoutType;
  exercises: Exercise[];
  amrapDuration: number; // in seconds (for AMRAP mode, total exercise time)
  amrapWorkDuration?: number; // in seconds (for automated time circuit)
  amrapRestDuration?: number; // in seconds (for automated time circuit)
  amrapAutoCircuit?: boolean; // track if it runs automatically in work/rest cycles
  createdAt: number;
}

export interface WorkoutHistoryEntry {
  id: string;
  planId: string;
  name: string;
  type: WorkoutType;
  date: number; // timestamp
  totalDuration: number; // in seconds
  setsCompleted: number;
  totalSetsGoal: number;
  caloriesBurned: number;
  performanceScore: number; // score 1-100
  themeUsed: AppTheme;
}

export interface ActiveWorkoutState {
  currentExerciseIndex: number;
  currentSet: number;
  phase: 'GET_READY' | 'WORK' | 'REST' | 'COMPLETED';
  secondsLeft: number;
  totalDurationElapsed: number;
  isPaused: boolean;
  completedRoundsCount: number; // For AMRAP Manual round counts or general manual counting
}
