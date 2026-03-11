import { resultsApi, type ResultDto, type SaveResultRequest } from './api';

export type { ResultDto };

/** Backward-compatible shape used by ExerciseStatsChart */
export interface ExerciseResult {
  score: number;
  date: string;
}

// ─── Save ─────────────────────────────────────────────────────────────────────

export async function saveExerciseResult(
  exerciseType: string,
  score: number,
  extra?: Omit<SaveResultRequest, 'exerciseType' | 'score'>,
): Promise<void> {
  try {
    await resultsApi.save({ exerciseType, score, ...extra });
  } catch (err) {
    console.error('Failed to save exercise result:', err);
  }
}

// ─── Load ─────────────────────────────────────────────────────────────────────

export async function getExerciseResults(exerciseType: string): Promise<ExerciseResult[]> {
  try {
    const results = await resultsApi.getMyResultsByType(exerciseType);
    return results.map(r => ({
      score: r.score ?? 0,
      date: r.completedAt,
    }));
  } catch (err) {
    console.error('Failed to load exercise results:', err);
    return [];
  }
}

export async function getMySummary() {
  return resultsApi.getMySummary();
}
