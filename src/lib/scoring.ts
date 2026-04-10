/**
 * Централізовані формули підрахунку балів для всіх вправ.
 * Використовуються як у solo-режимі, так і в дуельному.
 */

/**
 * Таблиця Шульте:
 * base 1000 − штраф за час (1 бал / 100 мс) − штраф за помилки (50 балів / помилка)
 */
export function calcSchulteScore(durationMs: number, errors: number): number {
  const timePenalty  = Math.floor(durationMs / 100);
  const errorPenalty = errors * 50;
  return Math.max(0, 1000 - timePenalty - errorPenalty);
}

/**
 * Числа:
 * base  = correctCount×100 − timePenalty(2 бали/сек) − errorPenalty(20 балів/помилка)
 * score = round(base × (1 + difficultyFactor))
 *
 * difficultyFactor ∈ [0, 1]:
 *   2000 мс (найлегше) → 0.0  →  множник ×1.0
 *      1 мс (найважче) → 1.0  →  множник ×2.0
 */
export function calcNumbersScore(
  correctCount: number,
  durationMs: number,
  errors: number,
  displayTime: number,
): number {
  const timePenalty      = Math.floor(durationMs / 1000) * 2;
  const errorPenalty     = errors * 20;
  const base             = Math.max(0, correctCount * 100 - timePenalty - errorPenalty);
  const difficultyFactor = Math.max(0, Math.min(1, (2000 - displayTime) / 1999));
  return Math.round(base * (1 + difficultyFactor));
}

/**
 * Словопари:
 * 100 балів за вірне − 50 балів за хибне − штраф 2 бали/сек
 *
 * Уніфікована формула: раніше solo нараховував бонус за залишений час (+timeLeft*2),
 * а duel — штраф за витрачений час (−elapsed*2). Прийнято duel-варіант:
 * не залежить від початкового ліміту і консистентний з іншими вправами.
 */
export function calcWordPairsScore(correct: number, wrong: number, durationMs: number): number {
  const timePenalty = Math.floor(durationMs / 1000) * 2;
  return Math.max(0, correct * 100 - wrong * 50 - timePenalty);
}

/**
 * RSVP:
 * score = round(correctRatio × 100 × (1 + difficultyFactor))
 * difficultyFactor = speedScore×0.5 + widthScore×0.5  ∈ [0, 1]
 * Результат: 0 → 200 балів
 */
export function calcRsvpScore(
  correctCount: number,
  totalQuestions: number,
  displayTimeMs: number,
  syntagmWidth: number,
): number {
  const correctRatio     = totalQuestions > 0 ? correctCount / totalQuestions : 0;
  const speedScore       = (1000 - displayTimeMs) / 900; // 0.0 (1000 мс) → 1.0 (100 мс)
  const widthScore       = (syntagmWidth - 1) / 4;       // 0.0 (1 сл.) → 1.0 (5 сл.)
  const difficultyFactor = speedScore * 0.5 + widthScore * 0.5;
  return Math.round(correctRatio * 100 * (1 + difficultyFactor));
}

/**
 * Читання синтагмами:
 * score = round(correctRatio × 100 × (1 + difficultyFactor))
 * difficultyFactor = speedScore×0.5 + widthScore×0.5  ∈ [0, 1]
 *
 * Діапазони (відповідно до UI):
 *   displayTime: 200–1000 мс  → speedScore: 0.0 (1000 мс) → 1.0 (200 мс)
 *   syntagmWidth: 1–6 слів    → widthScore: 0.0 (1 сл.)   → 1.0 (6 сл.)
 *
 * Результат: 0 → 200 балів
 */
export function calcSyntagmScore(
  correctCount: number,
  totalQuestions: number,
  displayTimeMs: number,
  syntagmWidth: number,
): number {
  const correctRatio     = totalQuestions > 0 ? correctCount / totalQuestions : 0;
  const speedScore       = Math.max(0, Math.min(1, (1000 - displayTimeMs) / 800)); // 200–1000 мс
  const widthScore       = Math.max(0, Math.min(1, (syntagmWidth - 1) / 5));       // 1–6 сл.
  const difficultyFactor = speedScore * 0.5 + widthScore * 0.5;
  return Math.round(correctRatio * 100 * (1 + difficultyFactor));
}

/**
 * Пошук слів:
 * 100 балів за знайдене слово + бонус швидкості (до 180 сек)
 */
export function calcWordSearchScore(foundCount: number, timeElapsedSec: number): number {
  const speedBonus = Math.max(0, 180 - timeElapsedSec);
  return foundCount * 100 + speedBonus * foundCount;
}

/**
 * Пошук букв:
 * base  = foundCount × 100 − errors × 25 + max(0, 120 − timeElapsedSec) × 2
 * difficultyFactor = gridFactor × 0.4 + letterFactor × 0.6  ∈ [0, 1]
 * score = round(base × (1 + difficultyFactor))
 *
 * Діапазони:
 *   totalCells:  80 клітинок (8×10) → 154 клітинки (11×14)   gridFactor:   0.0 → 1.0
 *   letterCount: 1 буква            → 4 букви                letterFactor: 0.0 → 1.0
 *
 * Множник складності: ×1.0 (найлегше) → ×2.0 (найскладніше)
 */
export function calcLetterSearchScore(
  foundCount: number,
  errors: number,
  timeElapsedSec: number,
  totalCells: number,    // rows × cols
  letterCount: number,
): number {
  const base = foundCount * 100 - errors * 25 + Math.max(0, 120 - timeElapsedSec) * 2;
  if (base <= 0) return 0;
  const gridFactor       = Math.max(0, Math.min(1, (totalCells - 80) / 74));
  const letterFactor     = (letterCount - 1) / 3;
  const difficultyFactor = gridFactor * 0.4 + letterFactor * 0.6;
  return Math.round(base * (1 + difficultyFactor));
}

