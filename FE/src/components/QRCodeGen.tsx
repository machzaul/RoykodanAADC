'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeGenProps {
  value: string;
  size?: number;
  includeMargin?: boolean;
}

export default function QRCodeGen({ value, size = 120, includeMargin = true }: QRCodeGenProps) {
  return (
    <div className="bg-white p-2 rounded-lg shadow-md inline-block">
      <QRCodeSVG
        value={value}
        size={size}
        level="M"
        includeMargin={includeMargin}
        imageSettings={{
          src: '/logo-mini.png', // Optional small logo in the center of QR
          x: undefined,
          y: undefined,
          height: 24,
          width: 24,
          excavate: true,
        }}
      />
    </div>
  );
}
