/* nahwu-data.js
 * Data materi khusus: Nahwu
 *
 * Cara edit:
 * - Tambah/hapus item di array di bawah.
 * - Field yang dipakai:
 *   id, title, desc, category, level, url, minutes (opsional), teacher (opsional), price/payment (opsional)
 *
 * Catatan:
 * - Jika url kosong atau contoh (example.com), preview iframe akan disembunyikan (sesuai app.js).
 */
(function () {
  "use strict";
  window.SUBJECT_MATERIALS = window.SUBJECT_MATERIALS || {};
  window.SUBJECT_MATERIALS['nahwu'] = [
    {
      "id": "nahwu_jurumiyah",
      "title": "Al-Ājurrūmiyyah (Mukhtashar Nahwu)",
      "desc": "Kitab dasar ilmu Nahwu. Cocok untuk pemula: i'rab, kalam, isim-fi'il-harf.",
      "category": "Nahwu",
      "level": "Dasar",
      "minutes": 60,
      "url": "https://nuqthah.myr.id/course/nahwu-sharaf",
      "teacher": {
        "name": "Pengajar Nahwu",
        "role": "Pengajar",
        "photo": "./assets/images/nu.png",
        "bio": "(edit) Isi bio pengajar Nahwu di sini."
      }
    },
    {
      "id": "nahwu_alfiyah_intro",
      "title": "Pengantar Alfiyah Ibn Malik",
      "desc": "Pengantar struktur Alfiyah, cara belajar, dan poin penting bab awal.",
      "category": "Nahwu",
      "level": "Menengah",
      "minutes": 75,
      "url": "https://example.com/alfiyah"
    },
  ];
})();
