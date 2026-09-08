'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Download, Share2, Check, Loader2 } from 'lucide-react';
import { DefinedCard, getCardByIdOrSlug, DEFINED_CARDS } from '@/lib/cards';

const ColorStripeBar = () => (
  <div className="w-full h-2 flex shrink-0 overflow-hidden z-20">
    <div className="flex-1 bg-[#00A3E0]" />
    <div className="flex-1 bg-[#00A651]" />
    <div className="flex-1 bg-[#38B6FF]" />
    <div className="flex-1 bg-[#FFC700]" />
    <div className="flex-1 bg-[#009E49]" />
  </div>
);

export default function ResultSharingPage() {
  const params = useParams();
  const router = useRouter();
  const identifier = (params?.token as string) || '';

  const [card, setCard] = useState<DefinedCard | null>(() => {
    return getCardByIdOrSlug(identifier);
  });
  const [loading, setLoading] = useState<boolean>(() => {
    return !getCardByIdOrSlug(identifier);
  });
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If identifier wasn't a static card slug/number, attempt to fetch via session token
  useEffect(() => {
    const staticCard = getCardByIdOrSlug(identifier);
    if (staticCard) {
      setCard(staticCard);
      setLoading(false);
      return;
    }

    if (!identifier) {
      // Default to Acts of Service if no identifier provided
      setCard(DEFINED_CARDS['1']);
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function fetchSession() {
      try {
        setLoading(true);
        const res = await fetch(`/api/sessions/result/${identifier}`);
        if (!res.ok) {
          throw new Error('Hasil kartu cinta tidak ditemukan.');
        }
        const data = await res.json();
        if (data?.result) {
          const matched =
            getCardByIdOrSlug(data.result.code) ||
            getCardByIdOrSlug(data.result.title) || {
              id: 1,
              slug: 'acts-of-service',
              code: data.result.code || 'ACTS_OF_SERVICE',
              title: data.result.title || 'Acts of Service',
              subTitle: data.result.subTitle || '',
              description: data.result.description || '',
              image: data.result.image || '/ImageRef/Cardresult/PNG/CARD-01.png',
            };
          if (isMounted) setCard(matched);
        } else {
          throw new Error('Data kartu kosong.');
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Gagal memuat kartu');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchSession();

    return () => {
      isMounted = false;
    };
  }, [identifier]);

  // Log scan event for analytics
  useEffect(() => {
    if (identifier) {
      fetch('/api/analytics/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: identifier, eventType: 'QR_SCAN' }),
      }).catch(() => {});
    }
  }, [identifier]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string, duration = 2500) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((current) => (current === msg ? null : current));
    }, duration);
  };

  const handleDownload = async () => {
    if (!card?.image) return;
    try {
      setDownloading(true);
      showToast('Sedang mengunduh hasil kartu...', 2000);
      const response = await fetch(card.image);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Royko-Love-Language-${card.title.replace(/\s+/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      showToast('✓ Kartu berhasil disimpan ke galeri!');
    } catch (err) {
      window.open(card.image, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  const shareWhatsApp = () => {
    if (!card) return;
    const pageUrl = window.location.href;
    const shareText = `Love language masakan aku adalah *${card.title}*! ❤️ Yuk cari tahu bahasa cintamu di kuis Royco x AADC:\n\n${pageUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const shareInstagram = async () => {
    if (!card) return;
    showToast('Menyiapkan gambar kartu...', 2000);
    try {
      const res = await fetch(card.image);
      const blob = await res.blob();
      const file = new File([blob], `Royko-LoveLanguage-${card.slug}.png`, { type: 'image/png' });

      // Auto download image to gallery
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `Royko-LoveLanguage-${card.slug}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);

      // If mobile browser supports native file sharing (e.g. Safari / Chrome to IG Stories)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `Love Language: ${card.title}`,
            text: `Love language masakan aku adalah ${card.title}! ❤️`,
          });
          return;
        } catch (err: any) {
          if (err?.name === 'AbortError') return;
        }
      }
    } catch (e) {
      console.warn('IG share error:', e);
    }

    showToast('✓ Kartu disimpan! Membuka Instagram...', 3000);
    setTimeout(() => {
      window.location.href = 'instagram://camera';
      setTimeout(() => {
        window.open('https://www.instagram.com', '_blank');
      }, 1500);
    }, 700);
  };

  const shareTelegram = () => {
    if (!card) return;
    const pageUrl = window.location.href;
    const shareText = `Love language masakan aku adalah ${card.title}! ❤️ Yuk cari tahu bahasa cintamu di Royco x AADC:`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const shareFacebook = () => {
    const pageUrl = window.location.href;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`, '_blank');
  };

  const shareTwitter = () => {
    if (!card) return;
    const pageUrl = window.location.href;
    const shareText = `Love language masakan aku adalah ${card.title}! ❤️ Yuk cari tahu bahasa cintamu di Royco x AADC:`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}`, '_blank');
  };

  const copyLink = async () => {
    const pageUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      showToast('✓ Tautan berhasil disalin!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt('Salin link untuk berbagi:', pageUrl);
    }
  };

  const shareNativeDevice = async () => {
    if (!card) return;
    const pageUrl = window.location.href;
    const shareTitle = `Love Language: ${card.title} - Royco x AADC`;
    const shareText = `Love language masakan aku adalah ${card.title}! ❤️ Yuk cari tahu bahasa cintamu di Royco x AADC:`;

    if (navigator.share) {
      try {
        const res = await fetch(card.image);
        const blob = await res.blob();
        const file = new File([blob], `Royko-LoveLanguage-${card.slug}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: shareTitle,
            text: `${shareText}\n${pageUrl}`,
          });
          return;
        }
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: pageUrl,
        });
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          showToast('Tidak dapat membuka menu bagikan');
        }
      }
    } else {
      showToast('Menu share HP aktif pada koneksi HTTPS');
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-[100dvh] bg-[#E50012] flex flex-col items-center justify-center text-white p-6">
        <Loader2 className="w-12 h-12 animate-spin text-[#FFC700]" />
        <span className="mt-4 text-base font-black tracking-wider uppercase text-white">
          Memuat Kartu Cinta...
        </span>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="w-full min-h-[100dvh] bg-[#E50012] flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="text-5xl mb-4">🍳</div>
        <h2 className="text-2xl font-black uppercase text-white">Kartu Tidak Ditemukan</h2>
        <p className="text-sm text-white/90 mt-2 max-w-xs">{error || 'Link ini tidak valid.'}</p>
        <button
          onClick={() => router.push('/')}
          className="mt-6 bg-[#FFC700] text-[#151515] font-black px-6 py-3 rounded-full text-sm uppercase cursor-pointer shadow-lg"
        >
          Ikuti Kuis Sekarang
        </button>
      </div>
    );
  }

  return (
    <main className="w-full min-h-[100dvh] bg-[#E50012] text-white flex flex-col justify-between selection:bg-[#FFC700] selection:text-[#151515] relative">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#111827] text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-[13px] font-extrabold animate-bounce">
          <span className="text-emerald-400">✓</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Accent Strip */}
      <ColorStripeBar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 w-full max-w-[430px] mx-auto text-center">
        {/* Header Titles matching reference */}
        <h1 className="text-[28px] sm:text-[32px] font-black tracking-tight text-white flex items-center justify-center gap-2 drop-shadow-sm leading-tight">
          Love Language Kamu <span className="text-[26px]">💕</span>
        </h1>
        <p className="text-[14px] sm:text-[15px] font-semibold text-white/95 mt-2 leading-snug px-2">
          Yuk simpan hasilnya dan bagikan ke orang tersayang!
        </p>

        {/* High-Resolution Love Language Card */}
        <div className="w-full mt-5 rounded-[22px] overflow-hidden shadow-2xl border border-white/20 bg-[#E50012]">
          <img
            src={card.image}
            alt={card.title}
            className="w-full h-auto block select-none pointer-events-none"
            draggable={false}
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-5 w-full flex flex-col gap-3">
          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full h-[48px] bg-[#FFC700] hover:bg-[#FFD12E] active:scale-[0.98] text-[#151515] font-extrabold text-[15px] px-6 rounded-full flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-80"
          >
            <Download className="w-[18px] h-[18px] stroke-[2.6]" />
            <span>{downloading ? 'Mengunduh...' : 'Download Hasil Kartu'}</span>
          </button>

          {/* Share Button (Opens Bottom Sheet Modal) */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="w-full h-[48px] bg-white hover:bg-neutral-100 active:scale-[0.98] text-[#E50012] font-extrabold text-[15px] px-6 rounded-full flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
          >
            <Share2 className="w-[18px] h-[18px] stroke-[2.6]" />
            <span>Bagikan Ke Orang Tersayang</span>
          </button>
        </div>

        {/* Footer Brand Copyright */}
        <footer className="mt-7 mb-2 text-center">
          <p className="text-[12.5px] font-black uppercase tracking-wider text-white flex items-center justify-center gap-1.5 opacity-95">
            ROYCO x AADC Experience <span className="text-white text-[12px]">❤</span>
          </p>
          <p className="text-[11px] font-medium text-white/75 mt-1">
            Copyright © 2026. All rights reserved.
          </p>
        </footer>
      </div>

      {/* Bottom Accent Strip */}
      <ColorStripeBar />

      {/* Social Share Bottom Sheet Modal */}
      {isShareModalOpen && (
        <div
          className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center transition-opacity"
          onClick={() => setIsShareModalOpen(false)}
        >
          <div
            className="w-full max-w-[440px] bg-white text-neutral-900 rounded-t-[26px] sm:rounded-[26px] p-5 pb-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-6 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <div className="w-10 h-1 bg-neutral-200 rounded-full mx-auto mb-3 sm:hidden" />

            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3.5">
              <div className="text-left">
                <h2 className="text-[18px] font-black text-neutral-900 leading-tight">
                  Bagikan Hasil Kartu 💕
                </h2>
                <p className="text-[12px] font-semibold text-neutral-500 mt-0.5">
                  Pilih media sosial untuk membagikan kartu cinta kamu
                </p>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 transition-colors cursor-pointer"
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>

            {/* Mini Card Preview */}
            <div className="flex items-center gap-3 p-2.5 bg-neutral-50 rounded-xl border border-neutral-100 mb-4 text-left">
              <img
                src={card.image}
                alt={card.title}
                className="w-12 h-12 rounded-lg object-cover shadow-sm shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-extrabold uppercase text-[#E50012] tracking-wider block">
                  Love Language
                </span>
                <h3 className="text-[14px] font-extrabold text-neutral-900 truncate">
                  {card.title}
                </h3>
                <p className="text-[11px] font-medium text-neutral-500 truncate">
                  {card.subTitle || 'Royco x AADC Experience'}
                </p>
              </div>
            </div>

            {/* Social Share Grid */}
            <div className="grid grid-cols-3 gap-y-3.5 gap-x-2 mb-4">
              {/* WhatsApp */}
              <button
                onClick={shareWhatsApp}
                className="flex flex-col items-center gap-1.5 p-1 rounded-xl hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer"
              >
                <div className="w-[52px] h-[52px] rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                </div>
                <span className="text-[11.5px] font-bold text-neutral-700">WhatsApp</span>
              </button>

              {/* Instagram */}
              <button
                onClick={shareInstagram}
                className="flex flex-col items-center gap-1.5 p-1 rounded-xl hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer"
              >
                <div className="w-[52px] h-[52px] rounded-full bg-gradient-to-tr from-[#fdf497] via-[#dc2743] to-[#285AEB] text-white flex items-center justify-center shadow-md">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-current fill-none stroke-2">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <span className="text-[11.5px] font-bold text-neutral-700">Instagram</span>
              </button>

              {/* Telegram */}
              <button
                onClick={shareTelegram}
                className="flex flex-col items-center gap-1.5 p-1 rounded-xl hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer"
              >
                <div className="w-[52px] h-[52px] rounded-full bg-[#0088cc] text-white flex items-center justify-center shadow-md">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.885-1.02 4.887-1.442 7.15-.178.957-.53 1.278-.87 1.309-.739.068-1.3-.488-2.016-.957-.864-.566-1.352-.919-2.19-1.471-.97-.638-.341-.989.212-1.564.145-.15 2.66-2.438 2.709-2.645.006-.026.011-.122-.047-.174-.058-.052-.144-.034-.207-.02-.088.02-1.498.954-4.228 2.798-.4.275-.762.41-1.086.403-.357-.008-1.044-.202-1.555-.368-.627-.204-1.125-.312-1.082-.659.022-.181.272-.367.75-.558 2.936-1.279 4.895-2.124 5.877-2.535 2.799-1.173 3.382-1.377 3.762-1.383.084-.001.27.02.391.119.102.083.13.195.144.274-.002.046.008.204-.002.324z"/>
                  </svg>
                </div>
                <span className="text-[11.5px] font-bold text-neutral-700">Telegram</span>
              </button>

              {/* Facebook */}
              <button
                onClick={shareFacebook}
                className="flex flex-col items-center gap-1.5 p-1 rounded-xl hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer"
              >
                <div className="w-[52px] h-[52px] rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-md">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <span className="text-[11.5px] font-bold text-neutral-700">Facebook</span>
              </button>

              {/* X / Twitter */}
              <button
                onClick={shareTwitter}
                className="flex flex-col items-center gap-1.5 p-1 rounded-xl hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer"
              >
                <div className="w-[52px] h-[52px] rounded-full bg-black text-white flex items-center justify-center shadow-md">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <span className="text-[11.5px] font-bold text-neutral-700">X / Twitter</span>
              </button>

              {/* Salin Tautan */}
              <button
                onClick={copyLink}
                className="flex flex-col items-center gap-1.5 p-1 rounded-xl hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer"
              >
                <div className="w-[52px] h-[52px] rounded-full bg-neutral-700 text-white flex items-center justify-center shadow-md">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-current fill-none stroke-[2.2]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                  </svg>
                </div>
                <span className="text-[11.5px] font-bold text-neutral-700">
                  {copied ? 'Tersalin! ✓' : 'Salin Link'}
                </span>
              </button>
            </div>

            {/* Copy URL Bar */}
            <div className="flex items-center bg-neutral-100 rounded-full pl-4 pr-1 py-1 border border-neutral-200 mb-3">
              <input
                type="text"
                readOnly
                value={typeof window !== 'undefined' ? window.location.href : ''}
                className="flex-1 bg-transparent text-[12px] text-neutral-600 outline-none truncate font-semibold"
              />
              <button
                onClick={copyLink}
                className="bg-[#E50012] hover:bg-[#CC0010] text-white text-[12px] font-extrabold px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
              >
                Salin
              </button>
            </div>

            {/* Native OS Share button */}
            <button
              onClick={shareNativeDevice}
              className="w-full h-10 border border-dashed border-neutral-300 rounded-full text-[13px] font-bold text-neutral-700 flex items-center justify-center gap-2 hover:bg-neutral-50 mb-2 cursor-pointer transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Bagikan Lewat Menu HP (Aplikasi Lainnya)</span>
            </button>

            {/* Close */}
            <button
              onClick={() => setIsShareModalOpen(false)}
              className="w-full h-10 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-full text-[13px] font-bold transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
