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
 * 100 балів за вірну відповідь − штраф 2 бали/сек − штраф 20 балів/помилка
 */
export function calcNumbersScore(correctCount: number, durationMs: number, errors: number): number {
  const timePenalty  = Math.floor(durationMs / 1000) * 2;
  const errorPenalty = errors * 20;
  return Math.max(0, correctCount * 100 - timePenalty - errorPenalty);
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
 * Пошук слів:
 * 100 балів за знайдене слово + бонус швидкості (до 180 сек)
 */
export function calcWordSearchScore(foundCount: number, timeElapsedSec: number): number {
  const speedBonus = Math.max(0, 180 - timeElapsedSec);
  return foundCount * 100 + speedBonus * foundCount;
}

