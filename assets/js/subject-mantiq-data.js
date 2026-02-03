/* mantiq-data.js
 * Data materi khusus: Mantiq
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
  window.SUBJECT_MATERIALS['mantiq'] = [
    {
      "id": "mantiq_sullam",
      "title": "Sullam al-Munawraq (Mantiq)",
      "desc": "Mabadi' mantiq: tashawwur, tashdiq, qadhiyyah, qiyas, dan latihan.",
      "category": "Mantiq",
      "level": "Menengah",
      "minutes": 90,
      "url": "https://nuqthah.myr.id/course/nahwu-sharaf"
    },
    {
      "id": "mantiq_isaghuji",
      "title": "Isāghūjī (Pengantar Mantiq)",
      "desc": "Kitab pengantar mantiq yang ringkas untuk fondasi.",
      "category": "Mantiq",
      "level": "Dasar",
      "minutes": 60,
      "url": "https://nuqthah.myr.id/course/nahwu-sharaf"
    },
  ];
})();
