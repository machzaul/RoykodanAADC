'use client';

import React, { useEffect, useRef, useState } from 'react';

const TOTAL_FRAMES = 90;
const TARGET_FPS = 36; // Optimal frame rate for realistic, silky-smooth frying pan flip
const FRAME_INTERVAL = 1000 / TARGET_FPS;

export default function PanciSequencePlayer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [ready, setReady] = useState(false);
  const currentFrameRef = useRef(0);
  const lastTimeRef = useRef(0);
  const reqIdRef = useRef<number | null>(null);

  // Preload all 91 frames
  useEffect(() => {
    let isCancelled = false;
    const loadedImages: HTMLImageElement[] = [];
    let loadedCount = 0;

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const pad = String(i).padStart(5, '0');
      const img = new Image();
      img.src = '/Motion/frames/frame_' + pad + '.png';
      img.onload = () => {
        loadedCount++;
        // Start rendering as soon as the first few frames arrive for instant playback
        if (loadedCount >= 3 && !isCancelled) {
          setReady(true);
        }
      };
      loadedImages.push(img);
    }

    imagesRef.current = loadedImages;

    return () => {
      isCancelled = true;
      if (reqIdRef.current) {
        cancelAnimationFrame(reqIdRef.current);
      }
    };
  }, []);

  // Continuous animation loop using requestAnimationFrame
  useEffect(() => {
    if (!ready) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const animate = (time: number) => {
      if (time - lastTimeRef.current >= FRAME_INTERVAL) {
        lastTimeRef.current = time;

        const img = imagesRef.current[currentFrameRef.current];
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }

        currentFrameRef.current = (currentFrameRef.current + 1) % TOTAL_FRAMES;
      }

      reqIdRef.current = requestAnimationFrame(animate);
    };

    reqIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (reqIdRef.current) {
        cancelAnimationFrame(reqIdRef.current);
      }
    };
  }, [ready]);

  return (
    <div className="w-64 sm:w-72 h-64 sm:h-72 flex items-center justify-center relative overflow-hidden mx-auto">
      <canvas
        ref={canvasRef}
        width={800}
        height={800}
        className="w-full h-full object-contain pointer-events-none drop-shadow-xl"
      />
    </div>
  );
}
