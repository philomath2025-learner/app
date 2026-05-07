export type ReviewRating = "again" | "hard" | "good" | "easy";

export interface SM2Result {
  interval: number;
  repetition: number;
  easeFactor: number;
}

/**
 * SuperMemo-2 (SM-2) Spaced Repetition Algorithm.
 * 
 * Maps user ratings to the 0-5 SM-2 scale:
 * - "again" -> 1
 * - "hard"  -> 3
 * - "good"  -> 4
 * - "easy"  -> 5
 * 
 * Returns updated interval (in days), repetitions, and ease factor.
 */
export function calculateSM2(
  rating: ReviewRating,
  prevInterval: number,
  prevRepetition: number,
  prevEaseFactor: number
): SM2Result {
  let quality: number;
  switch (rating) {
    case "again": quality = 1; break;
    case "hard": quality = 3; break;
    case "good": quality = 4; break;
    case "easy": quality = 5; break;
    default: quality = 4;
  }

  let interval: number;
  let repetition: number;
  let easeFactor = prevEaseFactor;

  // If score is < 3 (i.e. "again"), reset repetitions and set interval to 1.
  if (quality < 3) {
    repetition = 0;
    interval = 1;
  } else {
    // Correct response
    if (prevRepetition === 0) {
      interval = 1;
    } else if (prevRepetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(prevInterval * prevEaseFactor);
    }
    repetition = prevRepetition + 1;
  }

  // Update Ease Factor
  easeFactor = prevEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  return {
    interval,
    repetition,
    easeFactor,
  };
}

/**
 * Helper to add days to a Date object
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
