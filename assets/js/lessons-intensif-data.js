// Nuqthah Learn — Lessons Data (Pembelajaran Intensif)
// File ini KHUSUS untuk route #intensif.
// Tidak mengubah window.LESSON_ACTIONS agar tidak konflik.
//
// Struktur item sama seperti lessons-data.js:
// { id, title, desc, category, level, meetings, url, available?, chapters? }

window.LESSONS_INTENSIF_DATA = [
  {
    id: "fiqh_muqoron_tk1",
    title: "Fiqh Muqoron",
    category: "Bimbel Syari'ah",
    level: "Tingkat 1",
    meetings: 12,
    available: true,
    formUrl: "https://forms.gle/uu1HFomsNQQ7JP2K6",

    teacher: {
      name: "Ust. Ahmad Fauzan, Lc",
      role: "Pengajar Fiqh",
      bio: "Fokus fiqh muqoron dan penguatan analisis perbedaan pendapat.",
      photo: "./assets/images/nu.png"
    },

    priceLabel: "Rp 250.000"
  },

  {
    id: "fiqh_muqoron_tk1_v2",
    title: "Fiqh Muqoron",
    category: "Bimbel Syari'ah",
    level: "Tingkat 1",
    meetings: 12,
    available: true,
    formUrl: "https://forms.gle/xsdA1qN1RjroGk8r8",
    teacherCardStyle: "premium", // ⬅️ atau "minimal"
    //teacherCardStyle: "minimal", // ⬅️ atau "minimal"

    teacher: {
      name: "Ust. Ahmad Fauzan, Lc",
      role: "Pengajar Fiqh",
      bio: "Fokus fiqh muqoron dan penguatan analisis perbedaan pendapat.",
      photo: "./assets/images/nu.png"
    }
  },

  {
    id: "fiqh_muqoron_tk1_v3",
    title: "Fiqh Muqoron",
    category: "Bimbel Syari'ah",
    level: "Tingkat 1",
    meetings: 12,
    available: true,

    teacher: {
      name: "Ust. Ahmad Fauzan, Lc",
      role: "Pengajar Fiqh",
      photo: "assets/images/nu.png" // boleh kosong ""
    }
  },

  {
    id: "intensif_30d",
    title: "Program Intensif 30 Hari",
    desc: "Program padat 30 hari dengan target capaian. Cocok untuk percepatan pemahaman.",
    category: "Intensif",
    level: "30 Hari",
    meetings: 12,
    available: true,
    url: ""
  },
  {
    id: "intensif_bootcamp",
    title: "Bootcamp Intensif Akhir Pekan",
    desc: "Sesi intensif Sabtu–Ahad: materi ringkas, latihan, dan evaluasi.",
    category: "Intensif",
    level: "Weekend",
    meetings: 4,
    available: false,
    url: ""
  },
  {
    id: "intensif_review",
    title: "Intensif Review Materi (Ujian)",
    desc: "Review terarah menjelang ujian: rangkuman, contoh soal, dan pembahasan.",
    category: "Intensif",
    level: "Review",
    meetings: 5,
    available: false,
    url: ""
  }
];
