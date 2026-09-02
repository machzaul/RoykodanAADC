import React from 'react';
import QuizEngine from '@/components/QuizEngine';

export default function Home() {
  return (
    <div className="w-full flex justify-center items-center">
      <QuizEngine initialQuizSlug="eggspresi-cinta" />
    </div>
  );
}
