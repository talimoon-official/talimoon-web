import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { LegalDocument, type LegalCopy } from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Privacy Policy — TALIMOON",
  description:
    "How TALIMOON collects, uses, and protects the information you share when you order a personalized children's book.",
};

/**
 * /privacy — public, no login. Server component (so it can carry
 * `metadata`); the bilingual body renders through the shared
 * client-side <LegalDocument>. Footer mirrors the About page:
 * no commercial pre-footer CTA, and no #how-it-works anchor exists
 * on this route.
 */

const EN: LegalCopy = {
  title: "Privacy Policy",
  effectiveLabel: "Effective date",
  effectiveDate: "7 September 2026",
  intro: [
    "TALIMOON ('TALIMOON', 'we', or 'us') creates personalized children's books and related storytelling products. This Privacy Policy explains what information we collect when you order from us or use our website, why we use it, and the choices you have.",
    "Please read it together with our Terms of Service.",
  ],
  sections: [
    {
      heading: "Who we are",
      blocks: [
        {
          kind: "p",
          text: "TALIMOON is operated by Talimoon MCHJ, state registration number 856745, registered at Sebzor 2, building 16, Tashkent, Uzbekistan. We design and produce personalized children's books and storytelling products.",
        },
        {
          kind: "p",
          text: "For any question about this policy or your information, contact Sh.yunusov@talimoon.com.",
        },
      ],
    },
    {
      heading: "Information you provide",
      blocks: [
        {
          kind: "p",
          text: "When you place an order or contact us, you may give us:",
        },
        {
          kind: "list",
          items: [
            "Contact information — the name, phone number, email address, messaging handle, and delivery address of the person placing the order.",
            "The child's first name and age.",
            "The child's interests, favourite things, and preferences.",
            "Personality traits, family context, and other background you choose to share so the story feels personal.",
            "Photographs of the child that you upload for illustration reference.",
            "Photographs and details of additional characters (for example a parent, sibling, or friend) that you choose to include.",
            "Order and delivery information — what you ordered, delivery choices, and the payment confirmation details you send us.",
            "Consent record — the adult orderer's typed electronic signature, acceptance time, interface language, and the versions of the Privacy Policy and Terms accepted. TALIMOON does not attach an IP address to this consent record.",
            "Communications — messages, questions, and feedback you send us about an order.",
          ],
        },
        {
          kind: "p",
          text: "Please share only what is needed to create the book, and do not send us sensitive information that we have not asked for.",
        },
      ],
    },
    {
      heading: "Website data, IP addresses, and local storage",
      blocks: [
        {
          kind: "p",
          text: "TALIMOON's website application does not place your IP address in an order profile, the shared feedback counter, or browser storage. We do not build advertising profiles from IP addresses and we do not maintain a separate customer IP database.",
        },
        {
          kind: "p",
          text: "An IP address is nevertheless transmitted as part of every normal Internet connection. Our hosting and security providers — currently including Vercel and Cloudflare Turnstile — may process IP address, request time, requested page, browser or device information, and security signals to deliver the site, diagnose faults, prevent abuse, and verify that an order is submitted by a person. Their infrastructure logs and retention are governed by their own service terms and privacy notices. We therefore do not make the inaccurate claim that an IP address never reaches or is never temporarily retained by Internet infrastructure.",
        },
        {
          kind: "p",
          text: "We do not use advertising cookies or third-party advertising pixels. The site stores limited first-party preferences on your device, such as language and market selection, reading progress, an anonymous random reaction identifier and reaction choices, and whether an app-install prompt was dismissed. These values remain in your browser and can be removed through your browser's site-data controls. They are not derived from your IP address or device fingerprint.",
        },
        {
          kind: "p",
          text: "If you choose the optional delivery-location feature, your browser asks for permission first. Precise coordinates are requested only after your action and are sent with the order solely to help delivery; they are not collected during ordinary browsing.",
        },
      ],
    },
    {
      heading: "Why we use your information",
      blocks: [
        { kind: "p", text: "We use the information above to:" },
        {
          kind: "list",
          items: [
            "create the personalized book you ordered;",
            "prepare the illustrations, text, and story content for that book;",
            "process, confirm, and manage your order;",
            "communicate with you about your order, including questions and updates;",
            "arrange production, printing, and delivery, and provide customer support;",
            "keep operational records and protect the security and integrity of our service.",
          ],
        },
        {
          kind: "p",
          text: "We use your information for these purposes only. We do not use children's photographs or personal details for advertising, or for any purpose unrelated to your order.",
        },
        {
          kind: "p",
          text: "Depending on the context and applicable law, we process this information to perform the order you ask us to fulfil, on the basis of your consent for optional features such as precise delivery location, to meet legal obligations, and for our legitimate interests in providing support, preventing fraud, and securing the service. You may withdraw consent for future optional processing by contacting us, without affecting processing already lawfully completed.",
        },
      ],
    },
    {
      heading: "Children's information",
      blocks: [
        {
          kind: "p",
          text: "Our products are ordered by an adult — a parent, guardian, or another adult authorized to act for the child.",
        },
        {
          kind: "list",
          items: [
            "By placing an order, you confirm that you are that adult, or that you have permission from them.",
            "You confirm that you have the authority to share the child's name, age, details, and photographs with us for the purpose of creating the order.",
            "We use a child's information only to create and fulfill the personalized product or service that was ordered, and for the related support and record-keeping described in this policy.",
          ],
        },
        {
          kind: "p",
          text: "If you believe a child's information has been shared with us without proper authority, contact us at hello@talimoon.com and we will review it and, where appropriate, delete it.",
        },
      ],
    },
    {
      heading: "Storage and service providers",
      blocks: [
        {
          kind: "p",
          text: "We operate our service with the help of trusted third-party providers — for example cloud hosting and file-storage services, messaging and email tools, printing partners, and delivery couriers.",
        },
        {
          kind: "p",
          text: "Photographs and order details you send us may be stored on reputable cloud-storage services (which may include services such as Google Drive) so our team can produce your book. These providers process the information on our behalf and under our instructions.",
        },
        {
          kind: "p",
          text: "For security reasons, we do not describe our internal technical setup here.",
        },
      ],
    },
    {
      heading: "Sharing your information",
      blocks: [
        {
          kind: "p",
          text: "We do not sell your personal information, and we do not share it with third parties for their own marketing.",
        },
        { kind: "p", text: "We share information only:" },
        {
          kind: "list",
          items: [
            "with the service providers described above, and only as needed for them to help us operate the service and fulfill your order;",
            "when you ask us to, or with your consent;",
            "when required by law, legal process, or a valid request from a public authority;",
            "to establish, exercise, or defend legal claims, or to protect the rights, safety, and property of TALIMOON, our customers, or others.",
          ],
        },
      ],
    },
    {
      heading: "How long we keep information",
      blocks: [
        {
          kind: "p",
          text: "We keep your information only for as long as is reasonably necessary to:",
        },
        {
          kind: "list",
          items: [
            "create and deliver your order;",
            "provide customer support and handle any questions or disputes;",
            "meet operational, accounting, and legal requirements.",
            "document the order instructions and consent received.",
          ],
        },
        {
          kind: "p",
          text: "When we no longer need the information, we take reasonable steps to delete it or remove its connection to you. If you would like us to delete information sooner, contact us and we will do so where we are not required to keep it.",
        },
      ],
    },
    {
      heading: "Security",
      blocks: [
        {
          kind: "p",
          text: "We use technical and organizational measures that are intended to protect the information you share with us against loss, misuse, and unauthorized access. No method of transmission or storage can be guaranteed to be completely secure, but we work to protect your information and to limit access to those who need it to do their work.",
        },
        {
          kind: "list",
          items: [
            "encrypted HTTPS transport and restrictive browser security headers;",
            "bot protection on the order submission flow;",
            "short-lived, order-specific authorization for file uploads instead of public upload access;",
            "no advertising tracker or IP-based customer profile in TALIMOON's application code;",
            "access limited to people and providers who need the information to fulfil the order or support the service.",
          ],
        },
      ],
    },
    {
      heading: "Your choices and requests",
      blocks: [
        {
          kind: "p",
          text: "You may contact us at hello@talimoon.com to:",
        },
        {
          kind: "list",
          items: [
            "ask what information we hold about you or your child;",
            "ask us to correct information that is wrong or out of date;",
            "ask us to delete information, subject to any records we are required or reasonably need to keep.",
          ],
        },
        {
          kind: "p",
          text: "We will respond within a reasonable time, and we may need to confirm your identity and your relationship to the child before we act.",
        },
      ],
    },
    {
      heading: "Third-party services",
      blocks: [
        {
          kind: "p",
          text: "Some parts of the experience depend on outside companies — for example payment providers, messaging platforms, and delivery services. When you use those services, or when we pass limited information to them to complete your order, their own privacy practices apply to what they do with it. We encourage you to read their policies.",
        },
      ],
    },
    {
      heading: "Changes to this policy",
      blocks: [
        {
          kind: "p",
          text: "We may update this Privacy Policy from time to time. When we do, we will change the effective date at the top of this page. If the changes are significant, we will take reasonable steps to let customers with active orders know.",
        },
      ],
    },
    {
      heading: "Contact us",
      blocks: [
        {
          kind: "p",
          text: "If you have any question about this Privacy Policy or about how your information is handled, contact us at hello@talimoon.com.",
        },
      ],
    },
  ],
};

const UZ: LegalCopy = {
  title: "Maxfiylik siyosati",
  effectiveLabel: "Kuchga kirgan sana",
  effectiveDate: "2026-yil 7-sentabr",
  intro: [
    "TALIMOON ('TALIMOON', 'biz') bolalar uchun shaxsiylashtirilgan kitoblar va u bilan bog'liq hikoya mahsulotlarini yaratadi. Ushbu Maxfiylik siyosati siz buyurtma berganingizda yoki veb-saytimizdan foydalanganingizda qanday ma'lumotlarni to'plashimizni, ulardan nima uchun foydalanishimizni va sizda qanday tanlov borligini tushuntiradi.",
    "Iltimos, uni Foydalanish shartlari bilan birga o'qing.",
  ],
  sections: [
    {
      heading: "Biz kimmiz",
      blocks: [
        {
          kind: "p",
          text: "TALIMOON xizmatini O‘zbekistonda Toshkent shahar, Sebzor 2, uy 16 manzilida ro‘yxatdan o‘tgan, davlat ro‘yxat raqami 856745 bo‘lgan Talimoon MCHJ boshqaradi. Biz bolalar uchun shaxsiylashtirilgan kitoblar va hikoya mahsulotlarini yaratamiz.",
        },
        {
          kind: "p",
          text: "Ushbu siyosat yoki ma’lumotlaringiz bo‘yicha savollar uchun Sh.yunusov@talimoon.com manziliga yozing.",
        },
      ],
    },
    {
      heading: "Siz taqdim etadigan ma'lumotlar",
      blocks: [
        {
          kind: "p",
          text: "Buyurtma berganingizda yoki biz bilan bog'langaningizda siz quyidagilarni taqdim etishingiz mumkin:",
        },
        {
          kind: "list",
          items: [
            "Aloqa ma'lumotlari — buyurtma beruvchi shaxsning ismi, telefon raqami, elektron pochta manzili, messenjerdagi manzili va yetkazib berish manzili.",
            "Bolaning ismi va yoshi.",
            "Bolaning qiziqishlari, yoqtirgan narsalari va afzalliklari.",
            "Hikoya shaxsiy chiqishi uchun siz ulashishni istagan xarakter xususiyatlari, oilaviy vaziyat va boshqa ma'lumotlar.",
            "Rasm chizishda namuna sifatida foydalanish uchun siz yuklaydigan bola fotosuratlari.",
            "Buyurtmaga qo'shishni istagan qo'shimcha qahramonlarning (masalan, ota-ona, aka-uka yoki do'stning) fotosuratlari va ma'lumotlari.",
            "Buyurtma va yetkazib berish ma'lumotlari — nima buyurtma qilganingiz, yetkazib berish tanlovlari va siz yuboradigan to'lov tasdig'i.",
            "Rozilik qaydi — voyaga yetgan buyurtmachining kiritgan elektron imzosi, rozilik vaqti, interfeys tili hamda qabul qilingan Maxfiylik siyosati va Shartlar versiyalari. TALIMOON bu rozilik qaydiga IP-manzilni biriktirmaydi.",
            "Yozishmalar — buyurtma yuzasidan bizga yo'llagan xabarlar, savollar va fikr-mulohazalar.",
          ],
        },
        {
          kind: "p",
          text: "Iltimos, faqat kitobni yaratish uchun zarur bo'lgan ma'lumotlarni ulashing va biz so'ramagan maxfiy ma'lumotlarni yubormang.",
        },
      ],
    },
    {
      heading: "Sayt ma'lumotlari, IP manzil va qurilmadagi saqlash",
      blocks: [
        {
          kind: "p",
          text: "TALIMOON saytining o'z dasturiy kodi IP manzilingizni buyurtma profiliga, umumiy fikr-mulohaza hisoblagichiga yoki brauzer xotirasiga yozmaydi. Biz IP manzillar asosida reklama profili tuzmaymiz va mijozlarning IP manzillari uchun alohida ma'lumotlar bazasini yuritmaymiz.",
        },
        {
          kind: "p",
          text: "Shunga qaramay, IP manzil har qanday oddiy internet ulanishining texnik qismi sifatida uzatiladi. Saytni yetkazib berish, nosozliklarni aniqlash, suiiste'molning oldini olish va buyurtmani inson yuborayotganini tekshirish uchun hosting va xavfsizlik provayderlarimiz — hozirda Vercel va Cloudflare Turnstile — IP manzil, so'rov vaqti, ochilgan sahifa, brauzer yoki qurilma ma'lumoti hamda xavfsizlik signallarini qayta ishlashi mumkin. Ularning infratuzilma loglari va saqlash muddati o'z xizmat shartlari va maxfiylik qoidalari bilan boshqariladi. Shu sabab biz IP manzil internet infratuzilmasiga umuman yetib bormaydi yoki hech qachon vaqtincha saqlanmaydi, degan noto'g'ri va'dani bermaymiz.",
        },
        {
          kind: "p",
          text: "Biz reklama cookie-fayllari yoki uchinchi tomon reklama piksellaridan foydalanmaymiz. Sayt qurilmangizda faqat cheklangan birinchi tomon sozlamalarini saqlaydi: til va hudud tanlovi, kitob o'qish jarayoni, tasodifiy yaratilgan anonim reaksiya identifikatori va tanlovlari hamda ilovani o'rnatish taklifi yopilgan vaqt. Bu qiymatlar brauzeringizda qoladi va brauzerning sayt ma'lumotlari sozlamasi orqali o'chirilishi mumkin. Ular IP manzilingizdan yoki qurilma fingerprintidan olinmaydi.",
        },
        {
          kind: "p",
          text: "Yetkazib berish uchun ixtiyoriy lokatsiya funksiyasini tanlasangiz, avval brauzer Sizdan ruxsat so'raydi. Aniq koordinatalar faqat Sizning harakatingizdan keyin olinadi va faqat yetkazib berishni osonlashtirish maqsadida buyurtma bilan yuboriladi; oddiy sayt ko'rish jarayonida lokatsiya yig'ilmaydi.",
        },
      ],
    },
    {
      heading: "Ma'lumotlardan nima uchun foydalanamiz",
      blocks: [
        {
          kind: "p",
          text: "Yuqoridagi ma'lumotlardan biz quyidagi maqsadlarda foydalanamiz:",
        },
        {
          kind: "list",
          items: [
            "siz buyurtma qilgan shaxsiylashtirilgan kitobni yaratish;",
            "o'sha kitob uchun rasmlar, matn va hikoya mazmunini tayyorlash;",
            "buyurtmangizni qabul qilish, tasdiqlash va boshqarish;",
            "buyurtmangiz yuzasidan siz bilan bog'lanish, jumladan savollar va yangiliklar;",
            "ishlab chiqarish, chop etish va yetkazib berishni tashkil qilish hamda mijozlarni qo'llab-quvvatlash;",
            "operatsion yozuvlarni yuritish va xizmatimizning xavfsizligi hamda yaxlitligini himoya qilish.",
          ],
        },
        {
          kind: "p",
          text: "Biz ma'lumotlaringizdan faqat shu maqsadlarda foydalanamiz. Bolalarning fotosuratlari va shaxsiy ma'lumotlaridan reklama uchun yoki buyurtmangizga aloqador bo'lmagan hech qanday maqsadda foydalanmaymiz.",
        },
        {
          kind: "p",
          text: "Vaziyat va qo'llaniladigan qonunga qarab, ma'lumotlarni Siz so'ragan buyurtmani bajarish uchun, aniq yetkazib berish lokatsiyasi kabi ixtiyoriy funksiyalar bo'yicha roziligingiz asosida, qonuniy majburiyatlarni bajarish uchun hamda mijozlarni qo'llab-quvvatlash, firibgarlikning oldini olish va xizmatni himoyalashdagi qonuniy manfaatlarimiz uchun qayta ishlaymiz. Kelgusidagi ixtiyoriy qayta ishlashga berilgan rozilikni biz bilan bog'lanib qaytarib olishingiz mumkin; bu avval qonuniy bajarilgan amallarga ta'sir qilmaydi.",
        },
      ],
    },
    {
      heading: "Bolalar haqidagi ma'lumotlar",
      blocks: [
        {
          kind: "p",
          text: "Mahsulotlarimiz voyaga yetgan shaxs — ota-ona, vasiy yoki bola nomidan ish yuritishga vakolatli boshqa kattalar tomonidan buyurtma qilinadi.",
        },
        {
          kind: "list",
          items: [
            "Buyurtma berish orqali siz o'sha shaxs ekanligingizni yoki undan ruxsat olganingizni tasdiqlaysiz.",
            "Siz bolaning ismi, yoshi, ma'lumotlari va fotosuratlarini buyurtmani yaratish maqsadida biz bilan ulashishga vakolatingiz borligini tasdiqlaysiz.",
            "Biz bola haqidagi ma'lumotlardan faqat buyurtma qilingan shaxsiylashtirilgan mahsulot yoki xizmatni yaratish va yetkazib berish uchun, shuningdek ushbu siyosatda tavsiflangan qo'llab-quvvatlash va yozuvlarni yuritish uchun foydalanamiz.",
          ],
        },
        {
          kind: "p",
          text: "Agar bola haqidagi ma'lumot tegishli vakolatsiz biz bilan ulashilgan deb hisoblasangiz, hello@talimoon.com orqali bog'laning — biz uni ko'rib chiqamiz va zarur bo'lsa, o'chirib tashlaymiz.",
        },
      ],
    },
    {
      heading: "Saqlash va xizmat ko'rsatuvchi hamkorlar",
      blocks: [
        {
          kind: "p",
          text: "Biz xizmatimizni ishonchli uchinchi tomon provayderlari yordamida yuritamiz — masalan, bulutli hosting va fayl saqlash xizmatlari, xabar almashish va elektron pochta vositalari, chop etish hamkorlari va yetkazib berish kuryerlari.",
        },
        {
          kind: "p",
          text: "Siz yuboradigan fotosuratlar va buyurtma ma'lumotlari jamoamiz kitobingizni tayyorlashi uchun obro'li bulutli saqlash xizmatlarida (jumladan, Google Drive kabi xizmatlarda) saqlanishi mumkin. Bu provayderlar ma'lumotlarni bizning nomimizdan va ko'rsatmalarimiz asosida qayta ishlaydi.",
        },
        {
          kind: "p",
          text: "Xavfsizlik sabablariga ko'ra biz bu yerda ichki texnik tuzilmamizni tavsiflamaymiz.",
        },
      ],
    },
    {
      heading: "Ma'lumotlarni ulashish",
      blocks: [
        {
          kind: "p",
          text: "Biz shaxsiy ma'lumotlaringizni sotmaymiz va uni uchinchi tomonlarga ularning o'z reklama maqsadlari uchun bermaymiz.",
        },
        { kind: "p", text: "Biz ma'lumotlarni faqat quyidagi hollarda ulashamiz:" },
        {
          kind: "list",
          items: [
            "yuqorida tavsiflangan xizmat ko'rsatuvchi hamkorlar bilan — va faqat ular bizga xizmatni yuritish va buyurtmangizni bajarishda yordam berishi uchun zarur bo'lgan darajada;",
            "siz so'raganingizda yoki roziligingiz bilan;",
            "qonun, sud jarayoni yoki davlat organining qonuniy talabi bo'yicha zarur bo'lganda;",
            "huquqiy da'volarni o'rnatish, amalga oshirish yoki himoya qilish uchun, yoxud TALIMOON, mijozlarimiz yoki boshqalarning huquqlari, xavfsizligi va mulkini himoya qilish uchun.",
          ],
        },
      ],
    },
    {
      heading: "Ma'lumotlarni qancha muddat saqlaymiz",
      blocks: [
        {
          kind: "p",
          text: "Biz ma'lumotlaringizni faqat quyidagilar uchun asosli ravishda zarur bo'lgan muddat davomida saqlaymiz:",
        },
        {
          kind: "list",
          items: [
            "buyurtmangizni yaratish va yetkazib berish;",
            "mijozlarni qo'llab-quvvatlash hamda har qanday savol yoki nizolarni hal qilish;",
            "operatsion, buxgalteriya va qonuniy talablarni bajarish.",
            "buyurtma ko‘rsatmalari va olingan rozilikni tasdiqlash.",
          ],
        },
        {
          kind: "p",
          text: "Ma'lumot bizga endi kerak bo'lmaganda, biz uni o'chirish yoki siz bilan bog'liqligini yo'qotish uchun asosli choralar ko'ramiz. Agar ma'lumotni ertaroq o'chirishimizni istasangiz, biz bilan bog'laning — saqlash majburiyati bo'lmagan hollarda buni bajaramiz.",
        },
      ],
    },
    {
      heading: "Xavfsizlik",
      blocks: [
        {
          kind: "p",
          text: "Biz siz ulashadigan ma'lumotlarni yo'qotish, suiiste'mol qilish va ruxsatsiz kirishdan himoya qilishga qaratilgan texnik va tashkiliy choralardan foydalanamiz. Ma'lumot uzatish yoki saqlashning hech bir usuli to'liq xavfsiz ekanligini kafolatlab bo'lmaydi, biroq biz ma'lumotlaringizni himoya qilish va unga kirishni faqat ish yuzasidan zarur bo'lgan shaxslar bilan cheklash ustida ishlaymiz.",
        },
        {
          kind: "list",
          items: [
            "shifrlangan HTTPS uzatish va brauzer uchun qat'iy xavfsizlik sarlavhalari;",
            "buyurtma yuborish jarayonida botlardan himoya;",
            "ommaviy yuklash o'rniga fayllar uchun qisqa muddatli va aynan buyurtmaga bog'langan ruxsat;",
            "TALIMOON dasturiy kodida reklama trekerlari va IP asosidagi mijoz profili yo'qligi;",
            "ma'lumotga kirishni faqat buyurtmani bajarishi yoki xizmatni qo'llab-quvvatlashi zarur bo'lgan shaxslar va provayderlar bilan cheklash.",
          ],
        },
      ],
    },
    {
      heading: "Sizning tanlovlaringiz va so'rovlaringiz",
      blocks: [
        {
          kind: "p",
          text: "Quyidagilar uchun biz bilan hello@talimoon.com orqali bog'lanishingiz mumkin:",
        },
        {
          kind: "list",
          items: [
            "siz yoki bolangiz haqida qanday ma'lumot saqlashimizni so'rash;",
            "noto'g'ri yoki eskirgan ma'lumotni tuzatishimizni so'rash;",
            "ma'lumotni o'chirishimizni so'rash — biz saqlashga majbur bo'lgan yoki asosli ravishda saqlashimiz zarur bo'lgan yozuvlar bundan mustasno.",
          ],
        },
        {
          kind: "p",
          text: "Biz so'rovingizga asosli muddat ichida javob beramiz va choralar ko'rishdan oldin shaxsingizni hamda bola bilan aloqangizni tasdiqlashimiz kerak bo'lishi mumkin.",
        },
      ],
    },
    {
      heading: "Uchinchi tomon xizmatlari",
      blocks: [
        {
          kind: "p",
          text: "Tajribaning ba'zi qismlari tashqi kompaniyalarga bog'liq — masalan, to'lov provayderlari, xabar almashish platformalari va yetkazib berish xizmatlari. Siz o'sha xizmatlardan foydalanganingizda yoki biz buyurtmangizni yakunlash uchun ularga cheklangan ma'lumotni uzatganimizda, ular bilan bog'liq amallarga o'sha kompaniyalarning o'z maxfiylik qoidalari tatbiq etiladi. Ularning qoidalari bilan tanishishni tavsiya qilamiz.",
        },
      ],
    },
    {
      heading: "Siyosatga o'zgartirishlar",
      blocks: [
        {
          kind: "p",
          text: "Biz ushbu Maxfiylik siyosatini vaqti-vaqti bilan yangilashimiz mumkin. Yangilaganimizda, sahifaning yuqorisidagi kuchga kirish sanasini o'zgartiramiz. O'zgarishlar jiddiy bo'lsa, faol buyurtmasi bor mijozlarni xabardor qilish uchun asosli choralar ko'ramiz.",
        },
      ],
    },
    {
      heading: "Biz bilan bog'lanish",
      blocks: [
        {
          kind: "p",
          text: "Ushbu Maxfiylik siyosati yoki ma'lumotlaringiz qanday ishlov ko'rishi bo'yicha savolingiz bo'lsa, hello@talimoon.com orqali biz bilan bog'laning.",
        },
      ],
    },
  ],
};

const RU: LegalCopy = {
  title: "Политика конфиденциальности",
  effectiveLabel: "Дата вступления в силу",
  effectiveDate: "7 сентября 2026 г.",
  intro: [
    "TALIMOON (далее «TALIMOON», «мы») создаёт именные детские книги и другие продукты, связанные с историями для детей. Настоящая Политика конфиденциальности объясняет, какие данные мы собираем при оформлении заказа или использовании нашего сайта, для чего мы их используем и какой выбор есть у Вас.",
  "Пожалуйста, ознакомьтесь с ней вместе с Условиями использования.",
  ],
  sections: [
    {
      heading: "Кто мы",
      blocks: [
        {
          kind: "p",
          text: "Сервис TALIMOON управляется компанией Talimoon MCHJ, номер государственной регистрации 856745, зарегистрированной по адресу: Узбекистан, г. Ташкент, Себзор 2, дом 16. Мы создаём персонализированные детские книги и истории.",
        },
        {
          kind: "p",
          text: "По вопросам этой политики или обработки Ваших данных напишите на Sh.yunusov@talimoon.com.",
        },
      ],
    },
    {
      heading: "Информация, которую предоставляете Вы",
      blocks: [
        {
          kind: "p",
          text: "При оформлении заказа или обращении к нам Вы можете предоставить нам:",
        },
        {
          kind: "list",
          items: [
            "Контактные данные: имя, номер телефона, адрес электронной почты, контакт в мессенджере и адрес доставки лица, оформляющего заказ.",
            "Имя и возраст ребёнка.",
            "Интересы, увлечения и предпочтения ребёнка.",
            "Черты характера, семейный контекст и другие сведения, которыми Вы решите поделиться, чтобы история звучала по настоящему личной.",
            "Фотографии ребёнка, которые Вы загружаете как основу для иллюстраций.",
            "Фотографии и данные дополнительных персонажей (например, родителя, брата, сестры или друга), которых Вы хотите включить в книгу.",
            "Данные заказа и доставки: что именно Вы заказали, выбранный способ доставки и сведения о подтверждении оплаты, которые Вы нам присылаете.",
            "Запись согласия: введённая совершеннолетним заказчиком электронная подпись, время принятия, язык интерфейса и версии принятой Политики конфиденциальности и Условий. TALIMOON не связывает IP-адрес с этой записью согласия.",
            "Переписку: сообщения, вопросы и отзывы, которые Вы направляете нам по заказу.",
          ],
        },
        {
          kind: "p",
          text: "Пожалуйста, делитесь только теми сведениями, которые действительно нужны для создания книги, и не присылайте нам конфиденциальную информацию, которую мы не запрашивали.",
        },
      ],
    },
    {
      heading: "Данные сайта, IP-адрес и локальное хранение",
      blocks: [
        {
          kind: "p",
          text: "Собственный код сайта TALIMOON не записывает Ваш IP-адрес в профиль заказа, общий счётчик просмотров отзывов или хранилище браузера. Мы не создаём рекламные профили на основе IP-адресов и не ведём отдельную базу IP-адресов клиентов.",
        },
        {
          kind: "p",
          text: "Тем не менее IP-адрес передаётся как техническая часть любого обычного интернет-соединения. Наши поставщики хостинга и безопасности — в настоящее время Vercel и Cloudflare Turnstile — могут обрабатывать IP-адрес, время запроса, запрошенную страницу, сведения о браузере или устройстве и сигналы безопасности, чтобы доставлять сайт, диагностировать ошибки, предотвращать злоупотребления и проверять, что заказ отправляет человек. Срок хранения инфраструктурных журналов регулируется их собственными условиями и уведомлениями о конфиденциальности. Поэтому мы не заявляем ошибочно, что IP-адрес никогда не поступает в интернет-инфраструктуру и никогда временно не сохраняется.",
        },
        {
          kind: "p",
          text: "Мы не используем рекламные cookie-файлы или сторонние рекламные пиксели. Сайт сохраняет на Вашем устройстве только ограниченные настройки первой стороны: выбранные язык и регион, прогресс чтения, случайный анонимный идентификатор реакций и выбранные реакции, а также время закрытия предложения установить приложение. Эти значения остаются в браузере и могут быть удалены через настройки данных сайта. Они не создаются на основе IP-адреса или цифрового отпечатка устройства.",
        },
        {
          kind: "p",
          text: "Если Вы выберете дополнительную функцию геолокации для доставки, браузер сначала запросит разрешение. Точные координаты запрашиваются только после Вашего действия и отправляются вместе с заказом исключительно для облегчения доставки; при обычном просмотре сайта геолокация не собирается.",
        },
      ],
    },
    {
      heading: "Для чего мы используем Ваши данные",
      blocks: [
        { kind: "p", text: "Указанные выше сведения мы используем для того, чтобы:" },
        {
          kind: "list",
          items: [
            "создать заказанную Вами именную книгу;",
            "подготовить иллюстрации, текст и содержание истории для этой книги;",
            "обработать, подтвердить и вести Ваш заказ;",
            "связываться с Вами по вопросам заказа, включая уточнения и новости о его статусе;",
            "организовать производство, печать и доставку, а также обеспечить поддержку клиентов;",
            "вести операционный учёт и обеспечивать безопасность и целостность нашего сервиса.",
          ],
        },
        {
          kind: "p",
          text: "Мы используем Ваши данные исключительно для этих целей. Мы не используем фотографии детей или личные сведения в рекламных целях и никак иначе, кроме как в связи с Вашим заказом.",
        },
        {
          kind: "p",
          text: "В зависимости от ситуации и применимого законодательства мы обрабатываем данные для исполнения заказанного Вами продукта, на основании Вашего согласия в отношении дополнительных функций, таких как точная геолокация доставки, для выполнения юридических обязанностей, а также в наших законных интересах по поддержке клиентов, предотвращению мошенничества и защите сервиса. Вы можете отозвать согласие на будущую дополнительную обработку, связавшись с нами; это не влияет на уже законно выполненную обработку.",
        },
      ],
    },
    {
      heading: "Информация о детях",
      blocks: [
        {
          kind: "p",
          text: "Наши продукты заказывает взрослый: родитель, законный представитель или иное совершеннолетнее лицо, уполномоченное действовать в интересах ребёнка.",
        },
        {
          kind: "list",
          items: [
            "Оформляя заказ, Вы подтверждаете, что являетесь таким лицом или получили разрешение от него.",
            "Вы подтверждаете, что вправе передавать нам имя, возраст, сведения и фотографии ребёнка для целей создания заказа.",
            "Мы используем сведения о ребёнке только для создания и исполнения заказанного персонального продукта или услуги, а также для сопутствующей поддержки и учёта, описанных в настоящей политике.",
          ],
        },
        {
          kind: "p",
          text: "Если Вы считаете, что сведения о ребёнке были переданы нам без надлежащего согласия, напишите нам на hello@talimoon.com. Мы рассмотрим обращение и при необходимости удалим эти данные.",
        },
      ],
    },
    {
      heading: "Хранение данных и поставщики услуг",
      blocks: [
        {
          kind: "p",
          text: "Мы предоставляем наш сервис с помощью доверенных сторонних поставщиков: например, служб облачного хостинга и хранения файлов, инструментов для обмена сообщениями и электронной почты, партнёров по печати и курьерских служб доставки.",
        },
        {
          kind: "p",
          text: "Фотографии и данные заказа, которые Вы нам присылаете, могут храниться на надёжных облачных сервисах (в том числе таких, как Google Drive), чтобы наша команда могла подготовить Вашу книгу. Эти поставщики обрабатывают данные от нашего имени и по нашим указаниям.",
        },
        {
          kind: "p",
          text: "По соображениям безопасности мы не раскрываем здесь подробности нашей внутренней технической инфраструктуры.",
        },
      ],
    },
    {
      heading: "Передача данных третьим лицам",
      blocks: [
        {
          kind: "p",
          text: "Мы не продаём Ваши персональные данные и не передаём их третьим лицам для их собственных маркетинговых целей.",
        },
        { kind: "p", text: "Мы передаём данные только в следующих случаях:" },
        {
          kind: "list",
          items: [
            "поставщикам услуг, указанным выше, и только в объёме, необходимом для того, чтобы они могли помочь нам предоставлять сервис и исполнять Ваш заказ;",
            "по Вашей просьбе или с Вашего согласия;",
            "когда этого требует закон, судебный процесс или законный запрос государственного органа;",
            "для установления, реализации или защиты правовых требований, а также для защиты прав, безопасности и имущества TALIMOON, наших клиентов или иных лиц.",
          ],
        },
      ],
    },
    {
      heading: "Срок хранения данных",
      blocks: [
        {
          kind: "p",
          text: "Мы храним Ваши данные только в течение срока, разумно необходимого для того, чтобы:",
        },
        {
          kind: "list",
          items: [
            "создать и доставить Ваш заказ;",
            "обеспечить поддержку клиентов и разрешить любые вопросы или споры;",
            "выполнить операционные, бухгалтерские и юридические требования.",
            "подтвердить инструкции по заказу и полученное согласие.",
          ],
        },
        {
          kind: "p",
          text: "Когда необходимость в данных отпадает, мы принимаем разумные меры для их удаления или обезличивания. Если Вы хотите, чтобы мы удалили данные раньше, напишите нам, и мы сделаем это, если у нас нет обязанности хранить их дольше.",
        },
      ],
    },
    {
      heading: "Безопасность",
      blocks: [
        {
          kind: "p",
          text: "Мы применяем технические и организационные меры, направленные на защиту предоставленных Вами данных от утраты, неправомерного использования и несанкционированного доступа. Ни один способ передачи или хранения данных не может считаться абсолютно безопасным, однако мы стремимся защищать Ваши данные и ограничивать доступ к ним только теми сотрудниками, которым он необходим по работе.",
        },
        {
          kind: "list",
          items: [
            "зашифрованная передача по HTTPS и строгие заголовки безопасности браузера;",
            "защита формы заказа от автоматических ботов;",
            "краткосрочная авторизация загрузки файлов, привязанная к конкретному заказу, вместо публичного доступа;",
            "отсутствие рекламных трекеров и IP-профилирования клиентов в коде TALIMOON;",
            "ограничение доступа лицами и поставщиками, которым данные необходимы для исполнения заказа или поддержки сервиса.",
          ],
        },
      ],
    },
    {
      heading: "Ваш выбор и обращения",
      blocks: [
        {
          kind: "p",
          text: "Вы можете написать нам на hello@talimoon.com, чтобы:",
        },
        {
          kind: "list",
          items: [
            "узнать, какие данные мы храним о Вас или Вашем ребёнке;",
            "попросить исправить неверные или устаревшие данные;",
            "попросить удалить данные, за исключением сведений, которые мы обязаны или обоснованно должны хранить.",
          ],
        },
        {
          kind: "p",
          text: "Мы ответим в разумный срок и можем попросить подтвердить Вашу личность и Вашу связь с ребёнком, прежде чем предпринять какие либо действия.",
        },
      ],
    },
    {
      heading: "Сторонние сервисы",
      blocks: [
        {
          kind: "p",
          text: "Некоторые элементы нашего сервиса зависят от сторонних компаний: например, платёжных провайдеров, мессенджеров и служб доставки. Когда Вы пользуетесь такими сервисами или когда мы передаём им ограниченный объём данных для завершения Вашего заказа, к их действиям применяются собственные правила конфиденциальности этих компаний. Рекомендуем ознакомиться с ними.",
        },
      ],
    },
    {
      heading: "Изменения политики",
      blocks: [
        {
          kind: "p",
          text: "Мы можем время от времени обновлять настоящую Политику конфиденциальности. При обновлении мы меняем дату вступления в силу в верхней части страницы. Если изменения существенны, мы предпримем разумные меры, чтобы сообщить об этом клиентам с активными заказами.",
        },
      ],
    },
    {
      heading: "Свяжитесь с нами",
      blocks: [
        {
          kind: "p",
          text: "Если у Вас есть вопрос по настоящей Политике конфиденциальности или по тому, как обрабатываются Ваши данные, напишите нам на hello@talimoon.com.",
        },
      ],
    },
  ],
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main>
        <LegalDocument en={EN} uz={UZ} ru={RU} />
      </main>
      <Footer showTopCta={false} showHowItWorksLink={false} />
    </>
  );
}
