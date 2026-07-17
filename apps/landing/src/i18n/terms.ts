import type { Locale, LegalCopy } from './types';

/*
 * Terms-of-service copy. Same structure and drift-guard as privacy.ts —
 * both locales side by side, typed against LegalCopy.
 *
 * Not lawyer-reviewed; written to be honest and plain-language. The load-
 * bearing section for a finance app is the AI-advice disclaimer.
 */

const en: LegalCopy = {
  meta: {
    title: 'Terms of Service — Rinciku',
    description:
      'The rules for using Rinciku — your account, your data, what the AI advice is (and is not), and what you can expect from us.',
    ogAlt: 'Rinciku terms of service',
  },
  title: 'Terms of Service',
  updated: 'Last updated: July 17, 2026',
  intro: [
    'These terms are an agreement between you and Rinciku (“we”, “us”) that applies when you use the Rinciku app and website. By creating an account or using the service, you agree to them.',
    'We have tried to keep them short and in plain language. If anything is unclear, email us and ask.',
  ],
  sections: [
    {
      heading: 'The service',
      body: [
        'Rinciku is a personal-finance app: you record incomes and expenses, set budgets, and ask an AI companion whether a purchase fits your budget. The service is currently free. If we ever introduce paid plans, we will tell you clearly in advance — nothing you already use will silently start charging you.',
      ],
    },
    {
      heading: 'Your account',
      body: [
        'You must be at least 13 years old (or the minimum age in your country) to use Rinciku. Keep your login credentials to yourself — you are responsible for what happens under your account. Give us accurate information, and one account per person, please.',
      ],
    },
    {
      heading: 'Your data',
      body: [
        'The financial data, receipts, and messages you put into Rinciku are yours. You give us permission to store and process them only as far as needed to run the service for you, as described in our Privacy Policy. You can export your transactions and delete your account — and all of its data — at any time.',
      ],
    },
    {
      heading: 'AI advice is not financial advice',
      body: [
        'The AI companion gives suggestions grounded in the numbers you have entered. It is an informational tool, not a licensed financial advisor, and it can be wrong — models make mistakes, and its picture of your finances is only as complete as what you have logged.',
        'Decisions about your money are yours alone. Do not rely on Rinciku as your only input for significant financial decisions.',
      ],
    },
    {
      heading: 'Acceptable use',
      body: ['You agree not to:'],
      list: [
        'Use the service for anything unlawful.',
        'Try to break, overload, or probe the service, or access other people’s data.',
        'Reverse engineer the app or scrape the service.',
        'Resell the service or misuse the AI features at volume.',
      ],
    },
    {
      heading: 'Availability and changes',
      body: [
        'We work hard to keep Rinciku available and your data safe, but the service is provided “as is” — we cannot promise it will always be uninterrupted or error-free. We may add, change, or remove features as the product evolves. If we ever discontinue the service, we will give you notice and time to export your data.',
      ],
    },
    {
      heading: 'Limitation of liability',
      body: [
        'To the maximum extent permitted by law, we are not liable for indirect or consequential damages — including financial decisions made based on information or AI suggestions in the app. Where liability cannot be excluded, it is limited to the amount you paid us in the past 12 months.',
      ],
    },
    {
      heading: 'Termination',
      body: [
        'You can stop using Rinciku and delete your account at any time from the app’s settings. We may suspend or terminate accounts that violate these terms, and where reasonable we will warn you first.',
      ],
    },
    {
      heading: 'Changes to these terms',
      body: [
        'If we change these terms, we will update this page and the date above. If the changes are significant, we will let you know in the app or by email before they take effect.',
      ],
    },
    {
      heading: 'Governing law',
      body: [
        'These terms are governed by the laws of the Republic of Indonesia. If a dispute arises, we would much rather solve it over email first.',
      ],
    },
  ],
  contactHeading: 'Contact',
  contactBody: 'Questions about these terms? Email us at',
  backHome: '← Back to home',
};

const id: LegalCopy = {
  meta: {
    title: 'Ketentuan Layanan — Rinciku',
    description:
      'Aturan penggunaan Rinciku — akunmu, datamu, apa arti saran AI (dan apa yang bukan), serta apa yang bisa kamu harapkan dari kami.',
    ogAlt: 'Ketentuan layanan Rinciku',
  },
  title: 'Ketentuan Layanan',
  updated: 'Terakhir diperbarui: 17 Juli 2026',
  intro: [
    'Ketentuan ini adalah kesepakatan antara kamu dan Rinciku (“kami”) yang berlaku saat kamu memakai aplikasi dan situs Rinciku. Dengan membuat akun atau memakai layanan ini, kamu menyetujuinya.',
    'Kami berusaha membuatnya singkat dan berbahasa sederhana. Kalau ada yang kurang jelas, kirim email dan tanyakan saja.',
  ],
  sections: [
    {
      heading: 'Layanan ini',
      body: [
        'Rinciku adalah aplikasi keuangan pribadi: kamu mencatat pemasukan dan pengeluaran, mengatur anggaran, dan bertanya ke teman AI apakah suatu pembelian cocok dengan anggaranmu. Layanan ini saat ini gratis. Jika suatu saat kami memperkenalkan paket berbayar, kami akan memberitahumu dengan jelas sebelumnya — tidak ada yang tiba-tiba menagihmu diam-diam.',
      ],
    },
    {
      heading: 'Akunmu',
      body: [
        'Kamu harus berusia minimal 13 tahun (atau usia minimum di negaramu) untuk memakai Rinciku. Jaga kredensial masukmu sendiri — kamu bertanggung jawab atas apa yang terjadi di akunmu. Berikan informasi yang benar, dan satu akun per orang, ya.',
      ],
    },
    {
      heading: 'Datamu',
      body: [
        'Data keuangan, struk, dan pesan yang kamu masukkan ke Rinciku adalah milikmu. Kamu memberi kami izin untuk menyimpan dan memprosesnya hanya sejauh yang diperlukan untuk menjalankan layanan ini untukmu, seperti dijelaskan di Kebijakan Privasi kami. Kamu bisa mengekspor transaksimu dan menghapus akunmu — beserta seluruh datanya — kapan saja.',
      ],
    },
    {
      heading: 'Saran AI bukan nasihat keuangan',
      body: [
        'Teman AI memberi saran yang berpijak pada angka-angka yang kamu masukkan. Ia adalah alat bantu informasi, bukan penasihat keuangan berlisensi, dan bisa salah — model AI bisa keliru, dan gambarannya tentang keuanganmu hanya selengkap apa yang kamu catat.',
        'Keputusan soal uangmu sepenuhnya ada di tanganmu. Jangan jadikan Rinciku satu-satunya pertimbangan untuk keputusan keuangan yang besar.',
      ],
    },
    {
      heading: 'Penggunaan yang wajar',
      body: ['Kamu setuju untuk tidak:'],
      list: [
        'Memakai layanan ini untuk hal yang melanggar hukum.',
        'Mencoba merusak, membebani, atau membobol layanan, atau mengakses data orang lain.',
        'Merekayasa balik aplikasi atau melakukan scraping terhadap layanan.',
        'Menjual kembali layanan atau menyalahgunakan fitur AI secara masif.',
      ],
    },
    {
      heading: 'Ketersediaan dan perubahan',
      body: [
        'Kami berusaha keras menjaga Rinciku tetap tersedia dan datamu tetap aman, tetapi layanan ini disediakan “apa adanya” — kami tidak bisa menjanjikan selalu tanpa gangguan atau tanpa kesalahan. Kami bisa menambah, mengubah, atau menghapus fitur seiring produk berkembang. Jika suatu saat layanan ini dihentikan, kami akan memberimu pemberitahuan dan waktu untuk mengekspor datamu.',
      ],
    },
    {
      heading: 'Batasan tanggung jawab',
      body: [
        'Sejauh diizinkan hukum, kami tidak bertanggung jawab atas kerugian tidak langsung atau konsekuensial — termasuk keputusan keuangan yang dibuat berdasarkan informasi atau saran AI di aplikasi. Jika tanggung jawab tidak bisa dikecualikan, besarnya dibatasi sejumlah yang kamu bayarkan ke kami dalam 12 bulan terakhir.',
      ],
    },
    {
      heading: 'Penghentian',
      body: [
        'Kamu bisa berhenti memakai Rinciku dan menghapus akunmu kapan saja lewat pengaturan aplikasi. Kami bisa menangguhkan atau menutup akun yang melanggar ketentuan ini, dan bila memungkinkan kami akan memperingatkanmu lebih dulu.',
      ],
    },
    {
      heading: 'Perubahan ketentuan ini',
      body: [
        'Jika ketentuan ini berubah, kami akan memperbarui halaman ini beserta tanggal di atas. Jika perubahannya signifikan, kami akan memberitahumu lewat aplikasi atau email sebelum berlaku.',
      ],
    },
    {
      heading: 'Hukum yang berlaku',
      body: [
        'Ketentuan ini diatur oleh hukum Republik Indonesia. Kalau ada perselisihan, kami jauh lebih suka menyelesaikannya lewat email dulu.',
      ],
    },
  ],
  contactHeading: 'Kontak',
  contactBody: 'Ada pertanyaan soal ketentuan ini? Kirim email ke',
  backHome: '← Kembali ke beranda',
};

const termsCopy: Record<Locale, LegalCopy> = { en, id };

/** Terms-of-service copy for a locale (defaults to English). */
export function getTermsCopy(locale: Locale): LegalCopy {
  return termsCopy[locale] ?? en;
}
