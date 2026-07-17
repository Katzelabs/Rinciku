import type { Locale, LegalCopy } from './types';

/*
 * Privacy-policy copy. Both locales live side by side here (unlike the
 * landing copy in en.ts/id.ts) so the legal text stays out of the marketing
 * files and the two versions are easy to diff by eye.
 *
 * Keep the claims in sync with what the app actually does — the source of
 * truth for collected data is the iOS privacy manifest in
 * apps/mobile/app.json (`NSPrivacyCollectedDataTypes`).
 */

const en: LegalCopy = {
  meta: {
    title: 'Privacy Policy — Rinciku',
    description:
      'How Rinciku collects, uses, and protects your data — your financial entries, receipt photos, and AI conversations.',
    ogAlt: 'Rinciku privacy policy',
  },
  title: 'Privacy Policy',
  updated: 'Last updated: July 17, 2026',
  intro: [
    'Rinciku (“we”, “us”) is a personal-finance app that helps you track spending and make purchase decisions with AI advice grounded in your own budget. This policy explains what data we collect, how we use it, and the choices you have.',
    'The short version: your data is used to run the app for you — never sold, never used for advertising, and never used to track you across other apps or websites.',
  ],
  sections: [
    {
      heading: 'What we collect',
      body: [
        'Everything below is collected because the app cannot work without it — nothing is gathered in the background for other purposes.',
      ],
      list: [
        'Account details — your email address, name, and login credentials. Passwords are hashed by our authentication provider; we never see them.',
        'Financial data you enter — incomes, expenses, budgets, categories, essentials, and the currencies they are in.',
        'Receipt photos — images you attach to transactions or scan with the AI.',
        'AI chat messages — conversations you have with the AI money companion.',
        'App preferences — language and theme, stored on your device.',
      ],
    },
    {
      heading: 'How we use your data',
      body: ['We use your data solely to provide Rinciku’s features:'],
      list: [
        'Storing and showing your transactions, budgets, and monthly overview.',
        'Answering your questions in the AI chat with advice grounded in your actual budget state.',
        'Reading the receipts you scan so they can be turned into transactions.',
      ],
    },
    {
      heading: 'What we never do',
      body: [],
      list: [
        'Sell your personal data.',
        'Show you ads or share your data with advertisers.',
        'Track you across other apps or websites.',
      ],
    },
    {
      heading: 'AI processing',
      body: [
        'When you use the AI chat or receipt scanning, the relevant messages, budget context, or images are sent through our server to our AI provider for the sole purpose of generating a response. Your AI conversations are stored in your account so you can revisit them, and they are deleted together with your account.',
      ],
    },
    {
      heading: 'Where your data lives',
      body: [
        'Your data is stored in our database and file storage hosted by Supabase. All traffic between your device and our servers is encrypted in transit. On mobile, your login session is kept in the operating system’s secure storage.',
      ],
    },
    {
      heading: 'Services we rely on',
      body: ['We share data only with the processors needed to run the app:'],
      list: [
        'Supabase — database, authentication, and file storage.',
        'OpenRouter and Google — AI model processing for chat and receipt scanning.',
        'Cloudflare Turnstile — bot protection at sign-in on the web app.',
      ],
    },
    {
      heading: 'Retention and deletion',
      body: [
        'We keep your data for as long as your account exists. You can permanently delete your account and all of its data at any time from the app’s settings. If you have trouble, email us and we will do it for you.',
      ],
    },
    {
      heading: 'Your rights',
      body: [
        'You can view and correct your data directly in the app, export your transactions as CSV, and delete your account entirely. Depending on where you live you may have additional legal rights, such as access or portability requests — contact us and we will honor them.',
      ],
    },
    {
      heading: 'Children',
      body: [
        'Rinciku is not directed at children under 13 (or the minimum age in your country), and we do not knowingly collect their data.',
      ],
    },
    {
      heading: 'Changes to this policy',
      body: [
        'If we change this policy, we will update this page and the date above. If the changes are significant, we will let you know in the app or by email.',
      ],
    },
  ],
  contactHeading: 'Contact',
  contactBody: 'Questions about privacy or your data? Email us at',
  backHome: '← Back to home',
};

const id: LegalCopy = {
  meta: {
    title: 'Kebijakan Privasi — Rinciku',
    description:
      'Bagaimana Rinciku mengumpulkan, menggunakan, dan melindungi datamu — catatan keuangan, foto struk, dan percakapan AI.',
    ogAlt: 'Kebijakan privasi Rinciku',
  },
  title: 'Kebijakan Privasi',
  updated: 'Terakhir diperbarui: 17 Juli 2026',
  intro: [
    'Rinciku (“kami”) adalah aplikasi keuangan pribadi yang membantumu mencatat pengeluaran dan mengambil keputusan belanja lewat saran AI yang berpijak pada anggaranmu sendiri. Kebijakan ini menjelaskan data apa yang kami kumpulkan, bagaimana kami menggunakannya, dan pilihan yang kamu punya.',
    'Versi singkatnya: datamu dipakai hanya untuk menjalankan aplikasi ini untukmu — tidak pernah dijual, tidak pernah dipakai untuk iklan, dan tidak pernah dipakai untuk melacakmu di aplikasi atau situs lain.',
  ],
  sections: [
    {
      heading: 'Data yang kami kumpulkan',
      body: [
        'Semua di bawah ini dikumpulkan karena aplikasi tidak bisa berjalan tanpanya — tidak ada yang diambil diam-diam untuk tujuan lain.',
      ],
      list: [
        'Detail akun — alamat email, nama, dan kredensial masuk. Kata sandi di-hash oleh penyedia autentikasi kami; kami tidak pernah melihatnya.',
        'Data keuangan yang kamu masukkan — pemasukan, pengeluaran, anggaran, kategori, kebutuhan pokok, beserta mata uangnya.',
        'Foto struk — gambar yang kamu lampirkan ke transaksi atau pindai dengan AI.',
        'Pesan chat AI — percakapanmu dengan teman keuangan AI.',
        'Preferensi aplikasi — bahasa dan tema, disimpan di perangkatmu.',
      ],
    },
    {
      heading: 'Bagaimana kami menggunakan datamu',
      body: ['Datamu kami pakai semata-mata untuk menyediakan fitur Rinciku:'],
      list: [
        'Menyimpan dan menampilkan transaksi, anggaran, dan ringkasan bulananmu.',
        'Menjawab pertanyaanmu di chat AI dengan saran yang berpijak pada kondisi anggaranmu yang sebenarnya.',
        'Membaca struk yang kamu pindai agar bisa diubah menjadi transaksi.',
      ],
    },
    {
      heading: 'Yang tidak akan pernah kami lakukan',
      body: [],
      list: [
        'Menjual data pribadimu.',
        'Menampilkan iklan atau membagikan datamu ke pengiklan.',
        'Melacakmu di aplikasi atau situs web lain.',
      ],
    },
    {
      heading: 'Pemrosesan AI',
      body: [
        'Saat kamu memakai chat AI atau pemindaian struk, pesan, konteks anggaran, atau gambar terkait dikirim melalui server kami ke penyedia AI kami semata-mata untuk menghasilkan jawaban. Percakapan AI-mu disimpan di akunmu agar bisa dibuka kembali, dan ikut terhapus bersama akunmu.',
      ],
    },
    {
      heading: 'Di mana datamu disimpan',
      body: [
        'Datamu disimpan di database dan penyimpanan berkas kami yang di-host oleh Supabase. Semua lalu lintas antara perangkatmu dan server kami dienkripsi saat transit. Di ponsel, sesi masukmu disimpan di penyimpanan aman milik sistem operasi.',
      ],
    },
    {
      heading: 'Layanan yang kami andalkan',
      body: [
        'Kami membagikan data hanya ke pemroses yang dibutuhkan untuk menjalankan aplikasi:',
      ],
      list: [
        'Supabase — database, autentikasi, dan penyimpanan berkas.',
        'OpenRouter dan Google — pemrosesan model AI untuk chat dan pemindaian struk.',
        'Cloudflare Turnstile — perlindungan bot saat masuk di aplikasi web.',
      ],
    },
    {
      heading: 'Penyimpanan dan penghapusan',
      body: [
        'Kami menyimpan datamu selama akunmu ada. Kamu bisa menghapus akun beserta seluruh datanya secara permanen kapan saja lewat pengaturan aplikasi. Kalau ada kendala, kirim email dan kami yang akan menghapusnya untukmu.',
      ],
    },
    {
      heading: 'Hakmu',
      body: [
        'Kamu bisa melihat dan memperbaiki datamu langsung di aplikasi, mengekspor transaksimu sebagai CSV, dan menghapus akunmu sepenuhnya. Tergantung tempat tinggalmu, kamu mungkin punya hak hukum tambahan, seperti permintaan akses atau portabilitas data — hubungi kami dan akan kami penuhi.',
      ],
    },
    {
      heading: 'Anak-anak',
      body: [
        'Rinciku tidak ditujukan untuk anak di bawah 13 tahun (atau usia minimum di negaramu), dan kami tidak dengan sengaja mengumpulkan data mereka.',
      ],
    },
    {
      heading: 'Perubahan kebijakan ini',
      body: [
        'Jika kebijakan ini berubah, kami akan memperbarui halaman ini beserta tanggal di atas. Jika perubahannya signifikan, kami akan memberitahumu lewat aplikasi atau email.',
      ],
    },
  ],
  contactHeading: 'Kontak',
  contactBody: 'Ada pertanyaan soal privasi atau datamu? Kirim email ke',
  backHome: '← Kembali ke beranda',
};

const privacyCopy: Record<Locale, LegalCopy> = { en, id };

/** Privacy-policy copy for a locale (defaults to English). */
export function getPrivacyCopy(locale: Locale): LegalCopy {
  return privacyCopy[locale] ?? en;
}
