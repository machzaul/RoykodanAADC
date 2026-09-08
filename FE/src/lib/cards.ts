export interface DefinedCard {
  id: number;
  slug: string;
  code: string;
  title: string;
  subTitle: string;
  description: string;
  image: string;
}

export const DEFINED_CARDS: Record<string, DefinedCard> = {
  '1': {
    id: 1,
    slug: 'acts-of-service',
    code: 'ACTS_OF_SERVICE',
    title: 'Acts of Service',
    subTitle: 'Menemukan Omelet Hangat yang Lembut Sudah Tersaji Rapi di Meja',
    description:
      'Tidak ada yang lebih romantis selain bangun tidur dan menyadari bahwa kamu tidak perlu mengotori tangan atau memikirkan menu sarapan. Kehadiran omelet hangat yang dibuat penuh perhatian adalah bukti nyata bahwa pasanganmu peduli pada energi dan kebahagiaanmu sebelum kamu memulai hari.',
    image: '/ImageRef/Cardresult/PNG/CARD-01.png',
  },
  '2': {
    id: 2,
    slug: 'quality-time',
    code: 'QUALITY_TIME',
    title: 'Quality Time',
    subTitle: 'Masak Omelet Bareng di Dapur Sambil Ngobrol Santai',
    description:
      'Kamu menikmati setiap detik bumbu yang ditaburkan bersama, lelucon di sela-sela mengocok telur, hingga percakapan hangat di tengah kepulan asap dapur. Kehadiran penuh tanpa distraksi gadget di ruang sempit itulah yang menguatkan ikatan batin kalian.',
    image: '/ImageRef/Cardresult/PNG/CARD-02.png',
  },
  '3': {
    id: 3,
    slug: 'physical-touch',
    code: 'PHYSICAL_TOUCH',
    title: 'Physical Touch',
    subTitle: 'Dipeluk Dari Belakang Saat Sedang Masak Omelet',
    description:
      'Sentuhan lembut, pelukan hangat dari belakang, dan bauran aroma wangi pasangan dengan bau gurih masakan di kompor menciptakan sensasi kehangatan yang tiada duanya. Momen sederhana ini seketika membuat dapur terasa seperti tempat paling nyaman di dunia.',
    image: '/ImageRef/Cardresult/PNG/CARD-03.png',
  },
  '4': {
    id: 4,
    slug: 'receiving-gifts',
    code: 'RECEIVING_GIFTS',
    title: 'Receiving Gifts',
    subTitle: 'Dikasih Hadiah Teflon Anti-Lengket dan Royco Mealmaker',
    description:
      'Hadiah terbaik bukanlah yang paling mahal, melainkan yang paling praktis dan memahami kebutuhanmu saat ini plus bumbu serbaguna agar prosesnya makin praktis, adalah bentuk kejutan yang sangat personal.',
    image: '/ImageRef/Cardresult/PNG/CARD-04.png',
  },
  '5': {
    id: 5,
    slug: 'words-of-affirmation',
    code: 'WORDS_OF_AFFIRMATION',
    title: 'Words of Affirmation',
    subTitle: 'Dipuji Setinggi Langit Saat Berhasil Membalikkan Omelet Tanpa Hancur',
    description:
      'Pujian tulus yang terucap saat masakanmu sukses adalah bumbu terbaik yang pernah ada. Kata-kata apresiasi itu membuat rasa percaya dirimu membuncah, membuktikan bahwa usahamu selalu dilihat dan dihargai.',
    image: '/ImageRef/Cardresult/PNG/CARD-05.png',
  },
};

export const ALL_CARDS: DefinedCard[] = Object.values(DEFINED_CARDS);

export function getCardByIdOrSlug(identifier: string): DefinedCard | null {
  if (!identifier) return null;
  const normalized = identifier.toLowerCase().trim().replace(/_/g, '-');

  // Direct numeric match ('1' - '5')
  if (DEFINED_CARDS[normalized]) {
    return DEFINED_CARDS[normalized];
  }

  // Match by slug (e.g. 'acts-of-service', 'quality-time')
  const bySlug = ALL_CARDS.find(
    (c) =>
      c.slug === normalized ||
      c.code.toLowerCase().replace(/_/g, '-') === normalized ||
      c.title.toLowerCase().replace(/\s+/g, '-') === normalized
  );

  return bySlug || null;
}
