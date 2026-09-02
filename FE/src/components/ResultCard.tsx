'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import QRCodeGen from './QRCodeGen';

export interface ResultPayload {
  title: string;
  subTitle: string | null;
  description: string;
  image: string;
  backgroundColor: string;
  ctaText: string;
  ctaUrl: string | null;
}

interface ResultCardProps {
  result: ResultPayload;
  shareUrl: string;
  participantName?: string;
  onCookClick?: () => void;
  onShareClick?: () => void;
  onResetClick?: () => void;
  isSharingDisabled?: boolean;
}

export default function ResultCard({
  result,
  shareUrl,
  participantName,
  onCookClick,
  onShareClick,
  onResetClick,
  isSharingDisabled = false,
}: ResultCardProps) {
  // Use background color from db or default to red
  const cardBg = result.backgroundColor || '#E53E3E';

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col justify-between h-full min-h-[85vh] rounded-3xl p-6 text-white relative overflow-hidden shadow-2xl transition-all duration-500" style={{ backgroundColor: cardBg }}>
      {/* Background border strips to match the screenshot borders */}
      <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-b from-green-500 via-yellow-400 to-blue-400 z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-2.5 bg-gradient-to-b from-green-500 via-yellow-400 to-blue-400 z-10" />

      {/* Card Contents */}
      <div className="flex-1 flex flex-col items-center justify-between z-0 px-2 select-none">
        
        {/* Top Header with Hearts */}
        <div className="w-full flex items-center justify-between mt-2">
          <Heart className="w-6 h-6 fill-white opacity-80" />
          <div className="flex flex-col items-center">
            <span className="text-[10px] tracking-[0.2em] font-medium uppercase opacity-80">royco x aadc</span>
            <span className="text-xs tracking-[0.1em] font-semibold uppercase">EGGSPRESI CINTA</span>
          </div>
          <Heart className="w-6 h-6 fill-white opacity-80" />
        </div>

        {/* User personalized intro if name available */}
        {participantName && (
          <div className="mt-4 text-center">
            <span className="text-[11px] bg-white/20 px-3 py-1 rounded-full uppercase tracking-wider font-semibold">
              Recipe for {participantName}
            </span>
          </div>
        )}

        {/* Badge & Title */}
        <div className="w-full text-center mt-6">
          <span className="text-[11px] bg-white/25 px-4 py-1 rounded-full uppercase font-bold tracking-wider">
            YOUR LOVE RECIPE
          </span>
          {result.subTitle && (
            <h3 className="text-yellow-300 text-xs font-semibold uppercase tracking-[0.15em] mt-3">
              {result.subTitle}
            </h3>
          )}
          <h2 className="text-2xl font-black uppercase tracking-wide mt-1 leading-tight drop-shadow-md">
            {result.title}
          </h2>
        </div>

        {/* Divider */}
        <div className="w-16 h-[2px] bg-white/40 my-4" />

        {/* Result Image */}
        <div className="my-2 relative w-36 h-36 flex items-center justify-center bg-white/10 rounded-full border border-white/20 shadow-inner">
          {/* We display a cute icon fallback or image */}
          {result.image ? (
            <img
              src={result.image}
              alt={result.title}
              className="w-28 h-28 object-contain drop-shadow-lg"
              onError={(e) => {
                // If image fails, replace with a placeholder egg/cooking svg
                (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>';
              }}
            />
          ) : (
            <div className="text-5xl">🍳</div>
          )}
        </div>

        {/* Description */}
        <p className="text-center text-xs leading-relaxed px-4 opacity-90 max-w-[280px]">
          {result.description}
        </p>

        {/* QR Code and link sharing hint */}
        <div className="mt-6 flex flex-col items-center">
          <QRCodeGen value={shareUrl} size={90} />
          <span className="text-[8px] opacity-75 uppercase tracking-[0.2em] mt-2">
            SCAN TO SCAN RECIPE
          </span>
        </div>
      </div>

      {/* Footer buttons outside flex-1 */}
      <div className="mt-6 flex flex-col gap-2 z-20 px-2">
        {result.ctaUrl && (
          <button
            onClick={onCookClick}
            className="w-full bg-white text-red-600 font-extrabold text-sm py-3 px-4 rounded-xl shadow-lg border-2 border-white active:scale-95 transition-transform uppercase tracking-wider"
            style={{ color: cardBg }}
          >
            {result.ctaText || 'COOK IT NOW'}
          </button>
        )}
        
        {!isSharingDisabled && (
          <button
            onClick={onShareClick}
            className="w-full bg-transparent hover:bg-white/10 text-white font-bold text-sm py-3 px-4 rounded-xl border-2 border-white active:scale-95 transition-transform uppercase tracking-wider"
          >
            SHARE TO IG
          </button>
        )}

        {onResetClick && (
          <button
            onClick={onResetClick}
            className="text-xs text-white/80 hover:text-white underline text-center mt-2 transition-colors uppercase tracking-wider"
          >
            Start over
          </button>
        )}
      </div>
    </div>
  );
}
