export interface AnswerMapping {
  [categoryCode: string]: number; // weight value, e.g. {"WORDS_OF_AFFIRMATION": 5, "QUALITY_TIME": 2}
}

export interface AnswerWithMapping {
  id: string;
  resultMapping: any; // Prisma stores this as Prisma.JsonValue
  score: number;
}

export interface ResultOptionPayload {
  id: string;
  code: string;
  title: string;
  subTitle: string | null;
  description: string;
  image: string;
  backgroundColor: string;
  ctaText: string;
  ctaUrl: string | null;
}

/**
 * Calculates the winning result option based on weighted categories from selected answers.
 */
export function calculateResult(
  selectedAnswers: AnswerWithMapping[],
  resultOptions: ResultOptionPayload[]
): ResultOptionPayload {
  if (resultOptions.length === 0) {
    throw new Error('No result options available to calculate.');
  }

  const scores: Record<string, number> = {};

  // Initialize all categories with 0 score
  resultOptions.forEach((opt) => {
    scores[opt.code] = 0;
  });

  // Sum up weights from selected answers
  selectedAnswers.forEach((ans) => {
    const mapping = ans.resultMapping as AnswerMapping | null;
    if (mapping && typeof mapping === 'object') {
      for (const [category, weight] of Object.entries(mapping)) {
        if (typeof weight === 'number') {
          if (scores[category] !== undefined) {
            scores[category] += weight;
          } else {
            scores[category] = weight;
          }
        }
      }
    }
  });

  // Find the category code with the highest total score
  let winningCode = resultOptions[0].code;
  let maxScore = -Infinity;

  for (const [category, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      winningCode = category;
    }
  }

  // Find the ResultOption corresponding to the winning category
  const winningResult = resultOptions.find((opt) => opt.code === winningCode);

  // Fallback to the first option if none is found
  return winningResult || resultOptions[0];
}
