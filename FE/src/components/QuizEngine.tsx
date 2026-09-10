'use client';

import React, { useEffect, useState } from 'react';
import { Check, Printer, RotateCcw, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import PanciSequencePlayer from './PanciSequencePlayer';
import { getCardByIdOrSlug } from '@/lib/cards';
import { playBacksound, playButtonSound, playResultSound, setupAudioAutoUnlock } from '@/lib/sound';

interface Answer { id: string; text: string; }
interface Question { id: string; text: string; answers: Answer[]; }
interface ResultOption { id: string; code: string; title: string; subTitle: string | null; description: string; image: string; backgroundColor: string; ctaText: string; ctaUrl: string | null; }
interface Quiz { id: string; questions: Question[]; }
interface QuizEngineProps { initialQuizSlug?: string; }
type FormField = 'name' | 'phone' | 'email';
type KeyboardMode = 'letters' | 'numbers';

const letters = ['A', 'B', 'C', 'D', 'E'];
const Stripe = ({ className = '' }: { className?: string }) => (
  <img className={`flow-stripe ${className}`} src="/ImageRef/bottom-strip.png" alt="" aria-hidden="true" />
);

function getFirstName(fullName: string): string {
  const trimmed = (fullName || '').trim();
  if (!trimmed) return 'Nicholas';
  return trimmed.split(/\s+/)[0] || 'Nicholas';
}

function PrimaryButton({
  children,
  onClick,
  type = 'button',
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  className?: string;
}) {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    playButtonSound();
    if (onClick) onClick();
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onTouchCancel={() => setIsPressed(false)}
      className={`flow-primary-button ${isPressed ? 'pressed' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

function VirtualKeyboard({ mode, onKey, onModeChange, onNext }: {
  mode: KeyboardMode;
  onKey: (key: string) => void;
  onModeChange: (mode: KeyboardMode) => void;
  onNext: () => void;
}) {
  const [isShift, setIsShift] = useState(false);

  const letterRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'backspace'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.'],
  ];
  const numberRows = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'backspace'],
    ['@', '.', '_', '-', '/', ':', ';', '(', ')', '&', '#'],
    ['#+=', "'", '"', ',', '?', '!', 'clear'],
  ];
  const rows = mode === 'letters' ? letterRows : numberRows;

  const keyClass = (key: string) => {
    if (key === 'shift' || key === 'clear' || key === '#+=' || key === 'backspace') return ' keyboard-control';
    return '';
  };

  const renderKeyContent = (key: string) => {
    if (key === 'backspace') {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="keyboard-icon-backspace">
          <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
          <line x1="18" y1="9" x2="12" y2="15" />
          <line x1="12" y1="9" x2="18" y2="15" />
        </svg>
      );
    }
    if (key === 'shift') {
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="keyboard-icon-shift">
          <path d="M12 3l-7 8h4.5v10h5V11H19z" />
        </svg>
      );
    }
    if (key === 'clear') return 'Clear';
    if (mode === 'letters' && key.length === 1 && key !== ',' && key !== '.') {
      return isShift ? key.toLowerCase() : key.toUpperCase();
    }
    return key;
  };

  const handleKeyClick = (key: string) => {
    if (key === 'shift') {
      setIsShift((prev) => !prev);
      return;
    }
    if (mode === 'letters' && key.length === 1 && key !== ',' && key !== '.') {
      onKey(isShift ? key.toLowerCase() : key.toUpperCase());
    } else {
      onKey(key);
    }
  };

  return (
    <aside className={`virtual-keyboard keyboard-mode-${mode}`} aria-label="Keyboard virtual">
      <div className="keyboard-rows">
        {rows.map((row, rowIndex) => (
          <div className={`keyboard-row row-${rowIndex + 1}`} key={rowIndex}>
            {row.map((key) => (
              <button
                type="button"
                key={key}
                className={`keyboard-key${keyClass(key)}${key === 'shift' && isShift ? ' keyboard-key-active' : ''}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleKeyClick(key)}
              >
                {renderKeyContent(key)}
              </button>
            ))}
          </div>
        ))}
        <div className="keyboard-row keyboard-bottom">
          <button type="button" className="keyboard-key keyboard-control keyboard-mode" onMouseDown={(event) => event.preventDefault()} onClick={() => onModeChange(mode === 'letters' ? 'numbers' : 'letters')}>{mode === 'letters' ? '123' : 'ABC'}</button>
          <button type="button" className="keyboard-key keyboard-control keyboard-space" onMouseDown={(event) => event.preventDefault()} onClick={() => onKey(' ')}>Spasi</button>
          <button type="button" className="keyboard-key keyboard-control" onMouseDown={(event) => event.preventDefault()} onClick={() => onKey('@')}>@</button>
          <button type="button" className="keyboard-key keyboard-control" onMouseDown={(event) => event.preventDefault()} onClick={() => onKey('.')}>.</button>
          <button type="button" className="keyboard-key keyboard-next" onMouseDown={(event) => event.preventDefault()} onClick={onNext}>Lanjut →</button>
        </div>
      </div>
      <p>Sentuh {mode === 'letters' ? '123 untuk angka & simbol' : 'ABC untuk huruf'}</p>
    </aside>
  );
}

export default function QuizEngine({ initialQuizSlug = 'eggspresi-cinta' }: QuizEngineProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flowState, setFlowState] = useState<'intro' | 'form' | 'ready' | 'quiz' | 'loading' | 'result'>('intro');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [shakingFields, setShakingFields] = useState<Record<string, boolean>>({});
  const [sessionId, setSessionId] = useState('');
  const [sessionToken, setSessionToken] = useState('');

  const triggerShake = (fields: string[]) => {
    const newShake: Record<string, boolean> = {};
    fields.forEach((f) => { newShake[f] = true; });
    setShakingFields(newShake);
    setTimeout(() => {
      setShakingFields({});
    }, 600);
  };
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [result, setResult] = useState<ResultOption | null>(null);
  const [queueNumber, setQueueNumber] = useState<number | null>(null);
  const [isPrinted, setIsPrinted] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);
  const [printSuccess, setPrintSuccess] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [origin, setOrigin] = useState('');
  const [activeField, setActiveField] = useState<FormField | null>(null);
  const [keyboardMode, setKeyboardMode] = useState<KeyboardMode>('letters');
  const [cardsConfig, setCardsConfig] = useState<{
    onlineBaseUrl?: string;
    cards?: Record<string, { customQrUrl?: string }>;
  } | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
    setupAudioAutoUnlock();
  }, []);

  useEffect(() => {
    if (flowState === 'result') {
      playResultSound();
    }
  }, [flowState]);

  useEffect(() => {
    fetch('/api/quizzes/active').then(async (response) => {
      if (!response.ok) throw new Error('Gagal memuat kuis.');
      return response.json();
    }).then(setQuiz).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false));

    fetch('/api/config/cards')
      .then((res) => (res.ok ? res.json() : null))
      .then((cfg) => { if (cfg) setCardsConfig(cfg); })
      .catch(() => {});
  }, [initialQuizSlug]);

  const currentQuestion = quiz?.questions[questionIndex];
  const cardInfo = result ? (getCardByIdOrSlug(result.code) || getCardByIdOrSlug(result.title)) : null;
  const cardSlug = cardInfo ? cardInfo.slug : 'acts-of-service';

  // Perhitungan URL QR: Cek apakah ada custom QR URL untuk kartu ini dari konfigurasi lokal
  const customPerCardUrl = cardsConfig?.cards?.[cardSlug]?.customQrUrl;
  const onlineBase = cardsConfig?.onlineBaseUrl || process.env.NEXT_PUBLIC_ONLINE_URL || origin;
  const shareUrl = result
    ? (customPerCardUrl && customPerCardUrl.trim() !== ''
        ? customPerCardUrl.trim()
        : `${onlineBase}/result/${cardSlug}${sessionToken ? `?session=${sessionToken}` : ''}`)
    : (sessionToken ? `${onlineBase}/result/${sessionToken}` : onlineBase);
  function openKeyboard(field: FormField) {
    setActiveField(field);
    setKeyboardMode(field === 'phone' ? 'numbers' : 'letters');
  }
  function appendKeyboardKey(key: string) {
    if (!activeField) return;
    const currentValue = activeField === 'name' ? name : activeField === 'phone' ? phone : email;
    const nextValue = key === 'backspace' ? currentValue.slice(0, -1) : key === 'clear' ? '' : currentValue + key;
    if (activeField === 'name') setName(nextValue);
    if (activeField === 'phone') setPhone(nextValue.replace(/[^\d+]/g, ''));
    if (activeField === 'email') setEmail(nextValue);
  }
  function advanceKeyboard() {
    if (activeField === 'name') return openKeyboard('phone');
    if (activeField === 'phone') return openKeyboard('email');
    setActiveField(null);
  }
  async function submitForm(event: React.FormEvent) {
    event.preventDefault();
    const invalidFields: string[] = [];
    if (!name.trim()) invalidFields.push('name');
    const cleanPhone = phone.replace(/[\s\-+]/g, '');
    if (!phone.trim() || !/^\d{8,16}$/.test(cleanPhone)) invalidFields.push('phone');
    if (!consent) invalidFields.push('consent');

    if (invalidFields.length > 0) {
      triggerShake(invalidFields);
      if (invalidFields.includes('name') && !activeField) {
        openKeyboard('name');
      } else if (invalidFields.includes('phone') && !activeField) {
        openKeyboard('phone');
      }
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
        triggerShake(['name', 'phone']);
        return;
      }
      const data = await response.json();
      setSessionId(data.sessionId);
      setSessionToken(data.token);
      setActiveField(null);
      setFlowState('ready');
    } catch {
      triggerShake(['name', 'phone']);
    }
  }
  function beginQuiz() { setQuestionIndex(0); setAnswers({}); setSelectedLetter(null); setFlowState('quiz'); }
  function selectAnswer(questionId: string, answerId: string, letter: string) {
    if (selectedLetter) return;
    playButtonSound();
    const nextAnswers = { ...answers, [questionId]: answerId }; setAnswers(nextAnswers); setSelectedLetter(letter);
    window.setTimeout(() => {
      setSelectedLetter(null);
      if (quiz && questionIndex < quiz.questions.length - 1) setQuestionIndex((index) => index + 1);
      else void submitQuiz(nextAnswers);
    }, 520);
  }
  async function submitQuiz(finalAnswers: Record<string, string>) {
    setFlowState('loading');
    const minimumLoading = new Promise((resolve) => window.setTimeout(resolve, 2200));
    try {
      const request = fetch('/api/sessions/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          answerIds: Object.values(finalAnswers),
          name,
          phone,
          email,
          consent,
          newsletter,
        }),
      }).then((response) => response.json());
      const [, data] = await Promise.all([minimumLoading, request]);
      if (!data?.result) throw new Error('Gagal memproses hasil.');
      setResult(data.result);
      if (data.queueNumber) setQueueNumber(data.queueNumber);
      if (typeof data.isPrinted === 'boolean') setIsPrinted(data.isPrinted);
      setSessionToken(data.token || sessionToken);
      setFlowState('result');
    } catch {
      setResult({ id: 'fallback', code: 'ACTS_OF_SERVICE', title: 'Acts of Service', subTitle: 'Menemukan Omelet Hangat yang Lembut Sudah Tersaji Rapi di Meja', description: 'Kehadiran omelet hangat adalah bukti cinta yang nyata.', image: '/ImageRef/Cardresult/PNG/CARD-01.png', backgroundColor: '#FF0000', ctaText: 'Cetak Struk', ctaUrl: null }); setFlowState('result');
    }
  }

  async function handlePrintReceipt() {
    playButtonSound();
    if (isPrinted) {
      setShowReceipt(true);
      return;
    }
    if (isPrinting) return;

    setIsPrinting(true);
    setPrintError(null);

    try {
      const response = await fetch('/api/sessions/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          token: sessionToken,
          name,
          resultTitle: result?.title,
          queueNumber,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal mencetak struk.');
      }
      setIsPrinted(true);
      if (data.queueNumber) setQueueNumber(data.queueNumber);
      setPrintSuccess(true);
      setShowReceipt(true);
    } catch (reason: any) {
      setPrintError(reason?.message || 'Gagal mencetak ke printer Blueprint BP-Q58D.');
    } finally {
      setIsPrinting(false);
    }
  }

  function reset() {
    setFlowState('intro');
    setName('');
    setPhone('');
    setEmail('');
    setConsent(false);
    setNewsletter(false);
    setAnswers({});
    setQuestionIndex(0);
    setSelectedLetter(null);
    setResult(null);
    setQueueNumber(null);
    setIsPrinted(false);
    setIsPrinting(false);
    setPrintError(null);
    setPrintSuccess(false);
    setShowReceipt(false);
    setActiveField(null);
    setShakingFields({});
  }

  function handleReset() {
    playButtonSound();
    reset();
  }

  if (loading || error || !quiz) return <main className="flow-shell flow-status"><Stripe /><div className="flow-status-message">{loading ? 'Memuat pengalaman…' : error || 'Pengalaman belum tersedia.'}</div><Stripe /></main>;
  return <main className="flow-shell"><Stripe className={flowState === 'result' ? 'invisible' : ''} /><section className="flow-content">
    {flowState === 'intro' && <div className="flow-view intro-view">
      <img className="intro-lockup" src="/ImageRef/brand-lockup.png" alt="Royco — Ada apa dengan Cinta?" /><img className="intro-omelette" src="/ImageRef/Teluromelete.png" alt="Omelet cinta" />
      <p className="flow-eyebrow intro-eyebrow">EGGSPRESI CINTA · ROYCO X AADC</p><h1 className="intro-title">Find Your<br />Love<br />Language</h1><p className="intro-copy">Cara kamu masak diam-diam<br />nyimpen cara kamu mencintai.<br />Yuk cari tahu!</p><div className="intro-cta"><PrimaryButton onClick={() => setFlowState('form')}><span>Mulai</span> <img src="/ImageRef/label-arrow.png" alt="" className="btn-arrow-icon-sm" /></PrimaryButton></div>
    </div>}
    {flowState === 'form' && <div className="flow-view form-view">
      <div className="form-brand-crop"><img src="/ImageRef/brand-lockup.png" alt="Royco" /></div><p className="flow-eyebrow form-eyebrow">A ROYCO X AADC EXPERIENCE</p><h1 className="form-title">Kenalan dulu yuk</h1><p className="form-copy">Isi data kamu buat nerima kartu<br />cinta versi digital.</p>
      <form onSubmit={submitForm} className="lead-form">
        <label className={shakingFields.name ? 'field-shake' : ''}>Nama<input value={name} readOnly inputMode="none" onFocus={() => openKeyboard('name')} onClick={() => openKeyboard('name')} placeholder="Nama kamu" /></label>
        <label className={shakingFields.phone ? 'field-shake' : ''}>Nomor WhatsApp<input value={phone} readOnly inputMode="none" onFocus={() => openKeyboard('phone')} onClick={() => openKeyboard('phone')} placeholder="08xxxxxxxxxx" /></label>
        <label>Email<input value={email} readOnly inputMode="none" onFocus={() => openKeyboard('email')} onClick={() => openKeyboard('email')} type="email" placeholder="email@kamu.com" /></label>
        <button type="button" className={`consent-row ${shakingFields.consent ? 'field-shake' : ''}`} onClick={() => setConsent(!consent)}><span className={'fake-checkbox ' + (consent ? 'checked' : '')}>{consent && <Check />}</span><span>Aku setuju data ku dipakai Royco x AADC dan dihubungi terkait event ini.</span></button>
        <button type="button" className="consent-row optional" onClick={() => setNewsletter(!newsletter)}><span className={'fake-checkbox ' + (newsletter ? 'checked' : '')}>{newsletter && <Check />}</span><span>Boleh kirim promo &amp; update dari Royco. <i>(opsional)</i></span></button>
        <div className="form-cta"><PrimaryButton type="submit" className="btn-lanjut"><span>Lanjut</span> <img src="/ImageRef/label-arrow.png" alt="" className="btn-arrow-icon-sm" /></PrimaryButton></div>
      </form>
      {activeField && <VirtualKeyboard mode={keyboardMode} onKey={appendKeyboardKey} onModeChange={setKeyboardMode} onNext={advanceKeyboard} />}
    </div>}
    {flowState === 'ready' && <div className="flow-view ready-view"><img className="ready-omelette" src="/ImageRef/Teluromelete.png" alt="Omelet cinta" /><p className="flow-eyebrow ready-eyebrow">KAMU SIAP!</p><h1 className="ready-title">Halo, {getFirstName(name)}!</h1><p className="ready-copy">5 pertanyaan singkat buat<br />nemuin love language kamu.<br />Jawab jujur ya!</p><div className="ready-cta"><PrimaryButton onClick={beginQuiz} className="btn-mulai-tes"><span>Mulai Tes</span> <img src="/ImageRef/label-arrow.png" alt="" className="btn-arrow-icon" /></PrimaryButton></div></div>}
    {flowState === 'quiz' && currentQuestion && <div className="flow-view quiz-view"><div className="quiz-progress" aria-label={'Pertanyaan ' + (questionIndex + 1) + ' dari ' + quiz.questions.length}>{letters.map((_, index) => <span key={index} className={index < questionIndex ? 'complete' : index === questionIndex ? 'active' : ''} />)}</div><p className="flow-eyebrow quiz-eyebrow">PERTANYAAN {questionIndex + 1} DARI {quiz.questions.length}</p><h1 className="quiz-question">{currentQuestion.text}</h1><div className="quiz-options">{currentQuestion.answers.map((answer, index) => { const letter = letters[index]; return <button key={answer.id} onClick={() => selectAnswer(currentQuestion.id, answer.id, letter)} className={'quiz-option ' + (selectedLetter === letter ? 'selected' : '')}><span className="quiz-letter">{letter}</span><span>{answer.text}</span></button>; })}</div></div>}
    {flowState === 'loading' && <div className="flow-view loading-view"><div className="loading-pan"><PanciSequencePlayer /></div><h1>Meracik kartu<br />cintamu ..</h1></div>}
    {flowState === 'result' && result && <div className="flow-view result-view"><p className="flow-eyebrow result-eyebrow">HASIL LOVE LANGUAGE KAMU</p><img className="result-card-image" src={result.image} alt={result.title} />
      <div className="result-actions">
        <button
          className={`receipt-action ${isPrinted ? 'receipt-printed' : ''} ${isPrinting ? 'receipt-printing' : ''}`}
          onClick={handlePrintReceipt}
          disabled={isPrinting}
        >
          <span>
            {isPrinted ? (
              <Check className="receipt-status-icon check" />
            ) : isPrinting ? (
              <div className="receipt-spinner" />
            ) : (
              <img src="/ImageRef/emotprint.png" alt="" />
            )}
          </span>
          <strong>
            {isPrinted ? 'Struk Sudah Dicetak' : isPrinting ? 'Sedang Mencetak...' : 'Cetak Struk'}
            <small>
              {isPrinted
                ? `Nomor Antrian #${String(queueNumber || 1).padStart(3, '0')} (1x cetak per sesi)`
                : isPrinting
                ? 'Mencetak ke Blueprint BP-Q58D...'
                : 'Tukar struk buat dapetin omelette-mu'}
            </small>
          </strong>
        </button>

        {printError && (
          <div className="receipt-error-banner">
            {printError}
          </div>
        )}

        <div className="share-action">
          <div className="qr-wrap">
            <QRCodeSVG value={shareUrl || 'https://royco.example'} level="M" includeMargin={false} />
          </div>
          <strong>
            Simpan &amp; share kartumu
            <small>Scan QR pakai HP kamu buat download kartu &amp; bagikan ke sosmed.</small>
          </strong>
        </div>
      </div>
      <button className="finish-action" onClick={handleReset}><RotateCcw /> Selesai</button>
    </div>}
  </section><Stripe />
  {showReceipt && result && (
    <div className="receipt-overlay" role="dialog" aria-modal="true">
      <div className="receipt-modal thermal-slip-modal">
        <button className="close-receipt" onClick={() => { playButtonSound(); setShowReceipt(false); }} aria-label="Tutup"><X /></button>
        <div className="receipt-popup-header">
          <span className="receipt-popup-icon">🍳</span>
          <h3 className="receipt-popup-title">Struk Berhasil Dicetak!</h3>
        </div>
        <div className="slip-status-badge">
          <Printer />
          <span>Tercetak di Blueprint BP-Q58D</span>
        </div>
        <div className="thermal-slip-paper" id="printable-receipt">
          <div className="slip-name">{(name || 'PESERTA').trim().toUpperCase()}</div>
          <div className="slip-result">{`[${((result.title || 'ACT OF SERVICE').toUpperCase() === 'ACTS OF SERVICE' ? 'ACT OF SERVICE' : result.title).toUpperCase()}]`}</div>
          <div className="slip-queue">{String(queueNumber || 1).padStart(3, '0')}</div>
          <div className="slip-time">{`[${String(new Date().getHours()).padStart(2, '0')}.${String(new Date().getMinutes()).padStart(2, '0')}]`}</div>
        </div>
        <p className="receipt-note">Tukarkan struk ini di booth Royco untuk 1 omelette spesial.</p>
        <button onClick={() => { playButtonSound(); setShowReceipt(false); }}>Selesai</button>
      </div>
    </div>
  )}
  </main>;
}
