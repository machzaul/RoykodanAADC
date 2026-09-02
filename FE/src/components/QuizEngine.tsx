'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RotateCcw, Check, Printer, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import PanciSequencePlayer from './PanciSequencePlayer';

interface Answer {
  id: string;
  text: string;
  image: string | null;
  score?: number;
}

interface Question {
  id: string;
  text: string;
  image: string | null;
  answers: Answer[];
}

interface ResultOption {
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

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  questions: Question[];
}

interface QuizEngineProps {
  initialQuizSlug?: string;
}

// 5-Color Rainbow Strip matching exact screenshot proportions
const ColorStripeBar = () => (
  <div className="w-full h-3 sm:h-3.5 flex shrink-0 overflow-hidden z-20">
    <div className="flex-1 bg-[#00A3E0]" />
    <div className="flex-1 bg-[#00A651]" />
    <div className="flex-1 bg-[#38B6FF]" />
    <div className="flex-1 bg-[#FFC700]" />
    <div className="flex-1 bg-[#009E49]" />
  </div>
);

// Authentic Brand Lockup Image (Royco | Ada apa dengan Cinta?)
const BrandHeader = () => (
  <div className="w-full flex items-center justify-center pt-5 pb-2 px-6">
    <img
      src="/ImageRef/brand-lockup.png"
      alt="Royco x Ada apa dengan Cinta?"
      className="h-10 sm:h-12 w-auto max-w-[280px] sm:max-w-[320px] object-contain drop-shadow-sm"
    />
  </div>
);

export default function QuizEngine({ initialQuizSlug = 'eggspresi-cinta' }: QuizEngineProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Flow States: 'intro' | 'form' | 'ready' | 'quiz' | 'loading' | 'result'
  const [flowState, setFlowState] = useState<'intro' | 'form' | 'ready' | 'quiz' | 'loading' | 'result'>('intro');

  // Form Inputs
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(true);
  const [newsletter, setNewsletter] = useState(false);
  const [formValidationErr, setFormValidationErr] = useState('');

  // Active quiz session state
  const [sessionId, setSessionId] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [selectedAnswerLetter, setSelectedAnswerLetter] = useState<string | null>(null);
  const [resultData, setResultData] = useState<ResultOption | null>(null);
  const [origin, setOrigin] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    async function loadQuiz() {
      try {
        const response = await fetch('/api/quizzes/active');
        if (!response.ok) {
          throw new Error('Gagal memuat kuis.');
        }
        const data = await response.json();
        setQuiz(data);
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat memuat data.');
      } finally {
        setLoading(false);
      }
    }
    loadQuiz();
  }, [initialQuizSlug]);

  const handleStartIntro = () => {
    setFlowState('form');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidationErr('');

    if (!name.trim()) {
      setFormValidationErr('Nama wajib diisi.');
      return;
    }
    if (!phone.trim()) {
      setFormValidationErr('Nomor WhatsApp wajib diisi.');
      return;
    }
    if (!/^\d{8,16}$/.test(phone.replace(/[\s\-+]/g, ''))) {
      setFormValidationErr('Nomor WhatsApp tidak valid (masukkan angka yang benar).');
      return;
    }
    if (!consent) {
      setFormValidationErr('Kamu harus menyetujui pemakaian data untuk lanjut.');
      return;
    }

    try {
      const response = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          consent,
          newsletter,
          quizId: quiz?.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal memulai sesi.');
      }

      const sessionData = await response.json();
      setSessionId(sessionData.sessionId);
      setSessionToken(sessionData.token);
      setFlowState('ready');
    } catch (err: any) {
      setFormValidationErr(err.message || 'Gagal memulai kuis. Coba lagi.');
    }
  };

  const handleStartQuizQuestions = () => {
    setFlowState('quiz');
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setSelectedAnswerLetter(null);
  };

  const handleAnswerSelect = (questionId: string, answerId: string, letter: string) => {
    if (selectedAnswerLetter) return;
    setSelectedAnswerLetter(letter);

    const updatedAnswers = { ...selectedAnswers, [questionId]: answerId };
    setSelectedAnswers(updatedAnswers);

    const isLastQuestion = quiz && currentQuestionIndex === quiz.questions.length - 1;

    setTimeout(() => {
      setSelectedAnswerLetter(null);
      if (!isLastQuestion) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        handleSubmitQuiz(updatedAnswers);
      }
    }, 280);
  };

  const handleSubmitQuiz = async (finalAnswers: Record<string, string>) => {
    setFlowState('loading');
    const minLoadingTimer = new Promise((resolve) => setTimeout(resolve, 2200));

    try {
      const answerIds = Object.values(finalAnswers);
      const submitPromise = fetch('/api/sessions/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          answerIds,
        }),
      }).then((res) => res.json());

      const [_, data] = await Promise.all([minLoadingTimer, submitPromise]);

      if (data && data.result) {
        setResultData(data.result);
        if (data.token) setSessionToken(data.token);
        setFlowState('result');
      } else {
        throw new Error('Gagal memproses hasil.');
      }
    } catch (err) {
      console.error('Submit error:', err);
      // Fallback
      setResultData({
        id: 'fallback',
        code: 'ACTS_OF_SERVICE',
        title: 'Acts of Service',
        subTitle: 'Menemukan Omelet Hangat yang Lembut Sudah Tersaji Rapi di Meja',
        description: 'Kehadiran omelet hangat adalah bukti cinta yang nyata.',
        image: '/ImageRef/Cardresult/PNG/CARD-01.png',
        backgroundColor: '#E50012',
        ctaText: 'Cetak Struk',
        ctaUrl: null,
      });
      setFlowState('result');
    }
  };

  const handleReset = () => {
    setFlowState('intro');
    setName('');
    setPhone('');
    setEmail('');
    setConsent(true);
    setNewsletter(false);
    setSelectedAnswers({});
    setSelectedAnswerLetter(null);
    setCurrentQuestionIndex(0);
    setResultData(null);
    setShowReceiptModal(false);
  };

  const optionLetters = ['A', 'B', 'C', 'D', 'E'];

  if (loading) {
    return (
      <div className="w-full max-w-[440px] min-h-[100dvh] sm:min-h-[880px] bg-[#E50012] flex flex-col items-center justify-center text-white p-6 rounded-none sm:rounded-[36px] shadow-2xl">
        <Loader2 className="w-14 h-14 animate-spin text-[#FFC700]" />
        <span className="mt-4 text-lg font-black tracking-wider uppercase text-white">Memuat Pengalaman...</span>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="w-full max-w-[440px] min-h-[100dvh] sm:min-h-[880px] bg-[#E50012] flex flex-col items-center justify-center text-white p-6 rounded-none sm:rounded-[36px] shadow-2xl text-center">
        <div className="text-6xl mb-4">🍳</div>
        <h3 className="text-2xl font-black uppercase text-white">Pengalaman Belum Tersedia</h3>
        <p className="text-sm text-white/90 mt-2 max-w-xs">{error || 'Tidak dapat memuat kuis.'}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 btn-royco-yellow font-black px-8 py-3 rounded-full text-base uppercase cursor-pointer"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const shareUrl = sessionToken ? (origin + '/result/' + sessionToken) : origin;

  return (
    <div className="relative w-full max-w-[440px] min-h-[100dvh] sm:min-h-[880px] bg-[#E50012] text-white flex flex-col justify-between overflow-hidden sm:rounded-[36px] shadow-2xl select-none font-sans">
      
      {/* Top Rainbow Strip */}
      <ColorStripeBar />

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col justify-between relative overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait">

          {/* ========================================================================= */}
          {/* SCREEN 1: INTRO SCREEN                                                    */}
          {/* ========================================================================= */}
          {flowState === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col justify-between px-6 py-4 text-center"
            >
              {/* Brand Header Lockup */}
              <BrandHeader />

              {/* Egg Mascot Graphic */}
              <div className="flex-1 flex flex-col items-center justify-center my-auto pt-2">
                <div className="relative flex flex-col items-center">
                  <img
                    src="/ImageRef/Teluromelete.png"
                    alt="Telur Omelet Cinta Royco"
                    className="w-56 sm:w-64 h-auto object-contain drop-shadow-xl"
                  />
                  <img
                    src="/ImageRef/shadow.png"
                    alt=""
                    className="w-40 sm:w-48 h-auto mt-[-12px] opacity-40"
                  />
                </div>

                {/* Subtitle & Headline */}
                <span className="text-[#FFC700] text-[13px] sm:text-[14px] font-black tracking-widest uppercase mt-6 block">
                  EGGSPRESI CINTA • ROYCO X AADC
                </span>

                <h1 className="text-[44px] sm:text-[50px] font-black text-white leading-[1.02] tracking-tight mt-2 drop-shadow-sm">
                  Find Your<br />Love<br />Language
                </h1>

                <p className="text-white text-[15px] sm:text-[16px] font-semibold leading-snug px-4 mt-3 max-w-[320px]">
                  Cara kamu masak diam-diam nyimpen cara kamu mencintai. Yuk cari tahu!
                </p>
              </div>

              {/* Start Button */}
              <div className="pb-6 pt-3">
                <button
                  onClick={handleStartIntro}
                  className="btn-royco-yellow font-black text-[22px] py-4 px-10 rounded-full w-[85%] max-w-[300px] mx-auto flex items-center justify-center gap-2 cursor-pointer shadow-[0_6px_0_#D49B00] active:translate-y-1"
                >
                  <span>Mulai</span>
                  <span className="text-[24px] leading-none">→</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* SCREEN 2: LEAD FORM SCREEN                                                */}
          {/* ========================================================================= */}
          {flowState === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col justify-between px-6 py-4"
            >
              <div>
                <BrandHeader />

                <span className="text-[#FFC700] text-[12px] sm:text-[13px] font-black tracking-widest uppercase text-center block mt-3">
                  A ROYCO X AADC EXPERIENCE
                </span>

                <h2 className="text-[36px] sm:text-[42px] font-black text-white text-center leading-tight mt-2">
                  Kenalan dulu yuk
                </h2>
                <p className="text-white/95 text-[14.5px] font-medium text-center px-4 mt-1.5 max-w-[320px] mx-auto">
                  Isi data kamu buat nerima kartu cinta versi digital.
                </p>

                {/* Form Elements */}
                <form onSubmit={handleFormSubmit} className="mt-5 space-y-4 max-w-[360px] mx-auto">
                  {/* Nama */}
                  <div>
                    <label className="text-[#FFC700] font-black text-[15px] mb-1.5 block">
                      Nama
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nicholas"
                      className="w-full bg-white text-black font-bold text-[16px] px-4 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-yellow-400 placeholder:text-gray-400 shadow-sm"
                    />
                  </div>

                  {/* Nomor WhatsApp */}
                  <div>
                    <label className="text-[#FFC700] font-black text-[15px] mb-1.5 block">
                      Nomor WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="08123456789"
                      className="w-full bg-white text-black font-bold text-[16px] px-4 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-yellow-400 placeholder:text-gray-400 shadow-sm"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-[#FFC700] font-black text-[15px] mb-1.5 block">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nicholas@gmail.com"
                      className="w-full bg-white text-black font-bold text-[16px] px-4 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-yellow-400 placeholder:text-gray-400 shadow-sm"
                    />
                  </div>

                  {/* Checkbox 1: Event Consent */}
                  <div
                    onClick={() => setConsent(!consent)}
                    className="flex items-start gap-3 pt-1.5 cursor-pointer"
                  >
                    <div
                      className={'w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors border-2 ' + (consent ? 'bg-white border-white text-[#E50012]' : 'bg-transparent border-white')}
                    >
                      {consent && <Check className="w-4 h-4 stroke-[3.5]" />}
                    </div>
                    <span className="text-white text-[12.5px] font-semibold leading-tight">
                      Aku setuju data ku dipakai Royco x AADC dan dihubungi terkait event ini.
                    </span>
                  </div>

                  {/* Checkbox 2: Promo opt-in */}
                  <div
                    onClick={() => setNewsletter(!newsletter)}
                    className="flex items-start gap-3 cursor-pointer"
                  >
                    <div
                      className={'w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors border-2 ' + (newsletter ? 'bg-white border-white text-[#E50012]' : 'bg-transparent border-white')}
                    >
                      {newsletter && <Check className="w-4 h-4 stroke-[3.5]" />}
                    </div>
                    <span className="text-white/95 text-[12.5px] font-semibold leading-tight">
                      Boleh kirim promo & update dari Royco. <span className="text-white/70 font-normal">(opsional)</span>
                    </span>
                  </div>

                  {formValidationErr && (
                    <p className="text-[#FFC700] text-xs font-bold text-center bg-black/20 py-2 px-3 rounded-xl animate-fade-in">
                      {formValidationErr}
                    </p>
                  )}

                  {/* Submit Button */}
                  <div className="pt-3 pb-3">
                    <button
                      type="submit"
                      className="btn-royco-yellow font-black text-[22px] py-4 px-10 rounded-full w-[85%] max-w-[300px] mx-auto flex items-center justify-center gap-2 cursor-pointer shadow-[0_6px_0_#D49B00] active:translate-y-1"
                    >
                      <span>Lanjut</span>
                      <span className="text-[24px] leading-none">→</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* SCREEN 3: READY SCREEN                                                    */}
          {/* ========================================================================= */}
          {flowState === 'ready' && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col justify-between px-6 py-6 text-center"
            >
              <div className="flex-1 flex flex-col items-center justify-center my-auto pt-6">
                {/* Egg Detective Mascot */}
                <div className="relative flex flex-col items-center">
                  <img
                    src="/ImageRef/Teluromelete.png"
                    alt="Siap Kuis"
                    className="w-56 sm:w-64 h-auto object-contain drop-shadow-xl"
                  />
                  <img
                    src="/ImageRef/shadow.png"
                    alt=""
                    className="w-40 sm:w-48 h-auto mt-[-12px] opacity-40"
                  />
                </div>

                <span className="text-[#FFC700] text-[13.5px] font-black tracking-widest uppercase mt-7 block">
                  KAMU SIAP!
                </span>

                <h2 className="text-[40px] sm:text-[46px] font-black text-white leading-tight mt-1.5">
                  Halo, {name || 'Nicholas'}!
                </h2>

                <p className="text-white text-[15px] sm:text-[16px] font-semibold leading-snug px-4 mt-3 max-w-[320px]">
                  5 pertanyaan singkat buat nemuin love language kamu. Jawab jujur ya!
                </p>
              </div>

              {/* Start Quiz Questions Button */}
              <div className="pb-6 pt-3">
                <button
                  onClick={handleStartQuizQuestions}
                  className="btn-royco-yellow font-black text-[22px] py-4 px-10 rounded-full w-[85%] max-w-[300px] mx-auto flex items-center justify-center gap-2 cursor-pointer shadow-[0_6px_0_#D49B00] active:translate-y-1"
                >
                  <span>Mulai Tes</span>
                  <span className="text-[24px] leading-none">→</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* SCREEN 4: QUIZ QUESTIONS SCREEN                                           */}
          {/* ========================================================================= */}
          {flowState === 'quiz' && currentQuestion && (
            <motion.div
              key={'question-' + currentQuestionIndex}
              initial={{ opacity: 0, x: 25 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -25 }}
              transition={{ duration: 0.22 }}
              className="flex-1 flex flex-col justify-between px-5 py-4"
            >
              <div>
                {/* 5-Segment Progress Indicator */}
                <div className="flex items-center justify-center gap-2.5 pt-3">
                  {[0, 1, 2, 3, 4].map((index) => {
                    const isCompleted = index < currentQuestionIndex;
                    const isCurrent = index === currentQuestionIndex;
                    return (
                      <div
                        key={index}
                        className={'h-2 rounded-full transition-all duration-300 ' + (isCurrent ? 'w-12 bg-white' : isCompleted ? 'w-9 bg-[#FFC700]' : 'w-9 bg-black/25')}
                      />
                    );
                  })}
                </div>

                <span className="text-[#FFC700] text-[13px] sm:text-[14px] font-black tracking-wider uppercase text-center block mt-3.5">
                  PERTANYAAN {currentQuestionIndex + 1} DARI {quiz.questions.length}
                </span>

                {/* Question Text */}
                <h3 className="text-[22px] sm:text-[24px] font-black text-white text-center leading-[1.25] px-2 mt-4 mb-5 max-w-[370px] mx-auto">
                  {currentQuestion.text}
                </h3>

                {/* 5 Option Cards (A, B, C, D, E) */}
                <div className="space-y-3 max-w-[390px] mx-auto">
                  {currentQuestion.answers.map((answer, ansIdx) => {
                    const letter = optionLetters[ansIdx] || String(ansIdx + 1);
                    const isSelected = selectedAnswerLetter === letter;

                    return (
                      <button
                        key={answer.id}
                        onClick={() => handleAnswerSelect(currentQuestion.id, answer.id, letter)}
                        className={'quiz-option-card ' + (isSelected ? 'selected ' : '') + 'w-full rounded-[24px] p-2.5 pr-4 flex items-center gap-3.5 text-left cursor-pointer transition-all'}
                      >
                        {/* Letter Badge */}
                        <div className="quiz-option-letter w-12 h-12 bg-[#E50012] text-white font-black text-[20px] rounded-[18px] flex items-center justify-center shrink-0 shadow-sm">
                          {letter}
                        </div>

                        {/* Answer Text */}
                        <span className="text-[13.5px] sm:text-[14.5px] font-black text-[#1a1a1a] leading-snug flex-1 pr-1">
                          {answer.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="py-2 text-center text-white/60 text-[11px] font-bold">
                Ketuk jawaban untuk lanjut
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* SCREEN 5: LOADING SCREEN (Meracik kartu cintamu ..)                         */}
          {/* ========================================================================= */}
          {flowState === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col items-center justify-center px-6 py-6 text-center"
            >
              <div className="flex flex-col items-center justify-center my-auto">
                {/* Smooth 91-Frame Pan Sequence Animation */}
                <div className="relative flex flex-col items-center">
                  <PanciSequencePlayer />
                </div>

                <h2 className="text-[#FFC700] text-[30px] sm:text-[36px] font-black text-center mt-9 leading-tight tracking-wide">
                  Meracik kartu<br />cintamu ..
                </h2>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* SCREEN 6: RESULT SCREEN                                                   */}
          {/* ========================================================================= */}
          {flowState === 'result' && resultData && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col justify-between px-5 py-3 text-center"
            >
              <div>
                <span className="text-[#FFC700] text-[13.5px] sm:text-[14.5px] font-black tracking-widest uppercase block mt-1.5 mb-2.5">
                  HASIL LOVE LANGUAGE KAMU
                </span>

                {/* Love Language Card Image */}
                <div className="w-full max-w-[350px] mx-auto rounded-[26px] overflow-hidden shadow-2xl border-2 border-white/20 bg-[#E50012]">
                  <img
                    src={resultData.image}
                    alt={resultData.title}
                    className="w-full h-auto object-cover max-h-[390px] sm:max-h-[430px]"
                  />
                </div>

                {/* Action Buttons */}
                <div className="mt-4 space-y-3 max-w-[350px] mx-auto">
                  {/* Button 1: Cetak Struk */}
                  <button
                    onClick={() => setShowReceiptModal(true)}
                    className="w-full bg-[#FFC700] hover:bg-[#FFD21A] rounded-[22px] p-3 px-4 flex items-center gap-3.5 shadow-[0_5px_0_#D49B00] active:translate-y-1 transition-all cursor-pointer text-left"
                  >
                    <div className="w-12 h-12 bg-[#E50012] rounded-[16px] flex items-center justify-center shrink-0 shadow-sm">
                      <Printer className="w-6 h-6 text-white stroke-[2.5]" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <span className="text-[#E50012] font-black text-[18px] leading-tight block">
                        Cetak Struk
                      </span>
                      <span className="text-[#880000] font-bold text-[12px] leading-tight block mt-0.5">
                        Tukar struk buat dapetin omelette-mu
                      </span>
                    </div>
                  </button>

                  {/* Card 2: Simpan & share kartumu (with Live QR Code) */}
                  <div className="w-full bg-[#FFF5E5] rounded-[22px] p-3 px-4 flex items-center gap-3.5 shadow-md text-left">
                    <div className="w-14 h-14 bg-white p-1 rounded-[14px] shadow-sm shrink-0 border border-amber-200 flex items-center justify-center">
                      <QRCodeSVG
                        value={shareUrl}
                        size={48}
                        level="M"
                        includeMargin={false}
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <span className="text-[#E50012] font-black text-[17px] leading-tight block">
                        Simpan & share kartumu
                      </span>
                      <span className="text-[#333333] font-bold text-[12px] leading-snug block mt-0.5">
                        Scan QR pakai HP kamu buat download kartu & bagikan ke sosmed.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Button 3: Selesai (Reset Flow) */}
              <div className="pt-2 pb-2">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center justify-center gap-2 text-white font-black text-[15px] hover:text-[#FFC700] transition-colors cursor-pointer underline underline-offset-4"
                >
                  <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                  <span>Selesai</span>
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Bottom Rainbow Strip */}
      <ColorStripeBar />

      {/* ========================================================================= */}
      {/* THERMAL RECEIPT MODAL (When clicking "Cetak Struk")                       */}
      {/* ========================================================================= */}
      {showReceiptModal && resultData && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white text-black w-full max-w-[340px] rounded-3xl p-6 shadow-2xl relative font-mono text-center select-text"
          >
            <button
              onClick={() => setShowReceiptModal(false)}
              className="absolute right-3.5 top-3.5 text-gray-500 hover:text-black p-1 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Receipt Header */}
            <div className="border-b-2 border-dashed border-gray-400 pb-3">
              <span className="text-2xl font-black italic text-[#E50012] block">Royco</span>
              <span className="text-[12px] font-bold tracking-widest uppercase block text-gray-700 mt-0.5">
                EGGSPRESI CINTA x AADC
              </span>
              <span className="text-[10.5px] text-gray-500 block mt-1">
                {new Date().toLocaleDateString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </div>

            {/* Receipt Body */}
            <div className="py-4 space-y-2 border-b-2 border-dashed border-gray-400 text-left text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Nama:</span>
                <span className="font-bold">{name || 'Peserta'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">WhatsApp:</span>
                <span className="font-bold">{phone || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Love Language:</span>
                <span className="font-black text-[#E50012]">{resultData.title}</span>
              </div>
              <div className="mt-3 p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-center">
                <span className="text-[12px] font-bold text-amber-900 block">
                  🎟️ VOUCHER 1x OMELETTE SPESIAL
                </span>
                <span className="text-[10px] text-amber-700 block mt-0.5">
                  Tukarkan struk ini di booth Royco sekarang!
                </span>
              </div>
            </div>

            {/* Receipt Footer with QR */}
            <div className="pt-3 flex flex-col items-center">
              <QRCodeSVG value={shareUrl} size={80} level="M" />
              <span className="text-[9.5px] text-gray-400 mt-2 font-mono">
                Token: {sessionToken || 'ROYCO-AADC'}
              </span>
              <button
                onClick={() => {
                  window.print();
                }}
                className="mt-3.5 w-full bg-[#E50012] hover:bg-red-700 text-white font-sans font-black py-2.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Print Struk</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
