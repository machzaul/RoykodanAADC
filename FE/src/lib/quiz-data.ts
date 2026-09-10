import fs from 'fs';
import path from 'path';
import { DEFINED_CARDS, DefinedCard, ALL_CARDS } from './cards';

export interface QuizAnswer {
  id: string;
  text: string;
  score?: number;
  resultMapping: Record<string, number>;
}

export interface QuizQuestion {
  id: string;
  order: number;
  text: string;
  answers: QuizAnswer[];
}

export interface QuizData {
  title: string;
  slug: string;
  description: string;
  questions: QuizQuestion[];
}

export function getLocalQuiz(): QuizData {
  try {
    const quizPath = path.resolve(process.cwd(), 'data', 'quiz.json');
    if (fs.existsSync(quizPath)) {
      const raw = fs.readFileSync(quizPath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Gagal membaca data/quiz.json, menggunakan fallback in-memory:', err);
  }

  // Default fallback if quiz.json is missing
  return {
    title: 'Find Your Love Language',
    slug: 'eggspresi-cinta',
    description: 'Eggspresi Cinta • Royco x AADC Experience',
    questions: [],
  };
}

export function calculateQuizResult(
  answerIds: string[],
  cardCounts?: Record<string, number>,
  cardQuotas?: Record<string, number>
): {
  card: DefinedCard;
  scores: Record<string, number>;
  answersText: string[];
  isQuotaFallback?: boolean;
  originalWinnerCode?: string;
} {
  const quiz = getLocalQuiz();
  const allAnswersMap = new Map<string, QuizAnswer>();
  quiz.questions.forEach((q) => {
    q.answers.forEach((a) => {
      allAnswersMap.set(a.id, a);
    });
  });

  const scores: Record<string, number> = {
    ACTS_OF_SERVICE: 0,
    QUALITY_TIME: 0,
    PHYSICAL_TOUCH: 0,
    RECEIVING_GIFTS: 0,
    WORDS_OF_AFFIRMATION: 0,
  };

  const answersText: string[] = [];

  answerIds.forEach((id) => {
    const ans = allAnswersMap.get(id);
    if (ans) {
      answersText.push(ans.text);
      if (ans.resultMapping) {
        Object.entries(ans.resultMapping).forEach(([cat, weight]) => {
          scores[cat] = (scores[cat] || 0) + (typeof weight === 'number' ? weight : 0);
        });
      }
    }
  });

  // Helper untuk mengecek kuota kartu
  const getQuotaForCard = (slug: string): number => {
    if (cardQuotas && typeof cardQuotas[slug] === 'number') {
      return cardQuotas[slug];
    }
    return 100; // default kuota maksimal adalah 100
  };

  const getCountForCard = (slug: string): number => {
    if (cardCounts && typeof cardCounts[slug] === 'number') {
      return cardCounts[slug];
    }
    return 0;
  };

  // Cari skor tertinggi di antara semua kategori Love Language
  let maxScore = -1;
  Object.values(scores).forEach((score) => {
    if (score > maxScore) {
      maxScore = score;
    }
  });

  // Kategori-kategori yang memperoleh skor tertinggi
  const topCategories = Object.entries(scores)
    .filter(([, score]) => score === maxScore)
    .map(([cat]) => cat);

  // Pilih pemenang awal (jika seri, pilih secara random di antara yang seri)
  const originalWinnerCode =
    topCategories[Math.floor(Math.random() * topCategories.length)] || 'ACTS_OF_SERVICE';

  const originalWinnerCard =
    ALL_CARDS.find((c) => c.code.toUpperCase() === originalWinnerCode.toUpperCase()) ||
    DEFINED_CARDS['1'];

  // Cek ketersediaan kartu pemenang terhadap kuota maksimal (100)
  const winnerQuota = getQuotaForCard(originalWinnerCard.slug);
  const winnerCount = getCountForCard(originalWinnerCard.slug);
  const isWinnerAvailable = winnerCount < winnerQuota;

  if (isWinnerAvailable) {
    return {
      card: originalWinnerCard,
      scores,
      answersText,
      isQuotaFallback: false,
    };
  }

  // Jika kartu pemenang sudah keluar mencapai batas kuota (100):
  // "jika salah kartu sudah keluar 100 maka tidak dikeluarkan lagi dan hasil random nya akan kartu yang lain"
  // Saring semua kartu yang masih memiliki kuota (< 100)
  const availableCards = ALL_CARDS.filter((c) => {
    const quota = getQuotaForCard(c.slug);
    const count = getCountForCard(c.slug);
    return count < quota;
  });

  if (availableCards.length > 0) {
    // Pilih secara random salah satu dari kartu-kartu lain yang masih tersedia
    const randomIndex = Math.floor(Math.random() * availableCards.length);
    const randomCard = availableCards[randomIndex];

    return {
      card: randomCard,
      scores,
      answersText,
      isQuotaFallback: true,
      originalWinnerCode,
    };
  }

  // Jika semua kartu kuotanya sudah habis (edge case darurat: semua >= 100),
  // pilih kartu dengan jumlah keluar paling sedikit agar distribusi tetap seimbang
  let lowestCountCard = ALL_CARDS[0];
  let minCount = Infinity;
  ALL_CARDS.forEach((c) => {
    const count = getCountForCard(c.slug);
    if (count < minCount) {
      minCount = count;
      lowestCountCard = c;
    }
  });

  return {
    card: lowestCountCard,
    scores,
    answersText,
    isQuotaFallback: true,
    originalWinnerCode,
  };
}
