'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  QrCode,
  ListChecks,
  ExternalLink,
  FileSpreadsheet,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Users,
  Database,
  X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface QuizAnswer {
  id: string;
  text: string;
  score?: number;
  resultMapping: Record<string, number>;
}

interface QuizQuestion {
  id: string;
  order: number;
  text: string;
  answers: QuizAnswer[];
}

interface QuizData {
  title: string;
  slug: string;
  description: string;
  questions: QuizQuestion[];
}

interface CardSettingItem {
  cardId?: number;
  title?: string;
  customQrUrl?: string;
  maxQuota?: number;
}

interface CardsConfigFile {
  onlineBaseUrl?: string;
  defaultMaxQuota?: number;
  notes?: string;
  cards?: Record<string, CardSettingItem>;
  counts?: Record<string, number>;
}

const CARD_METADATA: Record<string, { title: string; image: string; color: string }> = {
  'acts-of-service': {
    title: 'Acts of Service',
    image: '/ImageRef/Cardresult/PNG/CARD-01.png',
    color: '#E50012',
  },
  'quality-time': {
    title: 'Quality Time',
    image: '/ImageRef/Cardresult/PNG/CARD-02.png',
    color: '#00A3E0',
  },
  'physical-touch': {
    title: 'Physical Touch',
    image: '/ImageRef/Cardresult/PNG/CARD-03.png',
    color: '#E50012',
  },
  'receiving-gifts': {
    title: 'Receiving Gifts',
    image: '/ImageRef/Cardresult/PNG/CARD-04.png',
    color: '#FFC700',
  },
  'words-of-affirmation': {
    title: 'Words of Affirmation',
    image: '/ImageRef/Cardresult/PNG/CARD-05.png',
    color: '#00A651',
  },
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'quiz' | 'cards' | 'data'>('quiz');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // States
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [cardsConfig, setCardsConfig] = useState<CardsConfigFile>({
    onlineBaseUrl: 'https://royko-aadc.vercel.app',
    cards: {},
  });
  const [excelStats, setExcelStats] = useState<{
    totalRows: number;
    filePath: string;
    fileSize: string;
    lastModified: string | null;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const [quizRes, cardsRes, dataRes] = await Promise.all([
        fetch('/api/config/quiz'),
        fetch(`/api/config/cards${forceRefresh ? '?refresh=true' : ''}`),
        fetch('/api/config/data'),
      ]);

      if (quizRes.ok) {
        const qData = await quizRes.json();
        setQuizData(qData);
      }
      if (cardsRes.ok) {
        const cData = await cardsRes.json();
        setCardsConfig(cData);
      }
      if (dataRes.ok) {
        const dData = await dataRes.json();
        if (dData?.stats) setExcelStats(dData.stats);
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal memuat konfigurasi dari lokal', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClearExcelData = async () => {
    setIsClearingData(true);
    try {
      const res = await fetch('/api/config/data', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus data Excel');
      showToast(data.message || 'Semua data Excel berhasil dihapus!', 'success');
      setShowConfirmDeleteModal(false);
      await loadAllData(true);
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus data', 'error');
    } finally {
      setIsClearingData(false);
    }
  };

  // Handler update pertanyaan
  const handleQuestionChange = (qIndex: number, newText: string) => {
    if (!quizData) return;
    const nextQuestions = [...quizData.questions];
    nextQuestions[qIndex].text = newText;
    setQuizData({ ...quizData, questions: nextQuestions });
  };

  // Handler update pilihan jawaban
  const handleAnswerChange = (qIndex: number, aIndex: number, newText: string) => {
    if (!quizData) return;
    const nextQuestions = [...quizData.questions];
    nextQuestions[qIndex].answers[aIndex].text = newText;
    setQuizData({ ...quizData, questions: nextQuestions });
  };

  // Simpan Quiz
  const handleSaveQuiz = async () => {
    if (!quizData) return;
    setSaving(true);
    try {
      const res = await fetch('/api/config/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quizData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan pertanyaan');
      showToast('✓ Pertanyaan kuis berhasil disimpan ke data/quiz.json!');
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan kuis', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handler update Base URL
  const handleBaseUrlChange = (newUrl: string) => {
    setCardsConfig({ ...cardsConfig, onlineBaseUrl: newUrl });
  };

  // Handler update custom QR URL per kartu
  const handleCustomCardUrlChange = (slug: string, customUrl: string) => {
    const nextCards = { ...(cardsConfig.cards || {}) };
    nextCards[slug] = {
      ...(nextCards[slug] || {}),
      customQrUrl: customUrl,
    };
    setCardsConfig({ ...cardsConfig, cards: nextCards });
  };

  // Handler update kuota maksimal per kartu
  const handleCustomCardQuotaChange = (slug: string, quota: number) => {
    const nextCards = { ...(cardsConfig.cards || {}) };
    nextCards[slug] = {
      ...(nextCards[slug] || {}),
      maxQuota: isNaN(quota) ? 100 : Math.max(0, quota),
    };
    setCardsConfig({ ...cardsConfig, cards: nextCards });
  };

  // Simpan Cards Config
  const handleSaveCards = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/config/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardsConfig),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan URL & kuota kartu');
      showToast('✓ Pengaturan URL & kuota kartu berhasil disimpan!');
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan konfigurasi kartu', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full shadow-2xl flex items-center gap-2.5 text-sm font-bold animate-bounce text-white ${
            toast.type === 'success' ? 'bg-[#15803D]' : 'bg-[#DC2626]'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-extrabold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali Ke Kiosk</span>
            </Link>
            <div className="h-4 w-px bg-neutral-200" />
            <h1 className="text-base sm:text-lg font-black tracking-tight text-[#E50012] flex items-center gap-1.5">
              <span>Royco x AADC</span>
              <span className="text-neutral-400 font-normal">|</span>
              <span className="text-neutral-800 font-extrabold text-sm sm:text-base">Pengaturan Kuis &amp; QR</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { loadAllData(true); }}
              disabled={loading || saving}
              className="p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {activeTab !== 'data' ? (
              <button
                onClick={activeTab === 'quiz' ? handleSaveQuiz : handleSaveCards}
                disabled={saving || loading}
                className="inline-flex items-center gap-2 bg-[#E50012] hover:bg-[#CC0010] active:scale-95 text-white font-extrabold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            ) : (
              <button
                onClick={() => loadAllData(true)}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-neutral-800 hover:bg-neutral-900 active:scale-95 text-white font-extrabold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Data Excel</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {/* Info Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Mode Pengaturan Kiosk Lokal:</span> Perubahan yang Anda simpan di sini akan
              langsung aktif di layar kuis dan QR code tanpa perlu membuka kodingan ataupun restart sistem.
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-amber-800 bg-amber-100 px-3 py-1 rounded-lg shrink-0">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel: {excelStats?.totalRows ?? 0} Peserta ({excelStats?.fileSize ?? '0 KB'})</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 p-1.5 bg-neutral-200/70 rounded-2xl max-w-xl mb-8">
          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activeTab === 'quiz'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <ListChecks className="w-4 h-4 text-[#E50012]" />
            <span>Teks Kuis</span>
          </button>
          <button
            onClick={() => setActiveTab('cards')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activeTab === 'cards'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <QrCode className="w-4 h-4 text-[#E50012]" />
            <span>URL &amp; Kuota</span>
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activeTab === 'data'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Database className="w-4 h-4 text-[#E50012]" />
            <span>Data Peserta &amp; Excel</span>
          </button>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-3 border-[#E50012] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-neutral-500">Memuat data konfigurasi...</p>
          </div>
        ) : activeTab === 'quiz' ? (
          /* TAB 1: PERTANYAAN KUIS */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-neutral-900 tracking-tight">Daftar 5 Pertanyaan Kuis</h2>
                <p className="text-xs text-neutral-500 font-medium mt-0.5">
                  Ubah teks pertanyaan dan 5 pilihan jawaban. Bobot love language tetap terjaga otomatis.
                </p>
              </div>
              <button
                onClick={handleSaveQuiz}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-[#E50012] hover:bg-[#CC0010] text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Kuis</span>
              </button>
            </div>

            {quizData?.questions?.map((question, qIdx) => (
              <div
                key={question.id || qIdx}
                className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 shadow-xs"
              >
                {/* Header Pertanyaan */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-7 h-7 rounded-lg bg-[#E50012] text-white font-black text-xs flex items-center justify-center">
                    {qIdx + 1}
                  </span>
                  <span className="text-xs font-black tracking-wider uppercase text-neutral-400">
                    Pertanyaan Nomor {qIdx + 1}
                  </span>
                </div>

                {/* Input Teks Pertanyaan */}
                <textarea
                  rows={2}
                  value={question.text}
                  onChange={(e) => handleQuestionChange(qIdx, e.target.value)}
                  className="w-full text-sm sm:text-base font-bold text-neutral-900 border border-neutral-200 rounded-xl p-3 focus:outline-none focus:border-[#E50012] focus:ring-1 focus:ring-[#E50012] transition-colors leading-snug mb-5"
                  placeholder="Ketik pertanyaan kuis di sini..."
                />

                {/* Daftar 5 Jawaban */}
                <div className="space-y-2.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1">
                    Pilihan Jawaban (A - E):
                  </span>
                  {question.answers.map((answer, aIdx) => {
                    const letter = ['A', 'B', 'C', 'D', 'E'][aIdx];
                    const categoryCode = Object.keys(answer.resultMapping || {})[0] || '';
                    return (
                      <div
                        key={answer.id || aIdx}
                        className="flex items-center gap-3 bg-neutral-50/70 border border-neutral-100 rounded-xl p-2 sm:p-2.5"
                      >
                        <span className="w-8 h-8 rounded-lg bg-[#FFC700] text-neutral-900 font-black text-xs flex items-center justify-center shrink-0">
                          {letter}
                        </span>
                        <input
                          type="text"
                          value={answer.text}
                          onChange={(e) => handleAnswerChange(qIdx, aIdx, e.target.value)}
                          className="flex-1 bg-white border border-neutral-200 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-semibold text-neutral-800 focus:outline-none focus:border-[#E50012]"
                          placeholder={`Jawaban opsi ${letter}`}
                        />
                        <span className="hidden sm:inline-block text-[10px] font-bold text-neutral-400 bg-neutral-200 px-2 py-1 rounded-md uppercase tracking-wider shrink-0">
                          {categoryCode.replace(/_/g, ' ')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="text-right pt-2 pb-8">
              <button
                onClick={handleSaveQuiz}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-[#E50012] hover:bg-[#CC0010] text-white font-extrabold text-sm px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Menyimpan...' : 'Simpan Seluruh Pertanyaan Kuis'}</span>
              </button>
            </div>
          </div>
        ) : activeTab === 'cards' ? (
          /* TAB 2: PENGATURAN URL QR & KUOTA KARTU */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-neutral-900 tracking-tight">Pengaturan URL &amp; Kuota Kartu (Maksimal 100)</h2>
                <p className="text-xs text-neutral-500 font-medium mt-0.5">
                  Atur batas maksimal keluarnya kartu dan URL QR code. Jika kartu sudah mencapai kuota (default 100), kartu tidak akan dikeluarkan lagi dan hasil kuis diacak ke kartu lain.
                </p>
              </div>
              <button
                type="button"
                onClick={() => loadAllData(true)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-neutral-600 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Kuota dari Excel</span>
              </button>
            </div>

            {/* Base Domain Box */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 shadow-xs">
              <label className="block text-xs font-black uppercase tracking-wider text-neutral-700 mb-1.5">
                Domain / URL Online Dasar (Base URL):
              </label>
              <p className="text-xs text-neutral-500 mb-3">
                Domain tempat Backend / Vercel di-host (contoh:{' '}
                <code className="text-rose-600 bg-rose-50 px-1 py-0.5 rounded font-bold">
                  https://nama-web.vercel.app
                </code>{' '}
                atau{' '}
                <code className="text-rose-600 bg-rose-50 px-1 py-0.5 rounded font-bold">
                  http://IP_VPS:5000
                </code>
                ).
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={cardsConfig.onlineBaseUrl || ''}
                  onChange={(e) => handleBaseUrlChange(e.target.value)}
                  placeholder="https://royko-aadc.vercel.app"
                  className="flex-1 border border-neutral-300 rounded-xl px-4 py-2.5 text-sm font-bold text-neutral-800 focus:outline-none focus:border-[#E50012]"
                />
              </div>
            </div>

            {/* 5 Cards List */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-neutral-500">
                Pengaturan Kuota &amp; Kustomisasi URL QR (5 Love Languages):
              </h3>

              {Object.entries(CARD_METADATA).map(([slug, meta]) => {
                const cardSetting = cardsConfig.cards?.[slug] || {};
                const customVal = cardSetting.customQrUrl || '';
                const maxQuota = typeof cardSetting.maxQuota === 'number' ? cardSetting.maxQuota : 100;
                const count = cardsConfig.counts?.[slug] || 0;
                const remaining = Math.max(0, maxQuota - count);
                const isFull = count >= maxQuota;
                const pct = maxQuota > 0 ? Math.min(100, Math.round((count / maxQuota) * 100)) : 100;

                const effectiveUrl =
                  customVal.trim() !== ''
                    ? customVal.trim()
                    : `${(cardsConfig.onlineBaseUrl || 'https://royko-aadc.vercel.app').replace(/\/+$/, '')}/result/${slug}`;

                return (
                  <div
                    key={slug}
                    className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center gap-5 transition-colors ${
                      isFull ? 'border-red-300 bg-red-50/20' : 'border-neutral-200'
                    }`}
                  >
                    {/* Thumbnail & Title */}
                    <div className="flex items-center gap-3 min-w-[210px] shrink-0">
                      <img
                        src={meta.image}
                        alt={meta.title}
                        className="w-12 h-16 object-cover rounded-lg border border-neutral-200 shadow-xs"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#E50012] block">
                            Kartu {slug}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-neutral-900">{meta.title}</h4>
                        <div className="mt-1.5">
                          {isFull ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-700 border border-red-200">
                              <AlertCircle className="w-3 h-3" /> Kuota Penuh ({count}/{maxQuota})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Tersedia (Sisa {remaining})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Inputs & Quota Controls */}
                    <div className="flex-1 w-full space-y-3">
                      {/* Quota Progress & Input */}
                      <div className="bg-neutral-50 border border-neutral-200/80 rounded-xl p-3">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[11px] font-extrabold text-neutral-700 flex items-center gap-1.5">
                            Status Pengeluaran Kartu:
                            <span className="font-mono text-xs text-neutral-900 font-black">
                              {count} / {maxQuota} ({pct}%)
                            </span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            <label className="text-[11px] font-bold text-neutral-500">Maksimal (Kuota):</label>
                            <input
                              type="number"
                              min="0"
                              value={maxQuota}
                              onChange={(e) => handleCustomCardQuotaChange(slug, parseInt(e.target.value, 10))}
                              className="w-18 border border-neutral-300 rounded-lg px-2 py-1 text-xs font-black text-center text-neutral-800 bg-white focus:outline-none focus:border-[#E50012]"
                            />
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isFull ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-neutral-500 mt-1">
                          {isFull
                            ? '⚠️ Kartu ini sudah mencapai batas 100 dan tidak akan dikeluarkan lagi. Hasil kuis akan diacak ke kartu lain.'
                            : `Telah dikeluarkan ${count} kali dari batas maksimal ${maxQuota} kartu.`}
                        </p>
                      </div>

                      {/* Custom URL Input */}
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                          Custom QR URL untuk kartu ini (Kosongkan untuk otomatis):
                        </label>
                        <input
                          type="text"
                          value={customVal}
                          onChange={(e) => handleCustomCardUrlChange(slug, e.target.value)}
                          placeholder={`Otomatis: ${effectiveUrl}`}
                          className="w-full border border-neutral-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-neutral-800 focus:outline-none focus:border-[#E50012]"
                        />
                      </div>

                      {/* Active URL Preview */}
                      <div className="flex items-center gap-2 text-[11px] text-neutral-500 truncate">
                        <span className="font-bold text-neutral-400">Target QR:</span>
                        <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded truncate">
                          {effectiveUrl}
                        </span>
                        <a
                          href={effectiveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#E50012] hover:underline shrink-0"
                          title="Uji buka link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* QR Code Mini Preview */}
                    <div className="shrink-0 p-2 bg-neutral-50 border border-neutral-200 rounded-xl flex flex-col items-center">
                      <QRCodeSVG value={effectiveUrl} size={64} level="M" />
                      <span className="text-[9px] font-bold text-neutral-400 mt-1 uppercase">Scan Test</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-right pt-2 pb-8">
              <button
                onClick={handleSaveCards}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-[#E50012] hover:bg-[#CC0010] text-white font-extrabold text-sm px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan URL & Kuota Kartu'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* TAB 3: MANAJEMEN DATA PESERTA & EXCEL */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-neutral-900 tracking-tight">
                  Manajemen Data Peserta Kuis (Excel)
                </h2>
                <p className="text-xs text-neutral-500 font-medium mt-0.5">
                  Pantau statistik berkas Excel peserta, status kuota kartu, serta hapus / reset seluruh data untuk event baru.
                </p>
              </div>
              <button
                type="button"
                onClick={() => loadAllData(true)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-neutral-600 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Statistik</span>
              </button>
            </div>

            {/* Statistik Kartu Excel */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-neutral-500">Total Peserta</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-neutral-900">{excelStats?.totalRows ?? 0}</span>
                  <span className="text-xs font-bold text-neutral-400">orang terdaftar</span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">Baris data yang tercatat di file Excel</p>
              </div>

              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-neutral-500">Ukuran File</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-neutral-900">{excelStats?.fileSize ?? '0 KB'}</span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1 font-mono truncate">{excelStats?.filePath || 'FE/data/peserta_kuis.xlsx'}</p>
              </div>

              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-neutral-500">Terakhir Update</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-sm font-black text-neutral-800">{excelStats?.lastModified || 'Belum ada data'}</span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">Otomatis sinkron saat kuis diselesaikan</p>
              </div>
            </div>

            {/* Rincian Kartu yang Sudah Terpakai */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 shadow-xs">
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-700 mb-4">
                Distribusi Kartu yang Telah Dikeluarkan (Status Terkini):
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {Object.entries(CARD_METADATA).map(([slug, meta]) => {
                  const count = cardsConfig.counts?.[slug] || 0;
                  const maxQuota = cardsConfig.cards?.[slug]?.maxQuota || 100;
                  return (
                    <div key={slug} className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-center">
                      <div className="text-[11px] font-extrabold text-neutral-700 truncate">{meta.title}</div>
                      <div className="text-xl font-black text-neutral-900 mt-1">{count}</div>
                      <div className="text-[10px] text-neutral-400 font-semibold">dari maks {maxQuota}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Danger Zone: Hapus Seluruh Data Excel */}
            <div className="border border-red-200 bg-red-50/60 rounded-2xl p-5 sm:p-6 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-black text-red-900 uppercase tracking-tight">
                    Zona Berbahaya: Hapus Semua Data Excel
                  </h3>
                  <p className="text-xs text-red-700 mt-1 leading-relaxed">
                    Tindakan ini akan <b>menghapus seluruh baris data peserta</b> di dalam file <code className="bg-red-100 px-1 py-0.5 rounded font-mono font-bold">FE/data/peserta_kuis.xlsx</code> (mereset file ke template awal kosong).
                    Nomor antrean harian dan hitungan kuota kartu otomatis direset kembali ke 0.
                  </p>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setShowConfirmDeleteModal(true)}
                      className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Hapus Semua Data Excel Sekarang</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal Konfirmasi Hapus Data */}
      {showConfirmDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-neutral-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-center text-neutral-900 tracking-tight">
              Hapus Semua Data Peserta?
            </h3>
            <p className="text-xs text-neutral-600 text-center mt-2 leading-relaxed">
              Anda akan menghapus <span className="font-bold text-red-600">{excelStats?.totalRows || 0} baris data peserta</span> yang tersimpan di file <code className="bg-neutral-100 px-1 py-0.5 rounded font-mono">peserta_kuis.xlsx</code>.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 my-4 text-[11px] text-amber-800 font-medium">
              ⚠️ <b>Peringatan:</b> Tindakan ini tidak dapat dibatalkan. Kuota seluruh kartu (100) dan nomor antrian akan direset kembali dari awal.
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmDeleteModal(false)}
                disabled={isClearingData}
                className="flex-1 py-3 px-4 rounded-xl border border-neutral-300 text-neutral-700 font-bold text-xs hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleClearExcelData}
                disabled={isClearingData}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isClearingData ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Semua</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
