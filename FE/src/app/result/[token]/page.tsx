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

  const handleDownload = async () => {
    if (!card?.image) return;
    try {
      setDownloading(true);
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
    } catch (err) {
      // Fallback: open image in new window/tab for user to save
      window.open(card.image, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = `Hasil Love Language: ${card?.title || 'Love Language'} - Royco x AADC`;
    const shareText = `Love language masakan aku adalah "${card?.title}"! Yuk cari tahu bahasa cintamu di kuis Royco x AADC ❤️`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // Ignored if user dismissed share sheet
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      } catch (err) {
        // Fallback prompt
        window.prompt('Salin tautan ini untuk dibagikan:', shareUrl);
      }
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
    <main className="w-full min-h-[100dvh] bg-[#E50012] text-white flex flex-col justify-between selection:bg-[#FFC700] selection:text-[#151515]">
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
            className="w-full bg-[#FFC700] hover:bg-[#FFD12E] active:scale-[0.98] text-[#151515] font-black text-[16px] py-3.5 px-6 rounded-full flex items-center justify-center gap-2.5 shadow-lg cursor-pointer transition-all uppercase tracking-wide disabled:opacity-80"
          >
            <Download className="w-5 h-5 stroke-[2.8]" />
            <span>{downloading ? 'Mengunduh...' : 'Download Hasil Kartu'}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="w-full bg-white hover:bg-neutral-100 active:scale-[0.98] text-[#E50012] font-black text-[16px] py-3.5 px-6 rounded-full flex items-center justify-center gap-2.5 shadow-lg cursor-pointer transition-all uppercase tracking-wide"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5 text-green-600 stroke-[3]" />
                <span className="text-green-700">Link Tersalin!</span>
              </>
            ) : (
              <>
                <Share2 className="w-5 h-5 stroke-[2.8]" />
                <span>Bagikan Ke Orang Tersayang</span>
              </>
            )}
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
    </main>
  );
}
