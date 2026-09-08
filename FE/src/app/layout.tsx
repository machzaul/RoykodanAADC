import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const isidora = localFont({
  src: [
    {
      path: '../../public/Font/Fonts/Isidora-SemiBold.otf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/Font/Fonts/Isidora-Black.otf',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-isidora',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Eggspresi Cinta - Royco x AADC Experience',
  description: 'Find Your Love Language - Cara kamu masak diam-diam nyimpen cara kamu mencintai. Yuk cari tahu!',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${isidora.variable} h-full antialiased font-sans`}>
      <body className="min-h-full flex flex-col bg-[#111827] text-white justify-center items-center overflow-x-hidden">
        {/* Full-screen wrapper ensuring mobile-first portrait ratio container on desktop */}
        <main className="w-full min-h-screen flex items-center justify-center p-0">
          {children}
        </main>
      </body>
    </html>
  );
}
