/**
 * Audio Manager for Royko x AADC Kiosk Experience
 * Handles background music looping, button click sound effects, and result screen sound.
 */

let backsoundAudio: HTMLAudioElement | null = null;
let buttonAudio: HTMLAudioElement | null = null;
let resultAudio: HTMLAudioElement | null = null;

function initAudio(): void {
  if (typeof window === 'undefined') return;

  if (!backsoundAudio) {
    backsoundAudio = new Audio('/Audio/backsound.mp3');
    backsoundAudio.loop = true;
    backsoundAudio.volume = 0.35;
    backsoundAudio.preload = 'auto';

    // Fallback event listener jika atribut loop tidak berulang di beberapa browser kiosk
    backsoundAudio.addEventListener('ended', () => {
      if (backsoundAudio) {
        backsoundAudio.currentTime = 0;
        backsoundAudio.play().catch(() => {});
      }
    });
  }

  if (!buttonAudio) {
    buttonAudio = new Audio('/Audio/buttonsound.wav');
    buttonAudio.volume = 0.85;
    buttonAudio.preload = 'auto';
  }

  if (!resultAudio) {
    resultAudio = new Audio('/Audio/soundatpageresultcard.wav');
    resultAudio.volume = 0.9;
    resultAudio.preload = 'auto';
  }
}

/**
 * Memulai audio latar belakang (backsound) dan memastikan looping terus berjalan
 */
export function playBacksound(): void {
  if (typeof window === 'undefined') return;
  initAudio();
  if (backsoundAudio) {
    backsoundAudio.loop = true;
    if (backsoundAudio.paused) {
      backsoundAudio.play().catch(() => {
        // Browser autoplay policy akan mengizinkan saat ada interaksi user pertama
      });
    }
  }
}

/**
 * Daftarkan listener global agar gesture pertama langsung menyalakan backsound
 */
export function setupAudioAutoUnlock(): void {
  if (typeof window === 'undefined') return;
  initAudio();

  const unlockHandler = () => {
    playBacksound();
    window.removeEventListener('pointerdown', unlockHandler);
    window.removeEventListener('touchstart', unlockHandler);
    window.removeEventListener('click', unlockHandler);
  };

  window.addEventListener('pointerdown', unlockHandler, { passive: true, once: true });
  window.addEventListener('touchstart', unlockHandler, { passive: true, once: true });
  window.addEventListener('click', unlockHandler, { passive: true, once: true });
}

/**
 * Membunyikan suara klik tombol (button sound)
 * Dijalankan pada: tombol Mulai, Lanjut, Mulai Tes, dan opsi jawaban kuis.
 */
export function playButtonSound(): void {
  if (typeof window === 'undefined') return;
  initAudio();
  // Setiap klik tombol juga otomatis mengaktifkan backsound jika belum aktif
  playBacksound();

  if (buttonAudio) {
    try {
      buttonAudio.currentTime = 0;
      buttonAudio.play().catch(() => {});
    } catch {
      // Abaikan error playback audio
    }
  }
}

/**
 * Membunyikan efek suara saat tiba di halaman hasil kuis (result screen)
 */
export function playResultSound(): void {
  if (typeof window === 'undefined') return;
  initAudio();
  if (resultAudio) {
    try {
      resultAudio.currentTime = 0;
      resultAudio.play().catch(() => {});
    } catch {
      // Abaikan error playback audio
    }
  }
}

/**
 * Menghentikan semua audio saat reset kuis jika diperlukan
 */
export function stopAllAudio(): void {
  if (backsoundAudio) {
    backsoundAudio.pause();
    backsoundAudio.currentTime = 0;
  }
  if (buttonAudio) {
    buttonAudio.pause();
    buttonAudio.currentTime = 0;
  }
  if (resultAudio) {
    resultAudio.pause();
    resultAudio.currentTime = 0;
  }
}
