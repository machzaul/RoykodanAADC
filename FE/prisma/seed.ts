import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with authentic Royco x AADC data...');

  // 1. Clean existing data
  await prisma.analyticsEvent.deleteMany({});
  await prisma.quizSession.deleteMany({});
  await prisma.participant.deleteMany({});
  await prisma.resultOption.deleteMany({});
  await prisma.answer.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.quiz.deleteMany({});

  // 2. Create Active Quiz Campaign
  const quiz = await prisma.quiz.create({
    data: {
      title: 'Find Your Love Language',
      slug: 'eggspresi-cinta',
      description: 'Eggspresi Cinta • Royco x AADC Experience',
      status: true,
    },
  });

  // 3. Create Result Options (5 Love Languages mapping to Cardresult/PNG/)
  const resultActsOfService = await prisma.resultOption.create({
    data: {
      quizId: quiz.id,
      code: 'ACTS_OF_SERVICE',
      title: 'Acts of Service',
      subTitle: 'Menemukan Omelet Hangat yang Lembut Sudah Tersaji Rapi di Meja',
      description:
        'Tidak ada yang lebih romantis selain bangun tidur dan menyadari bahwa kamu tidak perlu mengotori tangan atau memikirkan menu sarapan. Kehadiran omelet hangat yang dibuat penuh perhatian adalah bukti nyata bahwa pasanganmu peduli pada energi dan kebahagiaanmu sebelum kamu memulai hari.',
      image: '/ImageRef/Cardresult/PNG/CARD-01.png',
      backgroundColor: '#E50012',
      ctaText: 'Cetak Struk',
      ctaUrl: 'https://www.masakapahariini.com',
    },
  });

  const resultQualityTime = await prisma.resultOption.create({
    data: {
      quizId: quiz.id,
      code: 'QUALITY_TIME',
      title: 'Quality Time',
      subTitle: 'Masak Omelet Bareng di Dapur Sambil Ngobrol Santai',
      description:
        'Kamu menikmati setiap detik bumbu yang ditaburkan bersama, lelucon di sela-sela mengocok telur, hingga percakapan hangat di tengah kepulan asap dapur. Kehadiran penuh tanpa distraksi gadget di ruang sempit itulah yang menguatkan ikatan batin kalian.',
      image: '/ImageRef/Cardresult/PNG/CARD-02.png',
      backgroundColor: '#E50012',
      ctaText: 'Cetak Struk',
      ctaUrl: 'https://www.masakapahariini.com',
    },
  });

  const resultPhysicalTouch = await prisma.resultOption.create({
    data: {
      quizId: quiz.id,
      code: 'PHYSICAL_TOUCH',
      title: 'Physical Touch',
      subTitle: 'Dipeluk Dari Belakang Saat Sedang Masak Omelet',
      description:
        'Sentuhan lembut, pelukan hangat dari belakang, dan bauran aroma wangi pasangan dengan bau gurih masakan di kompor menciptakan sensasi kehangatan yang tiada duanya. Momen sederhana ini seketika membuat dapur terasa seperti tempat paling nyaman di dunia.',
      image: '/ImageRef/Cardresult/PNG/CARD-03.png',
      backgroundColor: '#E50012',
      ctaText: 'Cetak Struk',
      ctaUrl: 'https://www.masakapahariini.com',
    },
  });

  const resultReceivingGifts = await prisma.resultOption.create({
    data: {
      quizId: quiz.id,
      code: 'RECEIVING_GIFTS',
      title: 'Receiving Gifts',
      subTitle: 'Dikasih Hadiah Teflon Anti-Lengket dan Royco Mealmaker',
      description:
        'Hadiah terbaik bukanlah yang paling mahal, melainkan yang paling praktis dan memahami kebutuhanmu saat ini plus bumbu serbaguna agar prosesnya makin praktis, adalah bentuk kejutan yang sangat personal.',
      image: '/ImageRef/Cardresult/PNG/CARD-04.png',
      backgroundColor: '#E50012',
      ctaText: 'Cetak Struk',
      ctaUrl: 'https://www.masakapahariini.com',
    },
  });

  const resultWordsOfAffirmation = await prisma.resultOption.create({
    data: {
      quizId: quiz.id,
      code: 'WORDS_OF_AFFIRMATION',
      title: 'Words of Affirmation',
      subTitle: 'Dipuji Setinggi Langit Saat Berhasil Membalikkan Omelet Tanpa Hancur',
      description:
        'Kamu menikmati setiap detik bumbu yang ditaburkan bersama, lelucon di sela-sela mengocok telur, hingga percakapan hangat di tengah kepulan asap dapur.',
      image: '/ImageRef/Cardresult/PNG/CARD-05.png',
      backgroundColor: '#E50012',
      ctaText: 'Cetak Struk',
      ctaUrl: 'https://www.masakapahariini.com',
    },
  });

  // 4. Create 5 Questions & 5 Options (A, B, C, D, E) for each
  // Question 1
  const q1 = await prisma.question.create({
    data: {
      quizId: quiz.id,
      text: 'Lagi burnout parah seharian, perhatian kayak gimana yang paling kamu butuhin?',
      order: 1,
    },
  });

  await prisma.answer.createMany({
    data: [
      {
        questionId: q1.id,
        text: 'Langsung sat-set dimasakin omelet hangat favorit kamu',
        score: 3,
        resultMapping: { ACTS_OF_SERVICE: 3 },
      },
      {
        questionId: q1.id,
        text: 'Dimasakin telur bareng sambil ngobrol santai di dapur',
        score: 3,
        resultMapping: { QUALITY_TIME: 3 },
      },
      {
        questionId: q1.id,
        text: 'Dikasih pujian tulus pas kamu berhasil masak telur dadar sempurna',
        score: 3,
        resultMapping: { WORDS_OF_AFFIRMATION: 3 },
      },
      {
        questionId: q1.id,
        text: 'Dibawain olahan telur kekinian favorit kamu sebagai surprise',
        score: 3,
        resultMapping: { RECEIVING_GIFTS: 3 },
      },
      {
        questionId: q1.id,
        text: 'Diusap kepalanya dan dipeluk hangat pas kamu lagi goreng telur',
        score: 3,
        resultMapping: { PHYSICAL_TOUCH: 3 },
      },
    ],
  });

  // Question 2
  const q2 = await prisma.question.create({
    data: {
      quizId: quiz.id,
      text: 'Cara paling ampuh bikin si cold person luluh lewat masakan telur?',
      order: 2,
    },
  });

  await prisma.answer.createMany({
    data: [
      {
        questionId: q2.id,
        text: 'Inisiatif ngeracik telur dadar spesial khas kamu buat dia',
        score: 3,
        resultMapping: { ACTS_OF_SERVICE: 3 },
      },
      {
        questionId: q2.id,
        text: 'Ajak ngeracik dan bumbuin resep omelet bareng berdua',
        score: 3,
        resultMapping: { QUALITY_TIME: 3 },
      },
      {
        questionId: q2.id,
        text: 'Kirim pesan manis "semangat ya, aku tau kamu jago banget masak telur"',
        score: 3,
        resultMapping: { WORDS_OF_AFFIRMATION: 3 },
      },
      {
        questionId: q2.id,
        text: 'Kirim egg box atau sarapan telur favorit ke tempatnya',
        score: 3,
        resultMapping: { RECEIVING_GIFTS: 3 },
      },
      {
        questionId: q2.id,
        text: 'Kasih sentuhan lembut di pundak pas dia lagi sibuk di depan kompor',
        score: 3,
        resultMapping: { PHYSICAL_TOUCH: 3 },
      },
    ],
  });

  // Question 3
  const q3 = await prisma.question.create({
    data: {
      quizId: quiz.id,
      text: 'Momen masak telur bareng yang paling bikin kamu salting tuh pas...',
      order: 3,
    },
  });

  await prisma.answer.createMany({
    data: [
      {
        questionId: q3.id,
        text: 'Dia inisiatif ngeracik dan balikin telurnya khusus buat kamu',
        score: 3,
        resultMapping: { ACTS_OF_SERVICE: 3 },
      },
      {
        questionId: q3.id,
        text: 'Vibes-nya dapet banget buat deep talk sambil nunggu telurnya matang',
        score: 3,
        resultMapping: { QUALITY_TIME: 3 },
      },
      {
        questionId: q3.id,
        text: 'Dia terang-terangan muji wangi dan rasa telur buatan kamu',
        score: 3,
        resultMapping: { WORDS_OF_AFFIRMATION: 3 },
      },
      {
        questionId: q3.id,
        text: 'Dia mendadak beliin cetakan telur bentuk hati yang lucu buat kamu',
        score: 3,
        resultMapping: { RECEIVING_GIFTS: 3 },
      },
      {
        questionId: q3.id,
        text: 'Masak berdiri dempetan sambil skinship santai di depan kompor',
        score: 3,
        resultMapping: { PHYSICAL_TOUCH: 3 },
      },
    ],
  });

  // Question 4
  const q4 = await prisma.question.create({
    data: {
      quizId: quiz.id,
      text: 'Gebetan lagi bad mood, reaksi first aid kamu?',
      order: 4,
    },
  });

  await prisma.answer.createMany({
    data: [
      {
        questionId: q4.id,
        text: 'Sat-set bikin dan suapin omelet keju yang gurih hangat',
        score: 3,
        resultMapping: { ACTS_OF_SERVICE: 3 },
      },
      {
        questionId: q4.id,
        text: 'Samperin ke rumahnya dan ajak masak resep telur viral bareng',
        score: 3,
        resultMapping: { QUALITY_TIME: 3 },
      },
      {
        questionId: q4.id,
        text: 'Kirim chat ucapan semangat plus apresiasi usaha dia masak hari ini',
        score: 3,
        resultMapping: { WORDS_OF_AFFIRMATION: 3 },
      },
      {
        questionId: q4.id,
        text: 'GoFood-in egg sandwich hits kesukaannya biar dia happy lagi',
        score: 3,
        resultMapping: { RECEIVING_GIFTS: 3 },
      },
      {
        questionId: q4.id,
        text: 'Langsung peluk hangat dari belakang pas dia lagi siapin sarapan telur',
        score: 3,
        resultMapping: { PHYSICAL_TOUCH: 3 },
      },
    ],
  });

  // Question 5
  const q5 = await prisma.question.create({
    data: {
      quizId: quiz.id,
      text: 'Mana yang bikin kamu berasa dicintai secara "ugal-ugalan" di dapur?',
      order: 5,
    },
  });

  await prisma.answer.createMany({
    data: [
      {
        questionId: q5.id,
        text: 'Doi super peka & sat-set nyiapin bahan-bahan buat bikin omelet',
        score: 3,
        resultMapping: { ACTS_OF_SERVICE: 3 },
      },
      {
        questionId: q5.id,
        text: 'Doi selalu make time buat nemenin dan bantu kamu ngocok telur',
        score: 3,
        resultMapping: { QUALITY_TIME: 3 },
      },
      {
        questionId: q5.id,
        text: 'Doi rajin hype up dan bilang telur buatan kamu yang paling enak',
        score: 3,
        resultMapping: { WORDS_OF_AFFIRMATION: 3 },
      },
      {
        questionId: q5.id,
        text: 'Doi peka beliin bumbu Royco dan piring estetik khusus buat masakan telurmu',
        score: 3,
        resultMapping: { RECEIVING_GIFTS: 3 },
      },
      {
        questionId: q5.id,
        text: 'Doi refleks genggam tanganmu pas lagi belajar mbalik telur dadar',
        score: 3,
        resultMapping: { PHYSICAL_TOUCH: 3 },
      },
    ],
  });

  console.log('Database seeded successfully with 5 questions and 5 Love Language cards!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
