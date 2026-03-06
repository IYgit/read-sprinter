import { getCurrentUser } from './auth';

const MAX_RESULTS = 20;

export interface ExerciseResult {
  score: number;
  date: string;
}

function getStorageKey(exerciseId: string): string {
  const user = getCurrentUser();
  return `exercise_stats_${user}_${exerciseId}`;
}

export function saveExerciseResult(exerciseId: string, score: number): void {
  const key = getStorageKey(exerciseId);
  const existing: ExerciseResult[] = JSON.parse(localStorage.getItem(key) || '[]');
  existing.push({ score, date: new Date().toISOString() });
  if (existing.length > MAX_RESULTS) {
    existing.splice(0, existing.length - MAX_RESULTS);
  }
  localStorage.setItem(key, JSON.stringify(existing));
}

export function getExerciseResults(exerciseId: string): ExerciseResult[] {
  const key = getStorageKey(exerciseId);
  return JSON.parse(localStorage.getItem(key) || '[]');
}
