import fs from 'fs';
import path from 'path';

export interface CardConfigItem {
  cardId?: number;
  title?: string;
  customQrUrl?: string;
  maxQuota?: number;
}

export interface CardsConfigFile {
  onlineBaseUrl?: string;
  defaultMaxQuota?: number;
  notes?: string;
  cards?: Record<string, CardConfigItem>;
}

const DEFAULT_CONFIG: CardsConfigFile = {
  onlineBaseUrl: 'https://royko-aadc.vercel.app',
  defaultMaxQuota: 100,
  cards: {
    'acts-of-service': { customQrUrl: '', maxQuota: 100 },
    'quality-time': { customQrUrl: '', maxQuota: 100 },
    'physical-touch': { customQrUrl: '', maxQuota: 100 },
    'receiving-gifts': { customQrUrl: '', maxQuota: 100 },
    'words-of-affirmation': { customQrUrl: '', maxQuota: 100 },
  },
};

export function getCardsConfig(): CardsConfigFile {
  try {
    const configPath = path.resolve(process.cwd(), 'data', 'cards-config.json');
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Gagal membaca cards-config.json, menggunakan default config:', err);
  }
  return DEFAULT_CONFIG;
}

/**
 * Mendapatkan batas maksimal pengeluaran kartu (kuota) untuk slug kartu tertentu.
 * Default adalah 100 jika tidak dikonfigurasi.
 */
export function getCardQuota(cardSlug: string): number {
  const config = getCardsConfig();
  const cardSetting = config.cards?.[cardSlug];
  if (typeof cardSetting?.maxQuota === 'number' && cardSetting.maxQuota >= 0) {
    return cardSetting.maxQuota;
  }
  if (typeof config.defaultMaxQuota === 'number' && config.defaultMaxQuota >= 0) {
    return config.defaultMaxQuota;
  }
  return 100;
}

/**
 * Mendapatkan mapping kuota untuk semua kartu.
 */
export function getAllCardQuotas(): Record<string, number> {
  const config = getCardsConfig();
  const defaultQuota = typeof config.defaultMaxQuota === 'number' ? config.defaultMaxQuota : 100;
  const slugs = [
    'acts-of-service',
    'quality-time',
    'physical-touch',
    'receiving-gifts',
    'words-of-affirmation',
  ];
  const quotas: Record<string, number> = {};
  slugs.forEach((slug) => {
    const cardQuota = config.cards?.[slug]?.maxQuota;
    quotas[slug] = typeof cardQuota === 'number' ? cardQuota : defaultQuota;
  });
  return quotas;
}

/**
 * Mendapatkan URL QR code untuk kartu tertentu.
 * Jika operator mengisi `customQrUrl` di cards-config.json, URL tersebut yang dipakai.
 * Jika kosong, otomatis memakai `${onlineBaseUrl}/result/${cardSlug}`.
 */
export function resolveCardQrUrl(cardSlug: string, queryParams?: Record<string, string | number | undefined>): string {
  const config = getCardsConfig();
  const cardSetting = config.cards?.[cardSlug];

  let targetUrl = '';
  if (cardSetting?.customQrUrl && cardSetting.customQrUrl.trim() !== '') {
    targetUrl = cardSetting.customQrUrl.trim();
  } else {
    const base = (config.onlineBaseUrl || process.env.NEXT_PUBLIC_ONLINE_URL || 'https://royko-aadc.vercel.app').replace(/\/+$/, '');
    targetUrl = `${base}/result/${cardSlug}`;
  }

  if (queryParams) {
    const params = new URLSearchParams();
    Object.entries(queryParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        params.append(k, String(v));
      }
    });
    const qs = params.toString();
    if (qs) {
      targetUrl += (targetUrl.includes('?') ? '&' : '?') + qs;
    }
  }

  return targetUrl;
}
