/* sharaf-data.js
 * Data materi khusus: Sharaf
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
  window.SUBJECT_MATERIALS['sharaf'] = [
    {
      "id": "sharaf_bina",
      "title": "Bina’ wal Asās (Sharaf Dasar)",
      "desc": "Pola wazan, tashrif lughawi & istilahi, latihan perubahan fi'il.",
      "category": "Sharaf",
      "level": "Dasar",
      "minutes": 60,
      "url": "https://example.com/bina"
    },
    {
      "id": "sharaf_kailani",
      "title": "Kailani (Sharaf)",
      "desc": "Pendalaman wazan dan kaidah sharaf untuk praktik.",
      "category": "Sharaf",
      "level": "Menengah",
      "minutes": 75,
      "url": "https://example.com/kailani"
    },
  ];
})();
