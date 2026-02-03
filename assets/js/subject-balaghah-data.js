/* balaghah-data.js
 * Data materi khusus: Balaghah
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
  window.SUBJECT_MATERIALS['balaghah'] = [
    {
      "id": "balaghah_jawahir",
      "title": "Jawāhir al-Balāghah",
      "desc": "Balaghah: ma'ani, bayan, badi' (ringkas).",
      "category": "Balaghah",
      "level": "Menengah",
      "minutes": 75,
      "url": "https://nuqthah.myr.id/course/nahwu-sharaf"
    },
    {
      "id": "balaghah_talkhis",
      "title": "Talkhīs al-Miftāh (Pengantar)",
      "desc": "Pengantar kitab balaghah klasik: struktur dan konsep inti.",
      "category": "Balaghah",
      "level": "Lanjutan",
      "minutes": 90,
      "url": "https://nuqthah.myr.id/course/nahwu-sharaf"
    },
  ];
})();
