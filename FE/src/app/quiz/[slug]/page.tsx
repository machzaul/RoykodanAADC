import React from 'react';
import QuizEngine from '@/components/QuizEngine';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function QuizPage({ params }: PageProps) {
  const { slug } = await params;

  return (
    <div className="w-full flex justify-center items-center">
      <QuizEngine initialQuizSlug={slug} />
    </div>
  );
}
