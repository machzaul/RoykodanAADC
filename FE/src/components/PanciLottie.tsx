'use client';

import React from 'react';
import { Lottie } from 'lottie-react';

export default function PanciLottie() {
  return (
    <div className="w-72 sm:w-84 h-auto max-w-full flex items-center justify-center overflow-visible">
      <Lottie
        src="/Motion/Loadingpanci.json"
        autoplay
        loop
        style={{ width: '100%', height: 'auto' }}
      />
    </div>
  );
}
