/* adabul_bahs-data.js
 * Data materi khusus: Adabul Bahs
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
  window.SUBJECT_MATERIALS['adabul_bahs'] = [
    {
      "id": "adab_bahs_samarqandi",
      "title": "Ādāb al-Bahṡ wal Munāẓarah (As-Samarqandi)",
      "desc": "Adab diskusi, definisi, dalil, bantahan, dan etika munazharah.",
      "category": "Adabul Bahs",
      "level": "Menengah",
      "minutes": 90,
      "url": "https://nuqthah.myr.id/course/nahwu-sharaf"
    },
  ];
})();
