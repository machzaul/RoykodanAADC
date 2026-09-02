'use client';

import React, { useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { Heart, Loader2 } from 'lucide-react';
import QRCodeGen from './QRCodeGen';
import { ResultPayload } from './ResultCard';

interface ImageGeneratorProps {
  result: ResultPayload;
  shareUrl: string;
  participantName?: string;
  token: string;
}

export default function ImageGenerator({
  result,
  shareUrl,
  participantName,
  token,
}: ImageGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'generating' | 'sharing' | 'copied'>('idle');
  const templateRef = useRef<HTMLDivElement>(null);

  const cardBg = result.backgroundColor || '#E53E3E';

  // Helper to log analytics events
  const logShareEvent = async (eventType: string) => {
    try {
      await fetch('/api/analytics/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, eventType }),
      });
    } catch (e) {
      console.error('Failed to log event:', e);
    }
  };

  const handleShareOrDownload = async () => {
    if (!templateRef.current || isGenerating) return;

    setIsGenerating(true);
    setShareStatus('generating');

    try {
      // 1. Convert the hidden template node (1080x1920px) to a PNG base64 Data URL
      // We set a brief timeout to ensure fonts and QR code SVGs are fully painted
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      const dataUrl = await htmlToImage.toPng(templateRef.current, {
        width: 1080,
        height: 1920,
        quality: 1.0,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        },
      });

      // 2. Convert base64 dataUrl to a blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `love_recipe_${token}.png`, { type: 'image/png' });

      // 3. Log download/generation activity
      await logShareEvent('DOWNLOAD');

      // 4. Try Web Share API (File Sharing for mobile sharing directly to Instagram / WhatsApp)
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        setShareStatus('sharing');
        await navigator.share({
          files: [file],
          title: 'Eggspresi Cinta - My Love Recipe',
          text: `I got "${result.title}" as my Love Recipe! Find yours!`,
        });
        await logShareEvent('SHARE_NATIVE');
        setShareStatus('idle');
      } else {
        // Fallback for Desktop/unsupported browsers:
        // A. Trigger standard browser download
        const link = document.createElement('a');
        link.download = `love_recipe_${result.title.toLowerCase().replace(/\s+/g, '_')}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // B. Copy unique sharing URL to clipboard
        await navigator.clipboard.writeText(shareUrl);
        await logShareEvent('SHARE_IG');
        setShareStatus('copied');
        
        // Reset status message after a few seconds
        setTimeout(() => setShareStatus('idle'), 4000);
      }
    } catch (error) {
      console.error('Failed to share/download image:', error);
      // Fallback fallback: copy link
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareStatus('copied');
        setTimeout(() => setShareStatus('idle'), 4000);
      } catch (clipErr) {
        console.error('Clipboard write failed:', clipErr);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full">
      {/* Trigger Button */}
      <button
        onClick={handleShareOrDownload}
        disabled={isGenerating}
        className="w-full bg-transparent hover:bg-white/10 text-white font-bold text-sm py-3 px-4 rounded-xl border-2 border-white flex items-center justify-center gap-2 active:scale-95 transition-transform uppercase tracking-wider cursor-pointer"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Generating Recipe Card...</span>
          </>
        ) : (
          <span>SHARE TO IG</span>
        )}
      </button>

      {/* Share / Copy feedback message */}
      {shareStatus === 'copied' && (
        <p className="text-center text-[10px] text-white/90 mt-2 bg-black/40 px-2 py-1.5 rounded-lg animate-fade-in">
          🎉 Recipe Card downloaded & link copied to clipboard! You can now share it directly on your Instagram Story.
        </p>
      )}

      {/* 
        HIDDEN HIGH-RESOLUTION RENDER TEMPLATE (1080 x 1920 px)
        It is rendered outside the visible viewport using negative positions.
        This element is compiled with high quality and screenshotted to form the PNG card.
      */}
      <div className="absolute overflow-hidden pointer-events-none" style={{ left: '-9999px', top: '-9999px', width: '1080px', height: '1920px' }}>
        <div
          ref={templateRef}
          className="w-[1080px] h-[1920px] flex flex-col justify-between p-16 text-white relative font-sans"
          style={{ backgroundColor: cardBg }}
        >
          {/* Side Border Stripes */}
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-b from-green-500 via-yellow-400 to-blue-400 z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-b from-green-500 via-yellow-400 to-blue-400 z-10" />

          {/* Top Logo Section */}
          <div className="w-full flex items-center justify-between mt-10 px-8 z-0">
            <Heart className="w-16 h-16 fill-white text-white" />
            <div className="flex flex-col items-center">
              <span className="text-xl tracking-[0.25em] font-medium uppercase text-white/80">royco x aadc</span>
              <span className="text-3xl tracking-[0.1em] font-extrabold uppercase mt-1">EGGSPRESI CINTA</span>
            </div>
            <Heart className="w-16 h-16 fill-white text-white" />
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col items-center justify-center px-12 z-0">
            
            {participantName && (
              <span className="text-xl bg-white/20 px-8 py-2 rounded-full uppercase tracking-widest font-semibold mb-12">
                Recipe for {participantName}
              </span>
            )}

            <span className="text-xl bg-white/25 px-10 py-3 rounded-full uppercase font-black tracking-widest text-white shadow-md">
              YOUR LOVE RECIPE
            </span>

            {result.subTitle && (
              <h3 className="text-yellow-300 text-2xl font-bold uppercase tracking-[0.15em] mt-12 text-center">
                {result.subTitle}
              </h3>
            )}
            
            <h2 className="text-6xl font-black uppercase tracking-wide mt-4 text-center leading-none drop-shadow-lg">
              {result.title}
            </h2>

            {/* Divider */}
            <div className="w-32 h-[4px] bg-white/50 my-12" />

            {/* Image Illustration */}
            <div className="my-6 relative w-72 h-72 flex items-center justify-center bg-white/10 rounded-full border-2 border-white/20 shadow-inner">
              {result.image ? (
                <img
                  src={result.image}
                  alt={result.title}
                  className="w-56 h-56 object-contain drop-shadow-2xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>';
                  }}
                />
              ) : (
                <div className="text-[120px]">🍳</div>
              )}
            </div>

            {/* Description */}
            <p className="text-center text-xl leading-relaxed px-10 mt-10 opacity-90 max-w-[700px] font-medium">
              {result.description}
            </p>
          </div>

          {/* Footer Scan section */}
          <div className="w-full flex flex-col items-center justify-center mb-10 z-0">
            <QRCodeGen value={shareUrl} size={200} />
            <span className="text-[14px] opacity-75 uppercase tracking-[0.25em] mt-5 font-bold">
              SCAN TO FIND YOUR LOVE RECIPE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
