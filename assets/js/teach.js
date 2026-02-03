// assets/teach.js
// Kontrol TOTAL isi halaman pendaftaran pengajar (route #teach) dari file ini saja.
// Tidak mengubah route lain.
// - Mengambil data materi dari window.LESSONS_DATA (lessons-data.js)
// - Menampilkan kartu materi + badge "BUTUH PENGAJAR / TERISI" (dikontrol di sini)
// - Klik kartu => buka form pendaftaran (auto isi materi), pendaftar hanya isi: Nama, WA, Pengalaman
// - Tombol kirim => buka WhatsApp admin dengan pesan sesuai kartu yang diklik
//
// Catatan penting data:
// Banyak item kamu memakai id yang sama ("bimbel"). Karena itu status & pemilihan memakai key komposit:
//   key = `${id}::${title}::${level}`

(() => {
  "use strict";

  const $ = (sel, root = document) => (root || document).querySelector(sel);

  // =========================================================
  // 1) KONTEN HALAMAN (ubah semua teks/label di sini)
  // =========================================================
  const TEACH_PAGE = {

    title: "Materi yang Membutuhkan Pengajar",
    note:
      "Pilih materi yang masih membutuhkan pengajar. Setelah memilih, formulir akan terbuka otomatis dan bisa langsung dikirim ke admin melalui WhatsApp.",
    criteriaTitle: "Kualifikasi Umum",
    criteriaItems: [
      "Memiliki kompetensi sesuai bidang ajar (diutamakan linier).",
      "Mampu menyampaikan materi secara terstruktur dan mudah dipahami.",
      "Komunikatif, beradab, dan berkomitmen menjalankan amanah mengajar.",
      "Bersedia mengikuti verifikasi oleh tim Nuqthah Learning Center."
    ],
    flowTitle: "Alur Pendaftaran",
    flowItems: [
      "Pilih materi yang membutuhkan pengajar.",
      "Isi Nama, Nomor WhatsApp, dan Pengalaman singkat.",
      "Kirim pendaftaran melalui WhatsApp (pesan otomatis sesuai materi).",
      "Admin akan menghubungi jika sesuai kebutuhan."
    ],

    listTitle: "Materi yang Membutuhkan Pengajar",
    listSub: "Berikut daftar materi yang saat ini masih membutuhkan pengajar. Klik salah satu kartu untuk mendaftar.",

    backText: "Kembali ke Beranda",
    sendText: "Kirim ke Admin (WhatsApp)",
    closeFormText: "Tutup Form",

    formTitle: "Form Pendaftaran Pengajar",
    formSubtitle:
      "Materi terpilih akan terisi otomatis. Silakan lengkapi data di bawah ini dengan singkat dan jelas.",

    fieldNameLabel: "Nama Lengkap",
    fieldNamePlaceholder: "Contoh: Ahmad Fauzan",
    fieldWaLabel: "Nomor WhatsApp",
    fieldWaPlaceholder: "Contoh: 0812xxxx / +2010xxxx",
    fieldExpLabel: "Pengalaman Mengajar (singkat)",
    fieldExpPlaceholder: "Tulis 2–5 kalimat pengalaman mengajar / pendampingan belajar.",

    aboutLabel: "Ringkasan Materi",
    aboutFallback: "—",

    // Admin WhatsApp (boleh override global di app.js dengan window.ADMIN_WA)
    adminWa: null, // null => pakai window.ADMIN_WA kalau ada, fallback 6285185409887
  };

  // =========================================================
  // 2) KONTROL STATUS BADGE DI SINI
  // =========================================================
  // value: "filled" (TERISI) atau "needed" (BUTUH PENGAJAR)
  // key komposit: `${id}::${title}::${level}`
  const TEACH_STATUS_OVERRIDES = {
    // contoh:
    // "bimbel::Ushul Fiqh::Tingkat 1": "filled",
    "bimbel::Fiqh Muqoron::Tingkat 1": "needed",
    "bimbel::Tafsir Ayat Ahkam::Tingkat 1": "filled",
    "bimbel::Qodoya Fiqhiyah::Tingkat 1": "filled",
    "bimbel::Tafsir Ayat Ahkam::Tingkat 1": "filled",
    "bimbel::Tafsir Ayat Ahkam::Tingkat 1": "filled",
    "bimbel::Tafsir Ayat Ahkam::Tingkat 1": "filled",
    "bimbel::Tafsir Ayat Ahkam::Tingkat 1": "filled",
    "bimbel::Tafsir Ayat Ahkam::Tingkat 1": "filled",
    "bimbel::Tafsir Ayat Ahkam::Tingkat 1": "filled",
    "bimbel::Tafsir Ayat Ahkam::Tingkat 1": "filled",
    "bimbel::Tafsir Ayat Ahkam::Tingkat 1": "filled",
    "bimbel::Tafsir Ayat Ahkam::Tingkat 1": "filled",
    "bimbel::Tafsir Ayat Ahkam::Tingkat 1": "filled",
    "bimbel::Tafsir Ayat Ahkam::Tingkat 1": "filled",
  };

  // Simpan juga agar app.js (kalau masih memanggil renderTeachNeeds) tidak “mengambil alih”
  window.TEACH_STATUS_OVERRIDES = TEACH_STATUS_OVERRIDES;

  // =========================================================
  // Helpers
  // =========================================================
  const ADMIN_WA = (TEACH_PAGE.adminWa || window.ADMIN_WA || "6285185409887");

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[m]));
  }

  function normalizeWA(wa) {
    return String(wa || "").replace(/[^\d]/g, "").replace(/^0/, "62").trim();
  }

  function waLink(wa, text) {
    const n = normalizeWA(wa);
    const msg = encodeURIComponent(text || "");
    return `https://wa.me/${n}?text=${msg}`;
  }

  function getLessonsSafe() {
    const arr = window.LESSONS_DATA || [];
    return Array.isArray(arr) ? arr.filter(Boolean) : [];
  }

  function teachKey(lesson) {
    const id = (lesson && lesson.id) ? String(lesson.id) : "";
    const title = (lesson && lesson.title) ? String(lesson.title) : "";
    const level = (lesson && lesson.level) ? String(lesson.level) : "";
    return `${id}::${title}::${level}`;
  }

  function getTeachStatusMap(lessons) {
    // default: 1 terisi, sisanya butuh
    const base = {};
    lessons.forEach((l, i) => { base[teachKey(l)] = (i === 0) ? "filled" : "needed"; });

    // overrides paling kuat
    const merged = { ...base, ...(TEACH_STATUS_OVERRIDES || {}) };
    Object.keys(merged).forEach((k) => { merged[k] = merged[k] === "filled" ? "filled" : "needed"; });
    return merged;
  }

  function meetingsOf(lesson) {
    const m = Number(lesson && lesson.meetings);
    if (!Number.isNaN(m) && m > 0) return String(m);
    // fallback kompatibilitas lama
    const old = Number(lesson && lesson.minutes);
    if (!Number.isNaN(old) && old > 0) return String(old);
    const d = String((lesson && lesson.duration) || "").trim();
    const n = Number(d);
    if (!Number.isNaN(n) && n > 0) return String(n);
    return "0";
  }

  // =========================================================
  // Render
  // =========================================================
  function buildTeachTemplate() {
    return `
      <div class="container">
        <div class="top-pill">${escapeHtml(TEACH_PAGE.headerPill)}</div>

        <div class="section-head">
          <h2>${escapeHtml(TEACH_PAGE.title)}</h2>
          <p class="muted">${escapeHtml(TEACH_PAGE.subtitle)}</p>
        </div>

        <div class="panel" style="margin-top:10px;">
          <div class="panel-bd">
            <p class="muted" style="font-size:13px; font-weight:850;">${escapeHtml(TEACH_PAGE.note)}</p>

            <div class="grid-2" style="margin-top:12px;">
              <div class="panel" style="margin:0;">
                <div class="panel-bd">
                  <strong style="font-size:13px; font-weight:1000;">${escapeHtml(TEACH_PAGE.criteriaTitle)}</strong>
                  <ul class="teach-list" style="margin-top:10px;">
                    ${TEACH_PAGE.criteriaItems.map(x => `<li>${escapeHtml(x)}</li>`).join("")}
                  </ul>
                </div>
              </div>

              <div class="panel" style="margin:0;">
                <div class="panel-bd">
                  <strong style="font-size:13px; font-weight:1000;">${escapeHtml(TEACH_PAGE.flowTitle)}</strong>
                  <ol class="teach-steps" style="margin-top:10px;">
                    ${TEACH_PAGE.flowItems.map(x => `<li>${escapeHtml(x)}</li>`).join("")}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="panel" style="margin-top:12px;">
          <div class="panel-bd">
            <div class="section-head" style="margin-bottom:10px;">
              <h2 style="margin:0;">${escapeHtml(TEACH_PAGE.listTitle)}</h2>
              <p class="muted" style="margin-top:6px;">${escapeHtml(TEACH_PAGE.listSub)}</p>
            </div>
            <div id="teachNeedSummary" class="muted"></div>
            <div class="teach-grid" id="teachNeedGrid" style="margin-top:14px;"></div>

            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:14px;">
              <button class="btn btn-soft" type="button" data-go="home">${escapeHtml(TEACH_PAGE.backText)}</button>
            </div>
          </div>
        </div>

        <div class="panel" id="teachFormPanel" style="margin-top:12px; display:none;">
          <div class="panel-bd">
            <div class="section-head" style="margin-bottom:10px;">
              <h2 style="margin:0;">${escapeHtml(TEACH_PAGE.formTitle)}</h2>
              <p class="muted" style="margin:6px 0 0;">
                ${escapeHtml(TEACH_PAGE.formSubtitle)}
              </p>
              <p class="muted" style="margin:6px 0 0;">
                Target materi: <b id="teachTargetLabel">—</b>
              </p>
            </div>

            <div class="grid-2">
              <div>
                <div class="muted" style="font-weight:850; font-size:12px; margin-bottom:6px;">
                  ${escapeHtml(TEACH_PAGE.fieldNameLabel)}
                </div>
                <input class="input" id="teachName" type="text" placeholder="${escapeHtml(TEACH_PAGE.fieldNamePlaceholder)}">
              </div>
              <div>
                <div class="muted" style="font-weight:850; font-size:12px; margin-bottom:6px;">
                  ${escapeHtml(TEACH_PAGE.fieldWaLabel)}
                </div>
                <input class="input" id="teachWA" type="text" placeholder="${escapeHtml(TEACH_PAGE.fieldWaPlaceholder)}">
              </div>
            </div>

            <div style="margin-top:12px;">
              <div class="muted" style="font-weight:850; font-size:12px; margin-bottom:6px;">
                ${escapeHtml(TEACH_PAGE.fieldExpLabel)}
              </div>
              <textarea class="input" id="teachExp" rows="4" placeholder="${escapeHtml(TEACH_PAGE.fieldExpPlaceholder)}"></textarea>
            </div>

            <div class="panel" style="margin-top:12px;">
              <div class="panel-bd">
                <div class="muted" style="font-weight:850; font-size:12px; margin-bottom:6px;">
                  ${escapeHtml(TEACH_PAGE.aboutLabel)}
                </div>
                <div id="teachAboutText" class="muted">${escapeHtml(TEACH_PAGE.aboutFallback)}</div>
              </div>
            </div>

            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:14px;">
              <button class="btn btn-soft" type="button" id="teachCloseBtn">${escapeHtml(TEACH_PAGE.closeFormText)}</button>
              <button class="btn primary" type="button" id="teachSendBtn">${escapeHtml(TEACH_PAGE.sendText)}</button>
            </div>
          </div>
        </div>
      </div>
    `.trim();
  }

  function makeCard(lesson, status) {
    const st = status === "filled" ? "SUDAH TERISI" : "BUTUH PENGAJAR";
    const badgeClass = status === "filled" ? "teach-badge filled" : "teach-badge needed";
    const metaA = lesson.category || "—";
    const metaB = lesson.level || "—";
    const metaC = `${meetingsOf(lesson)} pertemuan`;

    const card = document.createElement("button");
    card.type = "button";
    card.className = `teach-card ${status === "filled" ? "is-filled" : "is-needed"}`;
    card.dataset.key = teachKey(lesson);

    card.innerHTML = `
      <div class="${badgeClass}">${escapeHtml(st)}</div>
      <div class="teach-title">${escapeHtml(lesson.title || "")}</div>
      <div class="teach-meta">
        <span>${escapeHtml(metaA)}</span>
        <i class="dot"></i>
        <span>${escapeHtml(metaB)}</span>
        <i class="dot"></i>
        <span>${escapeHtml(metaC)}</span>
      </div>
      <div class="teach-hint">${escapeHtml(status === "filled" ? "Materi ini sudah memiliki pengajar." : "Klik untuk mendaftar sebagai pengajar.")}</div>
    `.trim();
    return card;
  }

  function renderTeach() {
    const sec = document.querySelector('.route[data-route="teach"]');
    if (!sec) return;

    // 1) Ganti total isi teach dari teach.js
    sec.innerHTML = buildTeachTemplate();

    const grid = $("#teachNeedGrid", sec);
    const summary = $("#teachNeedSummary", sec);
    const formPanel = $("#teachFormPanel", sec);
    const targetLabel = $("#teachTargetLabel", sec);
    const aboutText = $("#teachAboutText", sec);
    const nameEl = $("#teachName", sec);
    const waEl = $("#teachWA", sec);
    const expEl = $("#teachExp", sec);
    const closeBtn = $("#teachCloseBtn", sec);
    const sendBtn = $("#teachSendBtn", sec);

    const lessons = getLessonsSafe();
    const statusMap = getTeachStatusMap(lessons);

    const filledCount = lessons.filter(l => statusMap[teachKey(l)] === "filled").length;
    const neededCount = lessons.length - filledCount;
    if (summary) summary.textContent = `Menampilkan ${neededCount} materi yang masih membutuhkan pengajar. (${filledCount} materi sudah terisi.)`;

    // key -> lesson
    const byKey = new Map();
    lessons.forEach(l => byKey.set(teachKey(l), l));

    // render cards
    if (grid) {
      grid.innerHTML = "";
      lessons.forEach((lesson) => {
        const k = teachKey(lesson);
        const st = statusMap[k] === "filled" ? "filled" : "needed";

        // tampilkan hanya yang BUTUH PENGAJAR
        if (st === "filled") return;

        const card = makeCard(lesson, st);

        const openForm = (e) => {
          if (e) { e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation(); }
          const l = byKey.get(k) || lesson;

          const title = l.title || "-";
          const cat = l.category || "-";
          const level = l.level || "-";
          const mins = meetingsOf(l);

          if (targetLabel) targetLabel.textContent = `${title} • ${cat} • ${level}`;
          if (aboutText) aboutText.textContent = l.desc || TEACH_PAGE.aboutFallback;

          // simpan target ke dataset untuk pesan WA
          formPanel.dataset.targetTitle = title;
          formPanel.dataset.targetCategory = cat;
          formPanel.dataset.targetLevel = level;
          formPanel.dataset.targetMinutes = mins;

          formPanel.style.display = "";
          formPanel.scrollIntoView({ behavior: "smooth", block: "start" });
        };

        card.addEventListener("click", openForm, true);

        grid.appendChild(card);
      });
    }

    // close
    if (closeBtn) closeBtn.addEventListener("click", () => { formPanel.style.display = "none"; });

    // send wa
    if (sendBtn) {
      sendBtn.addEventListener("click", () => {
        const title = formPanel.dataset.targetTitle || "-";
        const cat = formPanel.dataset.targetCategory || "-";
        const level = formPanel.dataset.targetLevel || "-";
        const mins = formPanel.dataset.targetMinutes || "0";

        const name = (nameEl && nameEl.value || "").trim();
        const wa = (waEl && waEl.value || "").trim();
        const exp = (expEl && expEl.value || "").trim();

        const msg = [
          "Assalamualaikum admin, saya ingin daftar sebagai PENGAJAR.",
          "",
          "Target materi yang ingin saya ajarkan:",
          `• ${title}`,
          `• Kategori: ${cat}`,
          `• Level: ${level}`,
          `• Jumlah pertemuan: ${mins} pertemuan`,
          "",
          "Data saya:",
          `• Nama: ${name || "-"}`,
          `• Nomor WA saya (wajib): ${wa || "-"}`,
          `• Pengalaman singkat: ${exp || "-"}`,
          "",
          "Mohon konfirmasi pendaftaran saya. Terima kasih."
        ].join("\n");

        window.open(waLink(ADMIN_WA, msg), "_blank", "noopener,noreferrer");
      });
    }

    // Back button (data-go) dibiarkan ke handler global app.js, jadi tidak perlu diubah.
  }

  // =========================================================
  // Integrasi minimal (tanpa ubah file lain)
  // =========================================================
  // Jika app.js masih memanggil renderTeachNeeds()/bindTeach(), kita override ke renderTeach()
  // agar konten teach tidak lagi dikontrol dari app.js.
  window.renderTeachPage = renderTeach;
  window.renderTeachNeeds = renderTeach;
  window.bindTeach = function () { /* no-op, semua dikontrol di teach.js */ };

  function bootIfTeach() {
    const r = (location.hash || "#home").replace("#", "");
    if (r === "teach") renderTeach();
  }

  document.addEventListener("DOMContentLoaded", bootIfTeach);
  window.addEventListener("hashchange", bootIfTeach);
})();