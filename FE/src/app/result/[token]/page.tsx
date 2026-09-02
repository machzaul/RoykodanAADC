'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Download, Share2, RotateCcw, Check } from 'lucide-react';

interface SessionResult {
  id: string;
  token: string;
  quizId: string;
  participant: {
    name: string;
  } | null;
  result: {
    title: string;
    subTitle: string | null;
    description: string;
    image: string;
    backgroundColor: string;
    ctaText: string;
    ctaUrl: string | null;
  };
}

const ColorStripeBar = () => (
  <div className="w-full h-2.5 flex shrink-0 overflow-hidden z-20">
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
  const token = params?.token as string;

  const [session, setSession] = useState<SessionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Log scan event
  useEffect(() => {
    if (token) {
      fetch('/api/analytics/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, eventType: 'QR_SCAN' }),
      }).catch((err) => console.error('Failed to log scan:', err));
    }
  }, [token]);

  // Fetch session result
  useEffect(() => {
    if (!token) return;

    async function fetchResult() {
      try {
        const res = await fetch('/api/sessions/result/' + token);
        if (!res.ok) {
          throw new Error('Hasil kartu cinta tidak ditemukan.');
        }
        const data = await res.json();
        setSession(data);
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat memuat kartu.');
      } finally {
        setLoading(false);
      }
    }

    fetchResult();
  }, [token]);

  const handleDownload = async () => {
    if (!session?.result.image) return;
    try {
      const response = await fetch(session.result.image);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'Royco-Love-Language-' + (session.result.title || 'Card') + '.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(session.result.image, '_blank');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Hasil Love Language Royco x AADC',
          text: 'Love Language-ku adalah ' + session?.result.title + '! Cari tahu love language masakanmu di Royco x AADC.',
          url: window.location.href,
        });
      } catch (e) {
        // Ignored if cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-[420px] min-h-[100dvh] sm:min-h-[820px] bg-[#E50012] flex flex-col items-center justify-center text-white p-6 rounded-none sm:rounded-[36px] shadow-2xl">
        <Loader2 className="w-12 h-12 animate-spin text-[#FFC700]" />
        <span className="mt-4 text-base font-black tracking-wider uppercase text-white">Memuat Kartu Cinta...</span>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="w-full max-w-[420px] min-h-[100dvh] sm:min-h-[820px] bg-[#E50012] flex flex-col items-center justify-center text-white p-6 rounded-none sm:rounded-[36px] shadow-2xl text-center">
        <div className="text-5xl mb-4">🍳</div>
        <h3 className="text-xl font-black uppercase text-white">Kartu Tidak Ditemukan</h3>
        <p className="text-xs text-white/90 mt-2 max-w-xs">{error || 'Link ini sudah tidak berlaku atau salah.'}</p>
        <button
          onClick={() => router.push('/')}
          className="mt-6 btn-royco-yellow font-black px-6 py-2.5 rounded-full text-sm uppercase cursor-pointer"
        >
          Mulai Kuis Baru
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-[430px] min-h-[100dvh] sm:min-h-[844px] bg-[#E50012] text-white flex flex-col justify-between overflow-hidden sm:rounded-[36px] shadow-2xl select-none font-sans">
      <ColorStripeBar />

      <div className="flex-1 flex flex-col justify-between px-5 py-3 text-center">
        <div>
          <span className="text-[#FFC700] text-[12px] sm:text-[13px] font-black tracking-widest uppercase block mt-1 mb-2">
            HASIL LOVE LANGUAGE KAMU
          </span>

          {/* Love Language Card */}
          <div className="w-full max-w-[320px] mx-auto rounded-[22px] overflow-hidden shadow-xl border-2 border-white/20 bg-[#E50012]">
            <img
              src={session.result.image}
              alt={session.result.title}
              className="w-full h-auto object-cover max-h-[380px] sm:max-h-[410px]"
            />
          </div>

          {/* Action Buttons */}
          <div className="mt-4 space-y-2.5 max-w-[320px] mx-auto">
            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="w-full btn-royco-yellow font-black text-[15.5px] py-3 px-6 rounded-full flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Simpan Gambar Kartu</span>
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="w-full bg-[#FFF5E5] hover:bg-[#FFEED2] text-[#E50012] font-black text-[15px] py-3 px-6 rounded-full flex items-center justify-center gap-2 shadow-md cursor-pointer transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600 stroke-[3]" />
                  <span className="text-green-700">Link Tersalin!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Bagikan ke Teman / Sosmed</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Start own quiz button */}
        <div className="pt-2 pb-1">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center justify-center gap-1.5 text-white font-black text-[13.5px] hover:text-[#FFC700] transition-colors cursor-pointer underline underline-offset-4"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Mau Ikut Kuis Ini Juga?</span>
          </button>
        </div>
      </div>

      <ColorStripeBar />
    </div>
  );
}
