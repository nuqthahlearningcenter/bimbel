/* semua-data.js
 * Data materi khusus: Semua Pelajaran
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
  window.SUBJECT_MATERIALS['semua'] = [
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
      "url": "https://nuqthah.myr.id/course/nahwu-sharaf"
    },
    {
      "id": "sharaf_bina",
      "title": "Bina’ wal Asās (Sharaf Dasar)",
      "desc": "Pola wazan, tashrif lughawi & istilahi, latihan perubahan fi'il.",
      "category": "Sharaf",
      "level": "Dasar",
      "minutes": 60,
      "url": "https://nuqthah.myr.id/course/nahwu-sharaf"
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
    {
      "id": "mantiq_sullam",
      "title": "Sullam al-Munawraq (Mantiq)",
      "desc": "Mabadi' mantiq: tashawwur, tashdiq, qadhiyyah, qiyas, dan latihan.",
      "category": "Mantiq",
      "level": "Menengah",
      "minutes": 90,
      "url": "https://example.com/sullam"
    },
    {
      "id": "mantiq_isaghuji",
      "title": "Isāghūjī (Pengantar Mantiq)",
      "desc": "Kitab pengantar mantiq yang ringkas untuk fondasi.",
      "category": "Mantiq",
      "level": "Dasar",
      "minutes": 60,
      "url": "https://example.com/isaghuji"
    },
    {
      "id": "balaghah_jawahir",
      "title": "Jawāhir al-Balāghah",
      "desc": "Balaghah: ma'ani, bayan, badi' (ringkas).",
      "category": "Balaghah",
      "level": "Menengah",
      "minutes": 75,
      "url": "https://example.com/jawahir"
    },
    {
      "id": "balaghah_talkhis",
      "title": "Talkhīs al-Miftāh (Pengantar)",
      "desc": "Pengantar kitab balaghah klasik: struktur dan konsep inti.",
      "category": "Balaghah",
      "level": "Lanjutan",
      "minutes": 90,
      "url": "https://example.com/talkhis"
    },
    {
      "id": "adab_bahs_samarqandi",
      "title": "Ādāb al-Bahṡ wal Munāẓarah (As-Samarqandi)",
      "desc": "Adab diskusi, definisi, dalil, bantahan, dan etika munazharah.",
      "category": "Adabul Bahs",
      "level": "Menengah",
      "minutes": 90,
      "url": "https://example.com/adabulbahs"
    },
  ];
})();
