/**
 * TALIMOON HAYOT (Journey) — content source.
 * ----------------------------------------------------------------
 * `PRODUCTION_ENTRIES` / `PRODUCTION_PULSE` are the real public
 * dataset. They are intentionally EMPTY until real photos, video
 * and text are supplied — HAYOT shows elegant, intentional empty
 * states, never invented volume, never a fabricated event, story,
 * date, family, statistic, partnership or achievement.
 *
 * Adding the first real entry is a single object appended to
 * `PRODUCTION_ENTRIES` — see `dev-fixtures.ts` for the exact shape
 * of every format (photo reportage, video, thought, moment, update,
 * campaign) and every block type. No component changes.
 *
 * Development fixtures (`dev-fixtures.ts`) are opt-in and merged only
 * when `NEXT_PUBLIC_JOURNEY_FIXTURES=1` in development. Real content is
 * therefore the default locally as well as in production.
 *
 * These accessors are pure functions over local data with no
 * server-only imports, so they are safe to call from Server and
 * Client Components alike.
 */

import {
  directionFor,
  type Direction,
  type EntryContent,
  type JourneyEntry,
  type JourneyVideo,
  type JourneyWorld,
  type Locale,
  type PulseItem,
  type PulseSeed,
} from './types';

// ── Shared media ───────────────────────────────────────────────────
/**
 * The language-neutral TALIMOON Kundaligi · 01 cinematic artwork.
 * One image, no baked-in words: it fronts the FEATURED HERO on the
 * Journey landing and doubles as the film's poster inside the
 * article. Every headline, date and CTA around it is real localized
 * HTML, so UZ, EN and RU all use this same file.
 */
const TALIMOON_KUNDALIGI_01_COVER = {
  id: 'talimoon-kundaligi-01-qnl-cover',
  src: '/images/journey/talimoon-kundaligi-01-qnl-cover.webp',
  width: 1672,
  height: 941,
} as const;

/**
 * TALIMOON Kundaligi · 01 — the vertical mini-film shot at the Qatar
 * National Library. Poster-first (nothing loads until play). Shared
 * by the entry's lead `video` slot (preview poster + play cue on the
 * premiere / worlds index) and the `video` block in its body. The
 * frame is a real 9:16, so the player keeps it vertical and never
 * stretches it into a horizontal box.
 */
const TALIMOON_DIARY_01_FILM: JourneyVideo = {
  poster: { ...TALIMOON_KUNDALIGI_01_COVER },
  provider: 'file',
  src: '/video/talimoon-goyalari-qayerdan-tugiladi.mp4',
  orientation: 'portrait',
  durationSec: 60,
  credit: 'Video: TALIMOON · Qatar National Library, Doha',
};

// ── Dataset ────────────────────────────────────────────────────────
/**
 * The real public dataset. EMPTY until real content is supplied.
 * Append a `JourneyEntry` here to publish it — the page composes
 * itself. `featured: true` pins one entry to THE OPENING.
 */
const PRODUCTION_ENTRIES: readonly JourneyEntry[] = [
  {
    id: 'talimoon-diary-01',
    slug: 'talimoon-goyalari-qayerdan-tugiladi',
    world: 'talimoon-life',
    format: 'reportage',
    weight: 'lead',
    status: 'published',
    featured: true,
    publishedAtISO: '2026-09-05T09:00:00.000Z',
    tags: ['talimoon-kundaligi', 'doha', 'qatar-national-library', 'ilk-kunlar'],
    defaultLocale: 'uz',
    indexable: true,
    media: { consent: 'not-applicable' },
    heroImage: { ...TALIMOON_KUNDALIGI_01_COVER },
    video: TALIMOON_DIARY_01_FILM,
    relatedSlugs: ['hali-kichkina-keyin-organadi'],
    translations: {
      uz: {
        kicker: { label: 'TALIMOON KUNDALIGI · 01', dateLabel: '5 SENTABR, 2026' },
        title: 'TALIMOON g‘oyalari qayerdan tug‘iladi?',
        standfirst:
          'TALIMOON’ning ilk kunlari. Bir tomonda minglab kitoblar, ikkinchi tomonda esa hali qurilayotgan yangi platforma. Bu safar ish stolimiz Qatar National Library’da.',
        coverAlt:
          'TALIMOON kundaligi · 01 uchun kinematik muqova tasviri: Qatar National Library yonida stol ustidagi kitoblar va noutbukda TALIMOON sayti.',
        author: 'Qatar National Library · Doha, Qatar',
        blocks: [
          { t: 'video', video: TALIMOON_DIARY_01_FILM },
          { t: 'paragraph', text: 'Bugun TALIMOON ustidagi ish Qatar National Library’da davom etmoqda.' },
          { t: 'paragraph', text: 'Atrofda minglab kitoblar. Turli tillar, turli hikoyalar, turli avlodlar uchun yaratilgan bilimlar. Stol ustida esa ikki kompyuter va ularda asta-sekin o‘z shaklini topayotgan TALIMOON.' },
          { t: 'paragraph', text: 'Bu TALIMOON’ning hali ilk kunlari.' },
          { t: 'paragraph', text: 'Hozir biz ko‘rayotgan har bir sahifa, sinab ko‘rayotgan har bir yechim va qayta ko‘rib chiqayotgan har bir detal kelajakda bolaning qo‘liga yetib boradigan tajribaning bir qismiga aylanishi mumkin.' },
          { t: 'heading', level: 2, text: 'Ilhom shunchaki yangi g‘oya emas' },
          { t: 'paragraph', text: 'Biz kitoblarni ko‘ramiz. Hikoyalar qanday taqdim etilganini kuzatamiz. Bolalar uchun yaratilgan muhitlarni o‘rganamiz. Yaxshi tajriba ortidagi kichik detallarni izlaymiz.' },
          { t: 'paragraph', text: 'Va doim bir savolga qaytamiz:' },
          { t: 'quote', text: 'Farzand uchun bundan ham mazmunliroq tajribani qanday yarata olamiz?' },
          { t: 'paragraph', text: 'TALIMOON’da biz kitobni shunchaki o‘qiladigan mahsulot sifatida tasavvur qilmaymiz. Hikoya bolaning o‘zini unda ko‘rishiga, yangi narsani kashf etishiga, savol berishiga va o‘rganganini uzoq vaqt eslab qolishiga sabab bo‘lishini istaymiz.' },
          { t: 'heading', level: 2, text: 'G‘oyalar bir joyda tug‘ilmaydi' },
          { t: 'paragraph', text: 'Shu sabab TALIMOON bir joyda yaratilmaydi.' },
          { t: 'paragraph', text: 'Ba’zan g‘oya kitob sahifasidan keladi. Ba’zan bir bolaning qiziqishidan. Ba’zan suhbatdan, kuzatuvdan yoki javobini hali topmagan savoldan.' },
          { t: 'paragraph', text: 'Bugun esa bu izlanish Doha shahrida, Qatar National Library’dagi minglab kitoblar orasida davom etmoqda.' },
          { t: 'quote', text: 'Bir tomonda o‘tmishdan bizgacha yetib kelgan bilimlar. Ikkinchi tomonda esa hali yozilmagan hikoyalar. O‘rtada TALIMOON.' },
          { t: 'paragraph', text: 'Hali oldinda qilinadigan ishlar ko‘p. Yuzlab hikoyalar, yangi kitoblar, yangi tajribalar va bugun biz hali tasavvur qilayotgan bolalar olami bor.' },
          { t: 'paragraph', text: 'Lekin katta yo‘llarning ham birinchi sahifasi bo‘ladi.' },
          { t: 'paragraph', text: 'Bu bizning ilk sahifalarimizdan biri.' },
          { t: 'note', text: 'Qatar National Library · Doha, Qatar · 5-sentabr, 2026 · TALIMOON kundaligi · 01' },
        ],
      },
      en: {
        kicker: { label: 'TALIMOON DIARY · 01', dateLabel: 'SEPTEMBER 5, 2026' },
        title: 'Where do TALIMOON’s ideas come from?',
        standfirst:
          'The earliest days of TALIMOON. On one side, thousands of books; on the other, a new platform still taking shape. This time, our desk is at the Qatar National Library.',
        coverAlt:
          'Cinematic cover for TALIMOON Diary · 01: books on a desk beside the Qatar National Library, with the TALIMOON site open on a laptop.',
        author: 'Qatar National Library · Doha, Qatar',
        blocks: [
          { t: 'video', video: TALIMOON_DIARY_01_FILM },
          { t: 'paragraph', text: 'Today, work on TALIMOON continues at the Qatar National Library.' },
          { t: 'paragraph', text: 'Thousands of books surround us. Different languages, different stories, knowledge created for different generations. And on the desk, two laptops, with TALIMOON slowly taking shape on their screens.' },
          { t: 'paragraph', text: 'These are still TALIMOON’s very first days.' },
          { t: 'paragraph', text: 'Every page we look at now, every solution we test, and every detail we reconsider may one day become part of the experience that reaches a child’s hands.' },
          { t: 'heading', level: 2, text: 'Inspiration is not just a new idea' },
          { t: 'paragraph', text: 'We look at books. We watch how stories are presented. We study the environments created for children. We search for the small details behind a good experience.' },
          { t: 'paragraph', text: 'And we always come back to one question:' },
          { t: 'quote', text: 'How can we create an even more meaningful experience for a child?' },
          { t: 'paragraph', text: 'At TALIMOON, we don’t picture a book as simply something to be read. We want the story to help a child see themselves in it, discover something new, ask questions, and remember what they’ve learned for a long time to come.' },
          { t: 'heading', level: 2, text: 'Ideas are not born in one place' },
          { t: 'paragraph', text: 'That’s why TALIMOON isn’t being built in just one place.' },
          { t: 'paragraph', text: 'Sometimes an idea comes from the page of a book. Sometimes from a child’s curiosity. Sometimes from a conversation, an observation, or a question that hasn’t yet found its answer.' },
          { t: 'paragraph', text: 'Today, that search continues in Doha, among the thousands of books at the Qatar National Library.' },
          { t: 'quote', text: 'On one side, knowledge that has reached us from the past. On the other, stories not yet written. In between, TALIMOON.' },
          { t: 'paragraph', text: 'There is still so much work ahead. Hundreds of stories, new books, new experiences, and a world of childhood we are only just beginning to imagine.' },
          { t: 'paragraph', text: 'But even the longest journeys have a first page.' },
          { t: 'paragraph', text: 'This is one of the first pages of ours.' },
          { t: 'note', text: 'Qatar National Library · Doha, Qatar · September 5, 2026 · TALIMOON Diary · 01' },
        ],
      },
      ru: {
        kicker: { label: 'ДНЕВНИК TALIMOON · 01', dateLabel: '5 СЕНТЯБРЯ 2026' },
        title: 'Откуда рождаются идеи TALIMOON?',
        standfirst:
          'Самые первые дни TALIMOON. С одной стороны тысячи книг, с другой пока только строящаяся новая платформа. На этот раз наш рабочий стол в Катарской национальной библиотеке.',
        coverAlt:
          'Кинематографическая обложка «Дневника TALIMOON · 01»: книги на столе рядом с Катарской национальной библиотекой и сайт TALIMOON, открытый на ноутбуке.',
        author: 'Qatar National Library · Doha, Qatar',
        blocks: [
          { t: 'video', video: TALIMOON_DIARY_01_FILM },
          { t: 'paragraph', text: 'Сегодня работа над TALIMOON продолжается в Катарской национальной библиотеке.' },
          { t: 'paragraph', text: 'Вокруг тысячи книг. Разные языки, разные истории, знания, созданные для разных поколений. А на столе два компьютера, и на их экранах постепенно обретает форму TALIMOON.' },
          { t: 'paragraph', text: 'Это всё ещё самые первые дни TALIMOON.' },
          { t: 'paragraph', text: 'Каждая страница, которую мы сейчас просматриваем, каждое решение, которое мы проверяем, и каждая деталь, которую мы пересматриваем, однажды может стать частью того опыта, который дойдёт до рук ребёнка.' },
          { t: 'heading', level: 2, text: 'Вдохновение это не просто новая идея' },
          { t: 'paragraph', text: 'Мы смотрим книги. Наблюдаем, как подаются истории. Изучаем среды, созданные для детей. Ищем маленькие детали, которые стоят за хорошим опытом.' },
          { t: 'paragraph', text: 'И всегда возвращаемся к одному вопросу:' },
          { t: 'quote', text: 'Как создать для ребёнка ещё более осмысленный опыт?' },
          { t: 'paragraph', text: 'В TALIMOON мы не представляем книгу просто как продукт для чтения. Мы хотим, чтобы история помогала ребёнку увидеть в ней себя, открыть что-то новое, задать вопрос и надолго запомнить узнанное.' },
          { t: 'heading', level: 2, text: 'Идеи не рождаются в одном месте' },
          { t: 'paragraph', text: 'Поэтому TALIMOON не создаётся в одном месте.' },
          { t: 'paragraph', text: 'Иногда идея приходит со страницы книги. Иногда из любопытства ребёнка. Иногда из разговора, наблюдения или вопроса, который пока не нашёл ответа.' },
          { t: 'paragraph', text: 'А сегодня этот поиск продолжается в Дохе, среди тысяч книг Катарской национальной библиотеки.' },
          { t: 'quote', text: 'С одной стороны знания, дошедшие до нас из прошлого. С другой истории, которые ещё не написаны. Между ними TALIMOON.' },
          { t: 'paragraph', text: 'Впереди ещё много работы. Сотни историй, новые книги, новый опыт и целый мир детства, который мы только начинаем себе представлять.' },
          { t: 'paragraph', text: 'Но и у самых длинных путей есть первая страница.' },
          { t: 'paragraph', text: 'Это одна из наших первых страниц.' },
          { t: 'note', text: 'Qatar National Library · Doha, Qatar · 5 сентября 2026 · Дневник TALIMOON · 01' },
        ],
      },
    },
  },
  {
    id: 'parents-early-learning-01',
    slug: 'hali-kichkina-keyin-organadi',
    world: 'parents',
    format: 'book-insight',
    weight: 'feature',
    status: 'published',
    featured: false,
    parentFeature: true,
    publishedAtISO: '2026-09-05T08:30:00.000Z',
    tags: ['ota-onalar-uchun', 'erta-talim', 'kitobdan-xulosa', 'masaru-ibuka'],
    defaultLocale: 'uz',
    indexable: true,
    media: { consent: 'not-applicable' },
    cover: {
      id: 'parents-early-learning-cover-v2',
      src: '/images/journey/parents-early-learning-cover-v2.png',
      width: 1536,
      height: 1024,
      credit: 'TALIMOON vizualizatsiyasi',
    },
    references: [
      {
        kind: 'book',
        author: 'Masaru Ibuka',
        title: 'Uchdan keyin kech',
        pages: '7, 17–18-betlar',
      },
    ],
    relatedSlugs: [
      'qobiliyati-otasiga-tortgan-rostdan-ham-shundaymi',
      'talimoon-goyalari-qayerdan-tugiladi',
    ],
    translations: {
      uz: {
        kicker: { label: 'KITOBDAN XULOSA', dateLabel: 'OTA-ONALAR UCHUN' },
        title: '“Hali kichkina, keyin o‘rganadi...” Rostdan ham shundaymi?',
        standfirst:
          'Bola o‘rganishni bog‘cha yoki maktabdan boshlamaydi. Uning qiziqishini “hali erta” deb keyinga qoldirmaslik nega muhim?',
        coverAlt:
          'Ona ikki yoshli farzandi bilan rasmlarga boy kitobni birga tomosha qilmoqda.',
        author: 'TALIMOON tahririyati',
        keyIdea:
          'Maqsad bolani boshqalardan oldinga chiqarish emas — o‘rganishga tayyor paytida uning qiziqishini qo‘llab-quvvatlash.',
        blocks: [
          { t: 'paragraph', text: 'Farzandingiz hali ikki yoshda. Balki siz ham: “Hali kichkina, kattaroq bo‘lsa o‘rgatamiz”, deb o‘ylarsiz.' },
          { t: 'paragraph', text: 'Ammo bola o‘rganishni bog‘cha yoki maktabdan boshlamaydi. U hozirdanoq sizning gaplaringizni eshitadi, atrofini kuzatadi, ko‘rganlarini eslab qoladi va har kuni yangi narsalarni o‘zlashtiradi.' },
          { t: 'paragraph', text: 'Masaru Ibuka buni juda muhim davr deb hisoblaydi:' },
          { t: 'quote', text: 'Asosiysi, hamma tajriba va ta’lim usullarini “o‘z vaqtida” joriy etishdir.', attribution: 'Masaru Ibuka', role: '“Uchdan keyin kech”' },
          { t: 'paragraph', text: 'Bu bolani ikki yoshida o‘qishga, yozishga yoki hisoblashga majburlash kerak degani emas.' },
          { t: 'heading', level: 2, text: 'Imkoniyat yarating, bosim emas' },
          { t: 'paragraph', text: 'Aksincha, unga o‘rganish uchun imkoniyat yaratish kerak.' },
          { t: 'paragraph', text: 'U bilan kattalardek suhbatlashing. Birga kitob varaqlang. Rasmlardagi narsalarni nomlang. Savol bersa, imkon qadar javobsiz qoldirmang. Biror hayvon, mashina, rang yoki tabiat hodisasiga qiziqsa, shu qiziqishini yangi so‘z, kitob yoki tajriba bilan davom ettiring.' },
          { t: 'paragraph', text: 'Ibukaning yana bir muhim fikri bor:' },
          { t: 'quote', text: 'Erta ta’lim buyuk daholarni tarbiyalab yetishtirishni maqsad qilmaydi.', attribution: 'Masaru Ibuka', role: '“Uchdan keyin kech”' },
          { t: 'paragraph', text: 'Demak, maqsad farzandingizni boshqalardan oldinga chiqarish emas.' },
          { t: 'heading', level: 2, text: 'Qiziqishni keyinga qoldirmang' },
          { t: 'paragraph', text: 'Maqsad — u o‘rganishga tayyor bo‘lgan paytda “hali erta” deb uning qiziqishini keyinga qoldirmaslik.' },
        ],
      },
      en: {
        kicker: { label: 'BOOK INSIGHT', dateLabel: 'FOR PARENTS' },
        title: '“Still too young to learn...” Is that really true?',
        standfirst:
          'A child doesn’t begin learning at kindergarten or school. Why does it matter not to put off their curiosity as “too early”?',
        coverAlt:
          'A mother looks through a picture-rich book together with her two-year-old.',
        author: 'TALIMOON editorial team',
        keyIdea:
          'The goal isn’t to put a child ahead of others — it’s to support their curiosity the moment they’re ready to learn.',
        blocks: [
          { t: 'paragraph', text: 'Your child is still two. You may find yourself thinking, “They’re still little — we’ll teach them once they’re older.”' },
          { t: 'paragraph', text: 'But a child doesn’t begin learning at kindergarten or school. Even now, they’re listening to what you say, watching their surroundings, remembering what they see, and picking up something new every day.' },
          { t: 'paragraph', text: 'Masaru Ibuka considers this a critically important period:' },
          { t: 'quote', text: 'What matters most is introducing every experience and method of learning “at the right time.”', attribution: 'Masaru Ibuka', role: 'Kindergarten Is Too Late' },
          { t: 'paragraph', text: 'This doesn’t mean forcing a two-year-old to read, write, or count.' },
          { t: 'heading', level: 2, text: 'Create opportunity, not pressure' },
          { t: 'paragraph', text: 'Rather, it means creating the opportunity for them to learn.' },
          { t: 'paragraph', text: 'Talk with them as you would with an adult. Look through books together. Name the things in the pictures. When they ask a question, try not to leave it unanswered. If they’re drawn to an animal, a car, a colour, or something in nature, carry that curiosity forward with a new word, a book, or an experience.' },
          { t: 'paragraph', text: 'Ibuka makes another important point:' },
          { t: 'quote', text: 'Early education is not aimed at raising great geniuses.', attribution: 'Masaru Ibuka', role: 'Kindergarten Is Too Late' },
          { t: 'paragraph', text: 'So the goal isn’t to put your child ahead of others.' },
          { t: 'heading', level: 2, text: 'Don’t put curiosity off' },
          { t: 'paragraph', text: 'The goal is simple: when they’re ready to learn, don’t set their curiosity aside as “too early.”' },
        ],
      },
    },
  },
  {
    id: 'parents-ability-environment-02',
    slug: 'qobiliyati-otasiga-tortgan-rostdan-ham-shundaymi',
    world: 'parents',
    format: 'book-insight',
    weight: 'feature',
    status: 'published',
    featured: false,
    publishedAtISO: '2026-09-05T08:00:00.000Z',
    tags: ['ota-onalar-uchun', 'qobiliyat', 'muhit', 'kitobdan-xulosa', 'masaru-ibuka'],
    defaultLocale: 'uz',
    indexable: true,
    media: { consent: 'not-applicable' },
    cover: {
      id: 'parents-ability-environment-cover-v1',
      src: '/images/journey/parents-ability-environment-cover-v1.png',
      width: 1536,
      height: 1024,
      credit: 'TALIMOON vizualizatsiyasi',
    },
    references: [
      {
        kind: 'book',
        author: 'Masaru Ibuka',
        title: 'Uchdan keyin kech',
        note: 'Bolaning qobiliyati, ta’lim va tashqi muhitning ta’siri haqidagi qismlar.',
      },
    ],
    relatedSlugs: [
      'mening-bolamning-bunga-qobiliyati-yoq',
      'hali-kichkina-keyin-organadi',
      'talimoon-goyalari-qayerdan-tugiladi',
    ],
    translations: {
      uz: {
        kicker: { label: 'KITOBDAN XULOSA', dateLabel: 'OTA-ONALAR UCHUN' },
        title: '“Qobiliyati otasiga tortgan...” Rostdan ham shundaymi?',
        standfirst:
          'Bolaning qobiliyati faqat nasl bilan belgilanadimi? Balki bugun ko‘rinmayotgan iste’dod o‘zini namoyon qilish uchun imkoniyat kutayotgandir.',
        coverAlt:
          'Ota qizining yog‘och shakllardan mustaqil yangi tuzilma yasashini kuzatmoqda.',
        author: 'TALIMOON tahririyati',
        keyIdea:
          'Bolaning qobiliyatini faqat izlamang — uning rivojlanishi uchun muhit ham yarating.',
        blocks: [
          { t: 'paragraph', text: '“Otasi matematikaga kuchli edi, bolasi ham shunga tortibdi.”' },
          { t: 'paragraph', text: '“Onasi tillarni tez o‘rganadi, qiziga ham o‘tgan.”' },
          { t: 'paragraph', text: 'Bunday gaplarni ko‘p eshitamiz. Bola biror narsani yaxshi bajarsa, buni ko‘pincha tug‘ma qobiliyat bilan tushuntiramiz.' },
          { t: 'paragraph', text: 'Ammo Masaru Ibuka bunga boshqa tomondan qaraydi.' },
          { t: 'paragraph', text: 'Uning fikricha, bolaning qanday qobiliyatlari rivojlanishida nasldan tashqari uning qanday muhitda ulg‘ayayotgani va dastlabki yillarda qanday tajribalar olayotgani ham katta rol o‘ynaydi.' },
          { t: 'quote', text: 'Ta’lim va tashqi muhit bola qobiliyatini rivojlantiruvchi asosiy omillardir.', attribution: 'Masaru Ibuka', role: '“Uchdan keyin kech”' },
          { t: 'heading', level: 2, text: 'Xulosa chiqarishga shoshilmang' },
          { t: 'paragraph', text: 'Bu fikr ota-ona uchun juda muhim.' },
          { t: 'paragraph', text: 'Chunki “Unda bu qobiliyat tug‘ma yo‘q” deb o‘ylasak, bolaga o‘sha qobiliyatini kashf qilish imkoniyatini bermasdan turib xulosa chiqarib qo‘yishimiz mumkin.' },
          { t: 'paragraph', text: 'Shuning uchun farzandingizni faqat bugun nimaga qodir ekaniga qarab baholamang.' },
          { t: 'heading', level: 2, text: 'Qobiliyatga imkoniyat kerak' },
          { t: 'paragraph', text: 'Turli kitoblarni ko‘rsating. Yangi narsalarni sinab ko‘rishiga imkon bering. Savollariga javob bering. Nimaga ko‘proq qiziqayotganini kuzating. Biror ishni sekin o‘rgansa, darrov undan voz kechmang.' },
          { t: 'quote', text: 'Bolaning qobiliyatini faqat izlamang — uning rivojlanishi uchun muhit ham yarating.' },
          { t: 'paragraph', text: 'Chunki bugun hali ko‘rinmayotgan qobiliyat, balki o‘zini namoyon qilish uchun imkoniyat kutayotgandir.' },
        ],
      },
      en: {
        kicker: { label: 'BOOK INSIGHT', dateLabel: 'FOR PARENTS' },
        title: '“Takes after his father...” Is that really true?',
        standfirst:
          'Is a child’s ability determined by heredity alone? Perhaps a talent invisible today is simply waiting for its chance to appear.',
        coverAlt:
          'A father watches his daughter independently build a new structure out of wooden shapes.',
        author: 'TALIMOON editorial team',
        keyIdea:
          'Don’t just look for your child’s ability — build the environment for it to grow.',
        blocks: [
          { t: 'paragraph', text: '“His father was strong at math, and the child takes after him.”' },
          { t: 'paragraph', text: '“Her mother picks up languages quickly, and it’s passed on to her daughter.”' },
          { t: 'paragraph', text: 'We hear remarks like these often. When a child is good at something, we tend to explain it as innate talent.' },
          { t: 'paragraph', text: 'But Masaru Ibuka looks at it from another angle.' },
          { t: 'paragraph', text: 'In his view, beyond heredity, the environment a child grows up in and the experiences they have in their earliest years play just as large a role in which abilities develop.' },
          { t: 'quote', text: 'Education and environment are the primary forces that develop a child’s abilities.', attribution: 'Masaru Ibuka', role: 'Kindergarten Is Too Late' },
          { t: 'heading', level: 2, text: 'Don’t rush to conclusions' },
          { t: 'paragraph', text: 'This idea matters a great deal for parents.' },
          { t: 'paragraph', text: 'Because if we decide “they simply don’t have that ability,” we may reach that conclusion before ever giving the child a chance to discover it.' },
          { t: 'paragraph', text: 'So don’t judge your child only by what they’re capable of today.' },
          { t: 'heading', level: 2, text: 'Ability needs opportunity' },
          { t: 'paragraph', text: 'Show them a variety of books. Give them the chance to try new things. Answer their questions. Notice what draws their interest most. If they’re slow to pick something up, don’t give up on it right away.' },
          { t: 'quote', text: 'Don’t just look for your child’s ability — build the environment for it to grow.' },
          { t: 'paragraph', text: 'Because the ability that’s invisible today may simply be waiting for its chance to appear.' },
        ],
      },
    },
  },
  {
    id: 'parents-method-matters-03',
    slug: 'mening-bolamning-bunga-qobiliyati-yoq',
    world: 'parents',
    format: 'book-insight',
    weight: 'feature',
    status: 'published',
    featured: false,
    publishedAtISO: '2026-09-05T07:30:00.000Z',
    tags: ['ota-onalar-uchun', 'qobiliyat', 'orgatish-usuli', 'kitobdan-xulosa', 'masaru-ibuka'],
    defaultLocale: 'uz',
    indexable: true,
    media: { consent: 'not-applicable' },
    cover: {
      id: 'parents-method-matters-cover-v3',
      src: '/images/journey/parents-method-matters-cover-v3.png',
      width: 1536,
      height: 1024,
      credit: 'TALIMOON vizualizatsiyasi',
    },
    references: [
      {
        kind: 'book',
        author: 'Masaru Ibuka',
        title: 'Uchdan keyin kech',
        note: 'Shinichi Suzuki tajribasi va o‘qitish usulining ahamiyati haqidagi qism.',
      },
    ],
    relatedSlugs: [
      'qobiliyati-otasiga-tortgan-rostdan-ham-shundaymi',
      'hali-kichkina-keyin-organadi',
    ],
    translations: {
      uz: {
        kicker: { label: 'KITOBDAN XULOSA', dateLabel: 'OTA-ONALAR UCHUN' },
        title: '“Bunga qobiliyati yo‘q...” Balki mos yo‘l hali topilmagandir?',
        standfirst:
          'Bola bugun uddalay olmayotgan narsa uning imkoniyati chegarasi emas. Ba’zan undan ko‘proq harakatni emas, bizdan boshqa usulni talab qiladi.',
        coverAlt:
          'Ona o‘g‘liga rangli shakllardan tuzilgan vazifani kichik bosqichlarda bajarishga yordam bermoqda.',
        author: 'TALIMOON tahririyati',
        keyIdea:
          'Ba’zan bolaga yetishmayotgan narsa qobiliyat emas — shunchaki unga mos yo‘l hali topilmagan bo‘lishi mumkin.',
        blocks: [
          { t: 'paragraph', text: 'Farzandingiz biror narsani boshqalarga qaraganda sekinroq o‘rgansa, xayolingizdan: “Shekilli, bunga qobiliyati yo‘q...” degan fikr o‘tishi mumkin.' },
          { t: 'paragraph', text: 'Lekin bola bugun uddalay olmayotgan narsa uning imkoniyati chegarasi degani emas.' },
          { t: 'paragraph', text: 'Masaru Ibuka kitobida Shinichi Suzukining bolalarni o‘qitish tajribasini keltirib, juda keskin bir fikrni beradi:' },
          { t: 'quote', text: 'Qoloq bolalar yo‘q. Barchasi o‘qitish usuliga bog‘liq.', attribution: 'Masaru Ibuka', role: '“Uchdan keyin kech”' },
          { t: 'heading', level: 2, text: 'Bola emas, usul o‘zgarishi mumkin' },
          { t: 'paragraph', text: 'Demak, bola tushunmayotganida faqat undan ko‘proq harakat qilishni talab qilish emas, biz ham usulimizni o‘zgartirib ko‘rishimiz kerak.' },
          { t: 'paragraph', text: 'Bir tushuntirish ishlamadimi — boshqacha tushuntiring. Qiyin bo‘ldimi — kichik qismlarga ajrating. Ko‘rsatib bering, keyin birga bajaring. Xato qildimi — yana urinishi uchun vaqt bering.' },
          { t: 'heading', level: 2, text: 'Hukm bolaning ichki ovoziga aylanmasin' },
          { t: 'paragraph', text: 'Eng muhimi, bolaning oldida “Sen buni eplay olmaysan” yoki “Senda bunga qobiliyat yo‘q” degan hukmni aytishga shoshilmang.' },
          { t: 'paragraph', text: 'Chunki bola sizning u haqidagi fikringizni asta-sekin o‘zi haqidagi fikrga aylantirishi mumkin.' },
          { t: 'paragraph', text: 'Shuning uchun “Nega eplay olmayapti?” degan savol o‘rniga, avval boshqacha savol bering:' },
          { t: 'quote', text: 'Buni unga yana qanday yo‘l bilan tushuntirib ko‘rsam bo‘ladi?' },
          { t: 'paragraph', text: 'Ba’zan bolaga yetishmayotgan narsa qobiliyat emas.' },
          { t: 'paragraph', text: 'Shunchaki unga mos yo‘l hali topilmagan bo‘lishi mumkin.' },
        ],
      },
      en: {
        kicker: { label: 'BOOK INSIGHT', dateLabel: 'FOR PARENTS' },
        title: '“They just don’t have it in them...” Or maybe the right way hasn’t been found yet?',
        standfirst:
          'What a child can’t manage today isn’t the limit of their ability. Sometimes what’s needed isn’t more effort from them, but a different approach from us.',
        coverAlt:
          'A mother helps her son complete a task made of colourful shapes, one small step at a time.',
        author: 'TALIMOON editorial team',
        keyIdea:
          'Sometimes what a child is missing isn’t ability — it may simply be that the right way for them hasn’t been found yet.',
        blocks: [
          { t: 'paragraph', text: 'When your child learns something more slowly than others, the thought may cross your mind: “I guess they just don’t have it in them...”' },
          { t: 'paragraph', text: 'But what a child can’t manage today isn’t the limit of their ability.' },
          { t: 'paragraph', text: 'In his book, Masaru Ibuka cites Shinichi Suzuki’s experience teaching children and makes a strikingly direct point:' },
          { t: 'quote', text: 'There are no slow children. It all depends on the method of teaching.', attribution: 'Masaru Ibuka', role: 'Kindergarten Is Too Late' },
          { t: 'heading', level: 2, text: 'It’s the method that can change, not the child' },
          { t: 'paragraph', text: 'So when a child doesn’t understand, the answer isn’t just to demand more effort from them — we need to try changing our own approach too.' },
          { t: 'paragraph', text: 'If one explanation doesn’t work, try another. If it’s too hard, break it into smaller pieces. Show them, then do it together. If they make a mistake, give them time to try again.' },
          { t: 'heading', level: 2, text: 'Don’t let judgment become the child’s inner voice' },
          { t: 'paragraph', text: 'Most importantly, don’t be quick to say, in front of your child, “You can’t do this” or “You just don’t have it in you.”' },
          { t: 'paragraph', text: 'Because a child can slowly turn your opinion of them into their own opinion of themselves.' },
          { t: 'paragraph', text: 'So instead of asking, “Why can’t they manage this?” — ask a different question first:' },
          { t: 'quote', text: 'What other way could I try explaining this to them?' },
          { t: 'paragraph', text: 'Sometimes what a child is missing isn’t ability.' },
          { t: 'paragraph', text: 'It may simply be that the right way for them hasn’t been found yet.' },
        ],
      },
    },
  },
  {
    id: 'habits-handwashing-01',
    slug: 'qolimni-yuvdim-rostdan-ham-yuvdimi',
    world: 'wisdom-science',
    format: 'research-explainer',
    weight: 'feature',
    status: 'published',
    featured: false,
    publishedAtISO: '2026-09-05T19:00:00.000Z',
    tags: ['odatlar-va-ilm', 'salomatlik', 'qol-yuvish', 'bolalar', 'tadqiqot'],
    defaultLocale: 'uz',
    indexable: true,
    media: { consent: 'not-applicable' },
    cover: {
      id: 'habits-handwashing-cover-v2',
      src: '/images/journey/habits-handwashing-cover-v2.png',
      width: 1672,
      height: 941,
      credit: 'TALIMOON vizualizatsiyasi',
    },
    references: [
      {
        kind: 'organization',
        title: 'CDC — Handwashing Facts',
        url: 'https://www.cdc.gov/clean-hands/data-research/facts-stats/',
        note: 'Qo‘lning barcha yuzalarini sovunlab, kamida 20 soniya ishqalash bo‘yicha tavsiyalar.',
      },
      {
        kind: 'research',
        author: 'Nuhu Amin va hammualliflar',
        title: 'Microbiological Evaluation of the Efficacy of Soapy Water to Clean Hands: A Randomized, Non-Inferiority Field Trial',
        publisher: 'American Journal of Tropical Medicine and Hygiene',
        year: 2014,
        doi: '10.4269/ajtmh.13-0475',
      },
    ],
    relatedSlugs: [
      'hali-kichkina-keyin-organadi',
      'qobiliyati-otasiga-tortgan-rostdan-ham-shundaymi',
    ],
    translations: {
      uz: {
        kicker: { label: 'KUNDALIK ODAT · ILMIY IZOH', dateLabel: 'SALOMATLIK' },
        title: '“Qo‘limni yuvdim!” — Rostdan ham yuvdimi?',
        standfirst:
          'Qo‘lning ho‘l bo‘lishi uning toza bo‘lganini anglatmaydi. Bir oddiy savol bolaning kundalik odatini butunlay o‘zgartirishi mumkin.',
        coverAlt:
          'Besh yoshli bola onasi yonida qo‘llarini sovunlab, barmoqlari orasini yaxshilab yuvmoqda.',
        author: 'TALIMOON tahririyati',
        keyIdea:
          '“Qo‘lingni yuvdingmi?” deb so‘rashdan ham muhimroq savol bor: “Qo‘lingni qanday yuvding?”',
        blocks: [
          { t: 'paragraph', text: 'Bola tashqaridan keldi. Siz: “Qo‘lingni yuvdingmi?” deb so‘radingiz. “Ha!” degan javob tez keldi.' },
          { t: 'paragraph', text: 'Lekin ba’zan bu “yuvish” atigi bir necha soniya davom etadi: qo‘l suvga tutiladi, ikki kaft bir-biriga ishqalanadi — tamom.' },
          { t: 'quote', text: 'Muammo shundaki, qo‘lning ho‘l bo‘lishi uning toza bo‘lganini anglatmaydi.' },
          { t: 'heading', level: 2, text: 'Ko‘zga ko‘rinmaydigan joylar' },
          { t: 'paragraph', text: 'CDC ma’lumotlariga ko‘ra, mikroblar qo‘lning barcha yuzalarida bo‘lishi mumkin. Shuning uchun faqat kaft bilan cheklanmay, qo‘l usti, barmoqlar oralari va tirnoq atroflarini ham yaxshilab sovunlab ishqalash kerak.' },
          { t: 'fact', value: '3× / 20s', label: 'Har bir harakatni 3 marta takrorlang yoki butun jarayonni kamida 20 soniya davom ettiring.', note: 'Muhimi faqat vaqt emas — kaft, qo‘l usti, barmoqlar oralari va tirnoq atrofini qoldirmaslik.' },
          { t: 'heading', level: 2, text: 'Dhakadagi tajriba nimani ko‘rsatdi?' },
          { t: 'paragraph', text: 'Bangladeshning Dhaka shahrida onalar ishtirokida o‘tkazilgan randomizatsiyalangan dala tadqiqotida olimlar qo‘llardagi bakteriyalarni yuvishdan oldin va keyin tekshirdi.' },
          { t: 'paragraph', text: 'Hatto 15 soniya suv bilan ishqalashning o‘zi ham ayrim bakteriyalar miqdorini kamaytirdi. Ammo sovunli suv va oddiy sovun samaraliroq bo‘ldi. Bu bitta muhim farqni ko‘rsatadi: suv qo‘lni ho‘llaydi, sovun va ishqalanish esa kir hamda mikroblarni teridan ajratishga yordam beradi.' },
          { t: 'heading', level: 2, text: 'Bolaga “yuv” demang — jarayonni o‘rgating' },
          { t: 'paragraph', text: 'Bolaga uzoq ko‘rsatma berish shart emas. Har safar bir xil ketma-ketlikni qo‘llang: har bir harakatni 3 marta takrorlang yoki butun yuvish jarayonini kamida 20 soniya davom ettiring.' },
          {
            t: 'steps',
            label: 'TALIMOONNING 3 BOSQICHLI QOIDASI',
            items: [
              { title: 'Kaftlar', text: 'Ikki kaftni bir-biriga 3 marta yaxshilab ishqalang.' },
              { title: 'Qo‘l usti', text: 'Har ikki qo‘lning ustini navbat bilan 3 martadan tozalang.' },
              { title: 'Oralar va tirnoqlar', text: 'Barmoqlarni chalishtirib, oralarini hamda tirnoq atrofini 3 marta ishqalang.' },
            ],
          },
          { t: 'paragraph', text: 'So‘ng qo‘llarni toza oqar suvda yaxshilab chaying va quriting. Ayniqsa hojatxonadan keyin, ovqatdan oldin va tashqaridan kelganda bu ketma-ketlikni birgalikda takrorlang.' },
          { t: 'quote', text: '“Qo‘lingni yuvdingmi?” emas — “Qo‘lingni qanday yuvding?”' },
          { t: 'note', text: 'Bu maqola umumiy ma’rifiy maqsadda tayyorlangan. Dalillar va tavsiyalarning to‘liq matni quyidagi manbalarda keltirilgan.' },
        ],
      },
      en: {
        kicker: { label: 'EVERYDAY HABIT · THE SCIENCE', dateLabel: 'HEALTH' },
        title: '“I washed my hands!” — Did you really?',
        standfirst:
          'Wet hands don’t mean clean hands. One simple question can completely change a child’s daily habit.',
        coverAlt:
          'A five-year-old washes their hands with soap next to their mother, carefully cleaning between their fingers.',
        author: 'TALIMOON editorial team',
        keyIdea:
          'There’s a question more important than “Did you wash your hands?” — and that’s “How did you wash your hands?”',
        blocks: [
          { t: 'paragraph', text: 'Your child comes in from outside. You ask, “Did you wash your hands?” The answer comes quickly: “Yes!”' },
          { t: 'paragraph', text: 'But sometimes that “washing” lasts only a few seconds: hands under the water, palms rubbed together once — done.' },
          { t: 'quote', text: 'The problem is, wet hands don’t mean clean hands.' },
          { t: 'heading', level: 2, text: 'The spots you can’t see' },
          { t: 'paragraph', text: 'According to the CDC, germs can be present on every surface of the hand. So washing shouldn’t stop at the palms — the backs of the hands, between the fingers, and around the nails need a thorough scrub with soap too.' },
          { t: 'fact', value: '3× / 20s', label: 'Repeat each motion 3 times, or keep the whole process going for at least 20 seconds.', note: 'Timing alone isn’t the point — don’t skip the palms, the backs of the hands, between the fingers, or around the nails.' },
          { t: 'heading', level: 2, text: 'What did the Dhaka study show?' },
          { t: 'paragraph', text: 'In a randomized field trial with mothers in Dhaka, Bangladesh, researchers measured the bacteria on hands before and after washing.' },
          { t: 'paragraph', text: 'Even just 15 seconds of rubbing with water alone reduced some bacteria. But soapy water and plain soap were more effective. This points to one key difference: water wets the hands, while soap and rubbing help lift dirt and germs away from the skin.' },
          { t: 'heading', level: 2, text: 'Don’t just say “wash” — teach the process' },
          { t: 'paragraph', text: 'You don’t need to give a child a long list of instructions. Use the same sequence every time: repeat each motion 3 times, or keep the whole washing process going for at least 20 seconds.' },
          {
            t: 'steps',
            label: 'TALIMOON’S 3-STEP RULE',
            items: [
              { title: 'Palms', text: 'Rub both palms together firmly, 3 times.' },
              { title: 'Backs of the hands', text: 'Clean the back of each hand in turn, 3 times each.' },
              { title: 'Between fingers and nails', text: 'Interlace your fingers and scrub between them and around the nails, 3 times.' },
            ],
          },
          { t: 'paragraph', text: 'Then rinse your hands thoroughly under clean running water and dry them. Repeat this sequence together, especially after using the toilet, before eating, and after coming in from outside.' },
          { t: 'quote', text: 'Not “Did you wash your hands?” — but “How did you wash your hands?”' },
          { t: 'note', text: 'This article was prepared for general educational purposes. The full evidence and recommendations are available in the sources below.' },
        ],
      },
    },
  },
  {
    id: 'habits-hot-food-wait-02',
    slug: 'issiq-ovqatni-puflab-sovutish-oddiy-odatmi',
    world: 'wisdom-science',
    format: 'research-explainer',
    weight: 'feature',
    status: 'published',
    featured: false,
    publishedAtISO: '2026-09-05T19:30:00.000Z',
    tags: ['odatlar-va-ilm', 'ovqatlanish', 'gigiyena', 'bolalar', 'tadqiqot'],
    defaultLocale: 'uz',
    indexable: true,
    media: { consent: 'not-applicable' },
    cover: {
      id: 'habits-hot-food-wait-cover-v1',
      src: '/images/journey/habits-hot-food-wait-cover-v1.png',
      width: 1672,
      height: 941,
      credit: 'TALIMOON vizualizatsiyasi',
    },
    references: [
      {
        kind: 'research',
        author: 'Fathimah Fathimah, Lia Mustika va Inma Yunita Setyorini',
        title: 'Blowing on the Hot Food Increasing Bacteria Contamination',
        publisher: 'Darussalam Nutrition Journal',
        year: 2021,
        url: 'https://ejournal.unida.gontor.ac.id/index.php/nutrition/article/view/6539/9659',
      },
      {
        kind: 'research',
        author: 'Paul Dawson va hammualliflar',
        title: 'Bacterial Transfer Associated with Blowing Out Candles on a Birthday Cake',
        publisher: 'Journal of Food Research',
        year: 2017,
        doi: '10.5539/jfr.v6n4p1',
      },
    ],
    relatedSlugs: [
      'qolimni-yuvdim-rostdan-ham-yuvdimi',
      'hali-kichkina-keyin-organadi',
    ],
    translations: {
      uz: {
        kicker: { label: 'KUNDALIK ODAT · ILMIY IZOH', dateLabel: 'OVQATLANISH' },
        title: 'Issiq ovqatni puflab sovutish — oddiy odatmi?',
        standfirst:
          'Puflaganimizda ovqatga faqat havo bormaydi. Bir necha daqiqa kutish nega yaxshiroq odat ekanini ikki kichik tajriba orqali ko‘ramiz.',
        coverAlt:
          'Ona issiq ovqat oldida kutish ishorasini ko‘rsatmoqda; yuqori burchakdagi kichik kadr choyni puflamaslikni anglatadi.',
        author: 'TALIMOON tahririyati',
        keyIdea:
          'Puflamaymiz. Biroz kutamiz — sovisin.',
        blocks: [
          { t: 'paragraph', text: 'Issiq choy yoki ovqatni puflab sovutamiz. Ba’zan esa ota-ona bolaning qoshig‘idagi ovqatni puflab, keyin unga beradi.' },
          { t: 'quote', text: 'Ammo puflaganimizda ovqatga faqat havo bormaydi.' },
          { t: 'heading', level: 2, text: 'Muammo nimada?' },
          { t: 'paragraph', text: 'Nafas chiqarayotgan havoda karbonat angidrid, suv bug‘i va og‘iz hamda nafas yo‘llaridan chiqadigan mayda biologik zarrachalar mavjud. Ular bilan birga mikroorganizmlar ham oziq-ovqat yuzasiga ko‘chishi mumkin.' },
          { t: 'heading', level: 2, text: 'Olimlar nimani aniqlagan?' },
          { t: 'paragraph', text: 'Indoneziyada, University of Darussalam Gontor tadqiqotchilari aynan issiq ovqatning puflangan va puflanmagan namunalarini laboratoriyada solishtirishdi.' },
          { t: 'paragraph', text: '12 soatdan keyin puflangan namunada 1.3 × 10³ CFU/ml, puflanmagan namunada esa 1.3 × 10² CFU/ml bakteriya koloniyasi aniqlangan — taxminan 10 baravar farq. Farq statistik jihatdan ham ahamiyatli bo‘lgan (p=0.001).' },
          { t: 'fact', value: '10×', label: 'Puflangan namunada bakteriya koloniyalari ko‘proq aniqlandi.', note: 'University of Darussalam Gontor laboratoriya tadqiqoti · p=0.001' },
          { t: 'paragraph', text: 'AQShdagi Clemson University tajribasida esa odamlar tortdagi shamlarni puflagach, oziq-ovqat yuzasidagi bakteriyalar nazorat namunasiga nisbatan o‘rtacha 1 400% ga ko‘paygan. Tadqiqot puflash orqali og‘izdagi bioaerozollar oziq-ovqatga ko‘chishi mumkinligini ko‘rsatgan.' },
          { t: 'heading', level: 2, text: 'Nega bolalarda ehtiyot bo‘lish muhim?' },
          { t: 'paragraph', text: 'Kichik bolalarning immun tizimi hali rivojlanib boradi. Agar kasallik qo‘zg‘atuvchi mikroorganizm ovqatga ko‘chsa, ayrim oziq-ovqat infeksiyalari qusish, ich ketishi, qorin og‘rig‘i, isitma va suvsizlanishga olib kelishi mumkin.' },
          { t: 'paragraph', text: 'Bu har bir puflangan ovqat kasallik keltirib chiqaradi degani emas. Ammo keraksiz mikrobiologik ifloslanish xavfini oshirishning hojati ham yo‘q.' },
          { t: 'heading', level: 2, text: 'Yechim juda oddiy' },
          { t: 'paragraph', text: 'Farzandingizga uch narsani odat qildiring:' },
          {
            t: 'steps',
            label: 'UCHTA SODDA ODAT',
            items: [
              { title: 'O‘zi puflamasin', text: 'Issiq bo‘lsa, shoshilmasdan sovishini kutsin.' },
              { title: 'Boshqalarga puflatmasin', text: 'O‘z ovqatini boshqa odamga ham puflatmasin.' },
              { title: 'Puflanganini yemaslik', text: 'Puflangan ovqatni yemaslikni o‘rgansin.' },
            ],
          },
          { t: 'quote', text: 'Puflamaymiz. Biroz kutamiz — sovisin.' },
          { t: 'paragraph', text: 'Bir necha daqiqa kutish qiyin emas. Sog‘lom odatlar esa aynan shunday kichik qarorlardan boshlanadi.' },
        ],
      },
      en: {
        kicker: { label: 'EVERYDAY HABIT · THE SCIENCE', dateLabel: 'NUTRITION' },
        title: 'Blowing on hot food to cool it — just a harmless habit?',
        standfirst:
          'When we blow on food, it’s not just air that lands on it. Two small studies show why waiting a few minutes is the better habit.',
        coverAlt:
          'A mother makes a “wait” gesture in front of hot food; a small frame in the corner signals not blowing on tea.',
        author: 'TALIMOON editorial team',
        keyIdea:
          'We don’t blow on it. We wait a little — let it cool.',
        blocks: [
          { t: 'paragraph', text: 'We blow on hot tea or food to cool it down. Sometimes a parent blows on the food on a child’s spoon before handing it over.' },
          { t: 'quote', text: 'But when we blow on food, it’s not just air that lands on it.' },
          { t: 'heading', level: 2, text: 'What’s the problem?' },
          { t: 'paragraph', text: 'Exhaled breath carries carbon dioxide, water vapour, and tiny biological particles from the mouth and airways. Microorganisms can travel along with them onto the surface of the food.' },
          { t: 'heading', level: 2, text: 'What did researchers find?' },
          { t: 'paragraph', text: 'In Indonesia, researchers at the University of Darussalam Gontor compared blown-on and non-blown-on samples of hot food in the laboratory.' },
          { t: 'paragraph', text: 'After 12 hours, the blown-on sample showed 1.3 × 10³ CFU/ml, while the sample that wasn’t blown on showed 1.3 × 10² CFU/ml of bacterial colonies — roughly a tenfold difference. The difference was also statistically significant (p=0.001).' },
          { t: 'fact', value: '10×', label: 'More bacterial colonies were found in the blown-on sample.', note: 'University of Darussalam Gontor laboratory study · p=0.001' },
          { t: 'paragraph', text: 'In a Clemson University study in the US, after people blew out candles on a cake, bacteria on the food’s surface increased by an average of 1,400% compared to the control sample. The study showed that blowing can transfer oral bioaerosols onto food.' },
          { t: 'heading', level: 2, text: 'Why does caution matter more for children?' },
          { t: 'paragraph', text: 'Young children’s immune systems are still developing. If a disease-causing microorganism transfers onto food, certain foodborne infections can lead to vomiting, diarrhoea, stomach pain, fever, and dehydration.' },
          { t: 'paragraph', text: 'This doesn’t mean every blown-on meal will cause illness. But there’s no need to raise the risk of unnecessary microbiological contamination either.' },
          { t: 'heading', level: 2, text: 'The solution is simple' },
          { t: 'paragraph', text: 'Make three things a habit for your child:' },
          {
            t: 'steps',
            label: 'THREE SIMPLE HABITS',
            items: [
              { title: 'Don’t blow on it themselves', text: 'If it’s hot, wait patiently for it to cool.' },
              { title: 'Don’t let others blow on it', text: 'Don’t let anyone else blow on their food either.' },
              { title: 'Don’t eat food that’s been blown on', text: 'Learn not to eat food someone has blown on.' },
            ],
          },
          { t: 'quote', text: 'We don’t blow on it. We wait a little — let it cool.' },
          { t: 'paragraph', text: 'Waiting a few minutes isn’t hard. And healthy habits begin with exactly these kinds of small decisions.' },
        ],
      },
    },
  },
  {
    id: 'habits-daytime-nap-memory-03',
    slug: 'kunduzi-uxlash-vaqtni-yoqotishmi-yoki-miyaga-yordammi',
    world: 'wisdom-science',
    format: 'research-explainer',
    weight: 'feature',
    status: 'published',
    featured: false,
    publishedAtISO: '2026-09-06T08:00:00.000Z',
    tags: ['odatlar-va-ilm', 'uyqu', 'xotira', 'bolalar', 'miya', 'tadqiqot'],
    defaultLocale: 'uz',
    indexable: true,
    media: { consent: 'not-applicable' },
    cover: {
      id: 'habits-daytime-nap-memory-cover-v1',
      src: '/images/journey/habits-daytime-nap-memory-cover-v1.png',
      width: 1672,
      height: 941,
      credit: 'TALIMOON vizualizatsiyasi',
    },
    references: [
      {
        kind: 'research',
        author: 'Laura Kurdziel, Kasey Duclos va Rebecca M. C. Spencer',
        title: 'Sleep spindles in midday naps enhance learning in preschool children',
        publisher: 'Proceedings of the National Academy of Sciences (PNAS)',
        year: 2013,
        doi: '10.1073/pnas.1306418110',
        url: 'https://pubmed.ncbi.nlm.nih.gov/24062429/',
      },
      {
        kind: 'research',
        author: 'Ruth L. F. Leong, June C. Lo va Michael W. L. Chee',
        title: 'Systematic review and meta-analyses on the effects of afternoon napping on cognition',
        publisher: 'Sleep Medicine Reviews',
        year: 2022,
        doi: '10.1016/j.smrv.2022.101666',
        url: 'https://pubmed.ncbi.nlm.nih.gov/36041284/',
      },
      {
        kind: 'organization',
        title: 'Napping: Do’s and don’ts for healthy adults',
        publisher: 'Mayo Clinic',
        year: 2024,
        url: 'https://www.mayoclinic.org/healthy-lifestyle/adult-health/in-depth/napping/art-20048319',
      },
      {
        kind: 'organization',
        title: 'Healthy Sleep — Child 1 to 5 years',
        publisher: 'Healthier Together · NHS',
        url: 'https://www.healthiertogether.nhs.uk/child-under-5-years/healthy-sleep',
      },
      {
        kind: 'organization',
        title: 'Safer Sleep — 3–5 years',
        publisher: 'Wirral Community Health and Care NHS Foundation Trust',
        url: 'https://www.wchc.nhs.uk/resources/safer-sleep-3-5-years-leaflet/',
      },
    ],
    relatedSlugs: [
      'qolimni-yuvdim-rostdan-ham-yuvdimi',
      'issiq-ovqatni-puflab-sovutish-oddiy-odatmi',
    ],
    translations: {
      uz: {
        kicker: { label: 'KUNDALIK ODAT · ILMIY IZOH', dateLabel: 'UYQU VA XOTIRA' },
        title: 'Kunduzgi uyqu: bola qancha, katta qancha uxlashi kerak?',
        standfirst:
          'Kunduzgi uyqu foydali. Ammo uning foydasi yoshga mos vaqt va to‘g‘ri davomiylikda: kichik bolaga uzoqroq dam, kattaga esa qisqa mizg‘ish kerak.',
        coverAlt:
          'Kunduzgi yorug‘lik tushgan xonada bola kitoblar va chizgan rasmi yonida tinch uxlamoqda.',
        author: 'TALIMOON tahririyati',
        keyIdea:
          'Kichik bolaga yoshiga mos kunduzgi dam, kattaga 20–30 daqiqalik mizg‘ish: foydali uyquning kaliti — qancha va qachon uxlashda.',
        blocks: [
          { t: 'paragraph', text: 'Bola tushdan keyin uxlaydi, kechqurun esa yotishni istamaydi. Katta odam tushlikdan keyin mizg‘ib oladi, ammo ba’zan uyg‘ongach karaxt yuradi. Muammo kunduzgi uyquning o‘zida emas — uning vaqti va davomiyligida.' },
          { t: 'quote', text: 'Kunduzgi uyquni bekor qilish emas, uni yoshga mos boshqarish kerak.' },
          { t: 'heading', level: 2, text: 'Qisqa javob: kim qancha uxlashi kerak?' },
          {
            t: 'steps',
            label: 'KUNDUZGI UYQU BO‘YICHA AMALIY ME’YOR',
            items: [
              { title: '1–2 yosh: 1–3 soat', text: 'Bu yoshda bolalar odatda kunduz kuni bir marta uxlaydi. Uyquni tushdan keyin ertaroq, bir xil vaqtda tashkil qiling.' },
              { title: '3–5 yosh: ehtiyojga qarab', text: 'Uch yosh atrofida 30–60 daqiqalik kunduzgi uyqu yetarli bo‘ladi. Besh yoshga yaqin ko‘pchilik bola kunduzgi uyquni tabiiy ravishda tark etadi.' },
              { title: 'Kattalar: 20–30 daqiqa', text: 'Qisqa mizg‘ish hushyorlikni tiklaydi va karaxtlikni kamaytiradi. Uni tushdan keyin ertaroq, soat 15:00 gacha yakunlang.' },
            ],
          },
          { t: 'heading', level: 2, text: 'Kechasi uyqusi qochsa, nima qilamiz?' },
          { t: 'paragraph', text: 'Bola kunduzgi uyqudan keyin tetik uyg‘onsa va kechasi odatdagi vaqtda uxlasa — kunduzgi damni saqlang. Agar kechasi uxlashi qiyinlashsa, kunduzgi uyquni birdan bekor qilmang: avval ertaroqqa suring, keyin davomiyligini asta-sekin qisqartiring.' },
          { t: 'paragraph', text: 'Bola kunduz uxlamasa ham tetik bo‘lsa va kechga borib haddan tashqari charchamasa, uni majburan uxlatish kerak emas. Asosiy mezon — kunduzgi uyqudan keyingi holati va kechasi o‘z vaqtida uxlay olishidir.' },
          { t: 'heading', level: 2, text: 'Nega kunduzgi uyqu bolaga foyda beradi?' },
          { t: 'paragraph', text: 'AQShdagi University of Massachusetts Amherst tadqiqotchilari maktabgacha yoshdagi bolalarga ertalab xotira vazifasini o‘rgatdi. Keyin bolalar bir holatda kunduzi uxladi, boshqa holatda esa shu vaqtni uyg‘oq o‘tkazdi.' },
          { t: 'paragraph', text: 'Kunduzgi uyqudan keyin bolalar ertalab o‘rgangan ma’lumotlarini yaxshiroq eslab qoldi. Uyqu vaqtida qayd etilgan miya faolligi xotirani mustahkamlash jarayoni bilan bog‘landi.' },
          { t: 'quote', text: 'Bola uxlayotganda miyasi bekor turmaydi — kun davomida o‘rganganlarini xotirada mustahkamlaydi.' },
          { t: 'heading', level: 2, text: 'Kattalarda qisqa mizg‘ish nima beradi?' },
          { t: 'paragraph', text: 'National University of Singapore olimlari kunduzgi uyqu bo‘yicha 54 ta tadqiqotdagi 60 ta namunani birlashtirib tahlil qildi. Natijalar kunduzgi uyqu xotira, hushyorlik va axborotni qayta ishlash tezligini yaxshilashini ko‘rsatdi.' },
          { t: 'fact', value: '20–30', label: 'daqiqa — kattalar uchun hushyorlikni tiklaydigan va uyg‘ongandagi karaxtlikni kamaytiradigan kunduzgi mizg‘ish.', note: 'Mayo Clinic · kunduzning erta qismida, 15:00 gacha' },
          { t: 'heading', level: 2, text: 'TALIMOON qoidasi' },
          { t: 'quote', text: 'Bolada — yoshiga mos dam. Kattada — 20–30 daqiqa. Kechki uyqu buzilsa — kunduzgi uyquni ertaroqqa suring va qisqartiring.' },
          { t: 'paragraph', text: 'Kunduzgi uyqu vaqtni yo‘qotish emas. To‘g‘ri vaqt va davomiylikda u bolaga o‘rganganlarini mustahkamlashga, kattaga esa hushyorlik va aqliy faoliyatni tiklashga xizmat qiladi.' },
        ],
      },
      en: {
        kicker: { label: 'EVERYDAY HABIT · THE SCIENCE', dateLabel: 'SLEEP & MEMORY' },
        title: 'A daytime nap: wasted time, or help for the brain?',
        standfirst:
          'When a child sleeps, their brain doesn’t switch off. A daytime nap locks what they have learned into memory and prepares the brain for what comes next.',
        coverAlt:
          'In a room filled with daytime light, a child sleeps peacefully beside their books and a drawing.',
        author: 'TALIMOON editorial team',
        keyIdea:
          'A daytime nap isn’t lost time — it is exactly when the brain consolidates what it has just learned.',
        blocks: [
          { t: 'paragraph', text: 'By the middle of the day a child grows tired, their attention fades, their eyes start to close. It is the same for adults: after a few hours of work and focus, the brain asks for a rest.' },
          { t: 'paragraph', text: 'And yet we often tell a child, “Don’t sleep during the day, so you sleep well at night.”' },
          { t: 'quote', text: 'Is it better to force a tired brain to keep working, or to give it a little rest?' },
          { t: 'heading', level: 2, text: 'What is the problem?' },
          { t: 'paragraph', text: 'Through the day the brain takes in new information without pause. As fatigue builds, alertness and attention drop.' },
          { t: 'paragraph', text: 'Children learn new words, movements, images and skills every single day. Taking that information in is not enough on its own — the brain also has to consolidate it into memory.' },
          { t: 'heading', level: 2, text: 'In children the result is clear: sleep strengthens memory' },
          { t: 'paragraph', text: 'Researchers at the University of Massachusetts Amherst in the United States taught preschool-age children a memory task in the morning. The children then napped in one condition and stayed awake for the same length of time in the other.' },
          { t: 'paragraph', text: 'After the nap, the children remembered what they had learned that morning noticeably better. The brain activity recorded during sleep was linked to the process of consolidating memory.' },
          { t: 'quote', text: 'When a child is asleep, the brain does not pause its work — it strengthens what has been learned.' },
          { t: 'heading', level: 2, text: 'The benefit is confirmed in adults too' },
          { t: 'paragraph', text: 'Scientists at the National University of Singapore pooled 60 samples from 54 studies on daytime napping. The results showed that a daytime nap improves memory, alertness and the speed of processing information.' },
          { t: 'fact', value: '54', label: 'studies pooled: a daytime nap benefited memory, alertness and thinking speed.', note: 'Sleep Medicine Reviews · 2022 · 60 samples' },
          { t: 'heading', level: 2, text: 'The answer: do not deny the tiredness' },
          { t: 'paragraph', text: 'A daytime nap does not replace a night’s sleep. How much daytime sleep a child needs depends on their age and daily sleep pattern. But when a child is tired and their eyes are closing, keeping them awake by force is not the right answer.' },
          {
            t: 'steps',
            label: 'TALIMOON’S SIMPLE ANSWER',
            items: [
              { title: 'Notice the sign of sleepiness', text: 'When attention drops and the eyes start to close, do not read the tiredness as fussiness.' },
              { title: 'Create calm conditions', text: 'Quiet the room, soften the light, and give the child the chance to rest.' },
              { title: 'Keep the daily rhythm', text: 'Set the daytime rest at a steady hour that does not crowd out sleep at night.' },
            ],
          },
          { t: 'quote', text: 'A daytime nap is not lost time. It is the brain’s time to consolidate what it has learned and prepare for what comes next.' },
          { t: 'paragraph', text: 'For a child, that means remembering what they have learned more securely. For an adult, it means restoring alertness and mental sharpness. The answer is to give the brain the rest it needs in the middle of the day.' },
        ],
      },
      ru: {
        kicker: { label: 'ПОВСЕДНЕВНАЯ ПРИВЫЧКА · НАУКА', dateLabel: 'СОН И ПАМЯТЬ' },
        title: 'Дневной сон: потерянное время или помощь мозгу?',
        standfirst:
          'Когда ребёнок спит, его мозг не бездействует. Дневной сон закрепляет изученное в памяти и готовит мозг к следующей нагрузке.',
        coverAlt:
          'В комнате, наполненной дневным светом, ребёнок спокойно спит рядом со своими книгами и рисунком.',
        author: 'Редакция TALIMOON',
        keyIdea:
          'Дневной сон — это не потерянное время: именно в это время мозг закрепляет то, что только что выучил.',
        blocks: [
          { t: 'paragraph', text: 'К середине дня ребёнок устаёт, внимание рассеивается, глаза начинают слипаться. У взрослых так же: после нескольких часов работы и сосредоточенности мозг просит отдыха.' },
          { t: 'paragraph', text: 'И всё же ребёнку мы часто говорим: «Не спи днём — тогда будешь хорошо спать ночью».' },
          { t: 'quote', text: 'Что лучше — заставлять уставший мозг работать дальше или дать ему немного отдохнуть?' },
          { t: 'heading', level: 2, text: 'В чём проблема?' },
          { t: 'paragraph', text: 'В течение дня мозг без остановки принимает новую информацию. Чем больше накапливается усталость, тем сильнее падают бодрость и внимание.' },
          { t: 'paragraph', text: 'Дети каждый день учат новые слова, движения, образы и навыки. Просто принять эту информацию недостаточно — мозгу нужно ещё и закрепить её в памяти.' },
          { t: 'heading', level: 2, text: 'У детей результат очевиден: сон укрепляет память' },
          { t: 'paragraph', text: 'Исследователи из Массачусетского университета в Амхерсте (США) утром обучили детей дошкольного возраста задаче на запоминание. Затем в одном случае дети днём поспали, а в другом — провели столько же времени без сна.' },
          { t: 'paragraph', text: 'После дневного сна дети заметно лучше помнили то, что выучили утром. Активность мозга, зарегистрированная во время сна, была связана с процессом закрепления памяти.' },
          { t: 'quote', text: 'Когда ребёнок спит, мозг не прекращает работу — он закрепляет выученное.' },
          { t: 'heading', level: 2, text: 'У взрослых польза тоже подтверждена' },
          { t: 'paragraph', text: 'Учёные из Национального университета Сингапура объединили 60 выборок из 54 исследований дневного сна. Результаты показали, что дневной сон улучшает память, бодрость и скорость обработки информации.' },
          { t: 'fact', value: '54', label: 'исследования объединены: дневной сон улучшил память, бодрость и скорость мышления.', note: 'Sleep Medicine Reviews · 2022 · 60 выборок' },
          { t: 'heading', level: 2, text: 'Решение: не отрицайте усталость' },
          { t: 'paragraph', text: 'Дневной сон не заменяет ночной. Сколько дневного сна нужно ребёнку, зависит от его возраста и режима сна. Но когда ребёнок устал и у него слипаются глаза, удерживать его бодрствующим силой — не лучшее решение.' },
          {
            t: 'steps',
            label: 'ПРОСТОЕ РЕШЕНИЕ ОТ TALIMOON',
            items: [
              { title: 'Замечайте признак сонливости', text: 'Если внимание падает, а глаза слипаются, не принимайте усталость за капризы.' },
              { title: 'Создайте спокойную обстановку', text: 'Успокойте комнату, приглушите свет и дайте ребёнку возможность отдохнуть.' },
              { title: 'Держитесь режима дня', text: 'Организуйте дневной отдых в стабильное время, которое не вытесняет ночной сон.' },
            ],
          },
          { t: 'quote', text: 'Дневной сон — это не потерянное время. Это время, когда мозг закрепляет выученное и готовится к следующей нагрузке.' },
          { t: 'paragraph', text: 'Для ребёнка это значит надёжнее запоминать выученное. Для взрослого — восстановить бодрость и ясность ума. Решение — дать мозгу необходимый отдых в середине дня.' },
        ],
      },
    },
  },
];

/**
 * Real YAQIN KUNLAR pulse items not (yet) backed by a full entry.
 * EMPTY until there is something genuinely upcoming — never a
 * fabricated date.
 */
const PRODUCTION_PULSE: readonly PulseSeed[] = [];

/**
 * Fixtures are deliberately opt-in. This keeps placeholder cards out
 * of the real editorial pages during normal local review.
 */
const DEV = (() => {
  if (
    process.env.NODE_ENV !== 'development' ||
    process.env.NEXT_PUBLIC_JOURNEY_FIXTURES !== '1'
  ) {
    return { entries: [] as JourneyEntry[], pulse: [] as PulseSeed[] };
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const f = require('./dev-fixtures') as typeof import('./dev-fixtures');
  return { entries: [...f.DEV_FIXTURE_ENTRIES], pulse: [...f.DEV_FIXTURE_PULSE] };
})();

const ENTRIES: readonly JourneyEntry[] = [
  ...PRODUCTION_ENTRIES,
  ...DEV.entries,
];

const PULSE: readonly PulseSeed[] = [...PRODUCTION_PULSE, ...DEV.pulse];

// ── Config ─────────────────────────────────────────────────────────
/**
 * A `featured` entry older than this many days is still returned, but
 * flagged `source: 'featured-stale'` so THE OPENING can reframe it
 * ("Yaqinda…") or the caller can fall back to the newest entry. A
 * stale "NOW" is worse than an honest "recently".
 */
export const FEATURED_MAX_AGE_DAYS = 35;

/** How many stream entries the page renders before "Ko'proq ko'rish". */
export const STREAM_PAGE_SIZE = 8;

/** Pulse items more than this many days in the past are dropped. */
const PULSE_PAST_GRACE_DAYS = 2;

// ── Small helpers ──────────────────────────────────────────────────
const DAY_MS = 86_400_000;

function ageInDays(iso: string, now: Date): number {
  return (now.getTime() - new Date(iso).getTime()) / DAY_MS;
}

function byNewest(a: JourneyEntry, b: JourneyEntry): number {
  return (
    new Date(b.publishedAtISO).getTime() - new Date(a.publishedAtISO).getTime()
  );
}

/** Live on the site: real to visitors now, or kept as history. */
function isPublic(entry: JourneyEntry): boolean {
  return entry.status === 'published' || entry.status === 'archived';
}

/** In the active reverse-chronological stream (history is not). */
function isInStream(entry: JourneyEntry): boolean {
  return entry.status === 'published';
}

// ── Content resolution (multilingual + RTL ready) ──────────────────
export interface ResolvedContent {
  content: EntryContent;
  /** The locale actually used (may differ from the one requested). */
  locale: Locale;
  /** True when the requested locale was missing and we fell back. */
  isFallback: boolean;
  direction: Direction;
}

/**
 * The entry's content for a locale, falling back to its
 * `defaultLocale`, then to any translation that exists, then to an
 * empty body. Never throws — a live page must render something.
 */
export function resolveEntryContent(
  entry: JourneyEntry,
  locale: Locale,
): ResolvedContent {
  const exact = entry.translations[locale];
  if (exact) {
    return { content: exact, locale, isFallback: false, direction: directionFor(locale) };
  }
  const fallbackLocale = entry.defaultLocale;
  const fallback =
    entry.translations[fallbackLocale] ??
    Object.values(entry.translations)[0];
  if (fallback) {
    return {
      content: fallback,
      locale: fallbackLocale,
      isFallback: true,
      direction: directionFor(fallbackLocale),
    };
  }
  return {
    content: { blocks: [] },
    locale: entry.defaultLocale,
    isFallback: true,
    direction: directionFor(entry.defaultLocale),
  };
}

// ── Accessors — THE CMS SEAM ───────────────────────────────────────

/** Every public entry (published + archived), newest first. */
export function getJourneyIndex(): JourneyEntry[] {
  return ENTRIES.filter(isPublic).slice().sort(byNewest);
}

export interface StreamPage {
  entries: JourneyEntry[];
  total: number;
  hasMore: boolean;
}

/**
 * A window into the active stream (published only, newest first).
 * By default it MIXES all three worlds and excludes the current
 * OPENING + PARENT FEATURE entries so nothing shows twice. Pass
 * `world` to scope it (used by the `/journey/<world>` landings) —
 * scoped views do NOT exclude the opening/feature.
 */
export function getStreamEntries(
  opts: {
    offset?: number;
    limit?: number;
    world?: JourneyWorld;
    excludePromoted?: boolean;
  } = {},
): StreamPage {
  const offset = Math.max(0, opts.offset ?? 0);
  const limit = Math.max(0, opts.limit ?? STREAM_PAGE_SIZE);

  let all = ENTRIES.filter(isInStream);

  if (opts.world) {
    all = all.filter((e) => e.world === opts.world);
  } else if (opts.excludePromoted !== false) {
    const excluded = new Set<string>();
    const f = getFeaturedEntry()?.entry.id;
    if (f) excluded.add(f);
    const p = getParentFeature()?.id;
    if (p) excluded.add(p);
    all = all.filter((e) => !excluded.has(e.id));
  }

  all = all.slice().sort(byNewest);

  return {
    entries: all.slice(offset, offset + limit),
    total: all.length,
    hasMore: offset + limit < all.length,
  };
}

/**
 * The one `parents` entry for the landing's PARENT FEATURE slot.
 * Editorial pin (`parentFeature: true`) wins, else the newest
 * `parents` entry. `null` when there is no parents content yet.
 */
export function getParentFeature(now: Date = new Date()): JourneyEntry | null {
  const parents = ENTRIES.filter(
    (e) => isInStream(e) && e.world === 'parents',
  ).sort(byNewest);
  if (parents.length === 0) return null;
  void now;
  return parents.find((e) => e.parentFeature) ?? parents[0];
}

/** Entries for one world (public: published + archived), newest first. */
export function getWorldEntries(world: JourneyWorld): JourneyEntry[] {
  return ENTRIES.filter((e) => isPublic(e) && e.world === world).sort(byNewest);
}

/** Per-world count of public entries — for the editorial gateways. */
export function getWorldCounts(): Record<JourneyWorld, number> {
  return {
    'talimoon-life': getWorldEntries('talimoon-life').length,
    parents: getWorldEntries('parents').length,
    'wisdom-science': getWorldEntries('wisdom-science').length,
  };
}

/**
 * Everything the landing's THREE WORLDS portal needs for one world,
 * in one call. `primary` is the newest public entry (fills the main
 * media + latest-headline slots); `secondary` is the next one (fills
 * the small overlapping media / fragment slot). Both are `null` until
 * real content exists — the portal then renders its prepared
 * empty-state frames, never invented volume.
 */
export interface WorldPreview {
  world: JourneyWorld;
  count: number;
  primary: JourneyEntry | null;
  secondary: JourneyEntry | null;
}

export function getWorldPreview(world: JourneyWorld): WorldPreview {
  const all = getWorldEntries(world);
  return {
    world,
    count: all.length,
    primary: all[0] ?? null,
    secondary: all[1] ?? null,
  };
}

export function getWorldPreviews(): Record<JourneyWorld, WorldPreview> {
  return {
    'talimoon-life': getWorldPreview('talimoon-life'),
    parents: getWorldPreview('parents'),
    'wisdom-science': getWorldPreview('wisdom-science'),
  };
}

export type FeaturedSource = 'featured' | 'featured-stale' | 'newest';

export interface FeaturedResult {
  entry: JourneyEntry;
  source: FeaturedSource;
}

/**
 * THE OPENING entry. An editorial `featured` pin wins; if that pin
 * is older than `FEATURED_MAX_AGE_DAYS` it is still returned but
 * flagged `featured-stale`. With no pin at all, the newest published
 * entry stands in. `null` only when nothing is published.
 */
export function getFeaturedEntry(now: Date = new Date()): FeaturedResult | null {
  const published = ENTRIES.filter(isInStream).sort(byNewest);
  if (published.length === 0) return null;

  const pinned = published.filter((e) => e.featured);
  if (pinned.length > 0) {
    const entry = pinned[0];
    const stale = ageInDays(entry.publishedAtISO, now) > FEATURED_MAX_AGE_DAYS;
    return { entry, source: stale ? 'featured-stale' : 'featured' };
  }
  return { entry: published[0], source: 'newest' };
}

/** One entry by slug — public or not (route guards decide visibility). */
export function getEntryBySlug(slug: string): JourneyEntry | undefined {
  return ENTRIES.find((e) => e.slug === slug);
}

/**
 * Slugs that get a stable detail page — published and archived only
 * (`generateStaticParams`). Draft / scheduled entries have no route.
 */
export function publishedJourneySlugs(): string[] {
  return ENTRIES.filter(isPublic).map((e) => e.slug);
}

/**
 * "HAYOT DAVOM ETADI" — genuinely related entries for the end of a
 * detail page. Editorial `relatedSlugs` first (still-public only),
 * then entries sharing a tag, then most-recent; never the entry
 * itself, capped at `limit`.
 */
export function getRelatedEntries(
  entry: JourneyEntry,
  limit = 3,
): JourneyEntry[] {
  const pool = getJourneyIndex().filter((e) => e.id !== entry.id);
  const picked: JourneyEntry[] = [];
  const take = (e: JourneyEntry) => {
    if (picked.length < limit && !picked.some((p) => p.id === e.id)) picked.push(e);
  };

  for (const slug of entry.relatedSlugs ?? []) {
    const match = pool.find((e) => e.slug === slug);
    if (match) take(match);
  }
  if (picked.length < limit) {
    for (const e of pool) {
      if (e.tags.some((t) => entry.tags.includes(t))) take(e);
    }
  }
  if (picked.length < limit) {
    for (const e of pool) take(e);
  }
  return picked;
}

export type CampaignState = 'upcoming' | 'active' | 'ended';

/**
 * A campaign's state, derived from its window vs. now — never
 * stored, so an ended campaign can't keep claiming to be open.
 * `null` for entries that are not campaigns.
 */
export function campaignState(
  entry: JourneyEntry,
  now: Date = new Date(),
): CampaignState | null {
  const c = entry.campaign;
  if (!c) return null;
  const t = now.getTime();
  if (t < new Date(c.startISO).getTime()) return 'upcoming';
  if (t > new Date(c.endISO).getTime()) return 'ended';
  return 'active';
}

// ── YAQIN KUNLAR ───────────────────────────────────────────────────
function pulseText(
  map: Partial<Record<Locale, string>>,
  locale: Locale,
): string {
  return map[locale] ?? map.uz ?? map.en ?? Object.values(map)[0] ?? '';
}

/**
 * The forward pulse for a locale: upcoming + today items, plus any
 * item from the last couple of days for context, oldest→newest.
 * Returns `[]` when there is nothing meaningful ahead — the YAQIN
 * KUNLAR band renders nothing in that case (never a placeholder).
 */
export function getPulse(
  locale: Locale = 'uz',
  now: Date = new Date(),
): PulseItem[] {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  return PULSE.map((seed) => {
    const when = new Date(seed.dateISO);
    const daysFromToday = (when.getTime() - startOfToday.getTime()) / DAY_MS;
    const state: PulseItem['state'] =
      daysFromToday >= 1 ? 'upcoming' : daysFromToday > -1 ? 'today' : 'past';
    return {
      id: seed.id,
      dateISO: seed.dateISO,
      strand: seed.strand,
      label: pulseText(seed.label, locale),
      title: pulseText(seed.title, locale),
      href: seed.href,
      state,
    };
  })
    .filter(
      (item) =>
        item.state !== 'past' ||
        ageInDays(item.dateISO, now) <= PULSE_PAST_GRACE_DAYS,
    )
    .sort(
      (a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime(),
    );
}

// ── Privacy policy helper ──────────────────────────────────────────
/**
 * What a renderer may do with this entry's media.
 *
 *  • `showMedia`  — may the `cover` / gallery images be rendered at
 *    all? `false` for `consent: 'none'` (people present, no consent):
 *    the renderer must fall back to a non-photographic treatment.
 *  • `showPeople` — may recognisable faces be shown? Only ever `true`
 *    for `consent: 'granted'`. For `'not-applicable'` (no people in
 *    the frame) the media is shown but this stays `false` because
 *    there is nothing to permit.
 *
 * Consult this before rendering any photograph in HAYOT. Do not
 * weaken it for visual polish.
 */
export function mediaPolicy(entry: JourneyEntry): {
  showMedia: boolean;
  showPeople: boolean;
} {
  switch (entry.media.consent) {
    case 'granted':
      return { showMedia: true, showPeople: true };
    case 'not-applicable':
      return { showMedia: true, showPeople: false };
    case 'none':
    default:
      return { showMedia: false, showPeople: false };
  }
}

/**
 * Whether HAYOT currently has ANY public content (entries or pulse).
 * The page still renders its full structure when this is false — the
 * movements show intentional empty states, not a broken page.
 */
export function hasJourneyContent(): boolean {
  return getJourneyIndex().length > 0 || getPulse().length > 0;
}

/* The exact shape of every format and block type is in
 * `dev-fixtures.ts` — use it as the reference when adding real
 * entries to `PRODUCTION_ENTRIES`. */
