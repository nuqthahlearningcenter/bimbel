/* subjects-pages.js (patched)
 * Ruang Belajar per tombol dengan data terpisah, TANPA konflik dengan halaman Bimbel.
 *
 * Perubahan utama:
 * - Untuk key: nahwu/sharaf/balaghah/mantiq/adabul_bahs/semua -> ambil dari window.SUBJECT_MATERIALS[key]
 * - Klik card membuka modal lesson yang sudah ada (openLessonModal di app.js)
 * - Key online/offline/intensif tetap mengarah ke halaman bimbel yang sudah ada (explore/offline/intensif)
 */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);

  const ROUTE = "subject";

  const SUBJECT_INFO = {
    online: { title: "Bimbel Online", subtitle: "Mahasiswa/Umum • Mahasiswa/Umum", icon: "🌐", mode: "explore" },
    offline: { title: "Bimbel Offline", subtitle: "Mahasiswa/Umum • Mahasiswa/Umum", icon: "🏫", mode: "offline" },
    intensif: { title: "Intensif", subtitle: "Mahasiswa/Umum • Mahasiswa/Umum", icon: "⚡", mode: "intensif" },

    nahwu: { title: "Nahwu", subtitle: "Kitab-kitab Nahwu", icon: "📘", mode: "subject" },
    sharaf: { title: "Sharaf", subtitle: "Kitab-kitab Sharaf", icon: "📗", mode: "subject" },
    balaghah: { title: "Balaghah", subtitle: "Kitab-kitab Balaghah", icon: "🗣️", mode: "subject" },
    mantiq: { title: "Mantiq", subtitle: "Kitab-kitab Mantiq", icon: "🧠", mode: "subject" },
    adabul_bahs: { title: "Adabul Bahs", subtitle: "Adab al-Bahth wal Munazharah", icon: "🧾", mode: "subject" },
    semua: { title: "Semua Pelajaran", subtitle: "Ringkasan semua kitab", icon: "🧩", mode: "subject" },
  };

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizeText(s) {
    return String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function parseHash() {
    const raw = (location.hash || "").replace(/^#/, "");
    const [name, qs] = raw.split("?");
    return { name: name || "home", qs: qs || "" };
  }

  function getHashParam(key) {
    const { qs } = parseHash();
    if (!qs) return "";
    const sp = new URLSearchParams(qs);
    return sp.get(key) || "";
  }

  function setHash(name, params = {}) {
    const sp = new URLSearchParams(params);
    const q = sp.toString();
    location.hash = q ? `#${name}?${q}` : `#${name}`;
  }

  function ensureRoute() {
    const shell = $("#pageShell");
    if (!shell) return;

    const direct = shell.querySelector(`:scope > .route[data-route="${ROUTE}"], :scope > #route-subject`);
    if (direct) return;

    const sec = document.createElement("section");
    sec.className = "route";
    sec.id = "route-subject";
    sec.dataset.route = ROUTE;
    sec.setAttribute("aria-label", "Ruang Belajar");
    sec.innerHTML = template();
    shell.appendChild(sec);
  }

  function template() {
    return `
      <div class="sp-page" id="spPage">
        <header class="sp-header" id="spHeader">
          <div class="sp-appbar">
            <button class="sp-back" id="spBack" type="button" aria-label="Kembali">←</button>
            <div class="sp-search">
              <span class="sp-search-ico" aria-hidden="true">🔎</span>
              <input id="spSearchInput" type="search" placeholder="Cari topik, video, dan lainnya" />
              <button id="spSearchClear" class="sp-search-clear" type="button" aria-label="Hapus">✕</button>
            </div>
          </div>

          <div class="sp-hero" id="spHero">
            <div class="sp-hero-left">
              <div class="sp-title" id="spTitle">Ruang Belajar</div>
              <div class="sp-subtitle" id="spSubtitle">—</div>
            </div>
            <div class="sp-hero-right" aria-hidden="true">
              <div class="sp-hero-icon" id="spHeroIcon">📘</div>
            </div>
          </div>
        </header>

        <main class="sp-content" id="spContent">
          <div class="sp-section-title">Semua Bab</div>
          <div class="sp-list" id="spList"></div>
          <div class="sp-empty" id="spEmpty" hidden>
            <b>Tidak ada materi.</b>
            <div class="sp-empty-sub">Coba kata kunci lain.</div>
          </div>
        </main>
      </div>
    `;
  }

  function getBimbelLessons(mode) {
    if (mode === "offline") return (window.LESSONS_OFFLINE_DATA || []).slice();
    if (mode === "intensif") return (window.LESSONS_INTENSIF_DATA || []).slice();
    return (window.LESSONS_DATA || []).slice();
  }

  function getSubjectLessons(key) {
    const map = window.SUBJECT_MATERIALS || {};
    const arr = map[key];
    if (Array.isArray(arr)) return arr.slice();
    return [];
  }

  function renderList(lessons, filterText) {
    const list = $("#spList");
    const empty = $("#spEmpty");
    if (!list || !empty) return;

    const q = normalizeText(filterText || "");
    const filtered = q
      ? lessons.filter(l => normalizeText(`${l.title} ${l.desc} ${l.category} ${l.level}`).includes(q))
      : lessons;

    list.innerHTML = "";

    if (filtered.length === 0) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    filtered.forEach((lesson, idx) => {
      const el = document.createElement("div");
      el.className = "sp-card";
      el.setAttribute("role", "button");
      el.tabIndex = 0;

      const icon = "🌐🏫⚡".includes(lesson.icon) ? lesson.icon : "📘";

      el.innerHTML = `
        <div class="sp-left">
          <div class="sp-thumb" aria-hidden="true">${escapeHtml(icon)}</div>
        </div>

        <div class="sp-mid">
          <div class="sp-badges">
            ${idx % 2 === 0 ? `<span class="sp-free">1 Sub-bab Gratis</span>` : ``}
          </div>

          <div class="sp-title2">${escapeHtml(lesson.title || `Bab ${idx + 1}`)}</div>

          <div class="sp-meta">
            <div class="sp-brand">${escapeHtml((lesson.category || "MATERI").toUpperCase())}</div>
            <div class="sp-progress" aria-hidden="true"><i style="width:0%"></i></div>
            <div class="sp-pct">0%</div>
          </div>
        </div>

        <div class="sp-right">
          <button class="sp-dl" type="button" aria-label="Aksi">↓</button>
        </div>
      `;

      const open = () => {
        // Kalau ada openLessonModal dari app.js, pakai itu agar modal konsisten.
        if (typeof window.openLessonModal === "function") {
          window.openLessonModal(lesson);
          return;
        }

        // Fallback minimal (jika openLessonModal tidak ada)
        if (lesson.url) window.open(lesson.url, "_blank", "noopener,noreferrer");
        else if (window.toast) window.toast("Info", "URL materi belum diisi.");
      };

      el.addEventListener("click", (e) => {
        const isDl = e.target && e.target.closest && e.target.closest(".sp-dl");
        if (isDl) {
          open();
          return;
        }
        open();
      });
      el.addEventListener("keydown", (e) => { if (e.key === "Enter") open(); });

      list.appendChild(el);
    });
  }

  function bindScrollHeader() {
    const header = $("#spHeader");
    if (!header) return;

    const onScroll = () => {
      header.classList.toggle("is-scrolled", (window.scrollY || 0) > 18);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function renderSubjectPage() {
    ensureRoute();

    const key = (getHashParam("key") || "nahwu").toLowerCase();
    const info = SUBJECT_INFO[key] || { title: "Ruang Belajar", subtitle: "—", icon: "📚", mode: "subject" };

    const titleEl = $("#spTitle");
    const subEl = $("#spSubtitle");
    const icoEl = $("#spHeroIcon");

    if (titleEl) titleEl.textContent = info.title;
    if (subEl) subEl.textContent = info.subtitle;
    if (icoEl) icoEl.textContent = info.icon;

    const input = $("#spSearchInput");
    const clear = $("#spSearchClear");
    const back = $("#spBack");

    const syncClear = () => {
      const has = !!(input && (input.value || "").trim());
      if (clear) clear.style.display = has ? "grid" : "none";
    };

    if (back && !back.dataset.bound) {
      back.dataset.bound = "1";
      back.addEventListener("click", () => setHash("home"));
    }

    // Data source
    let lessons = [];
    if (info.mode === "explore" || info.mode === "offline" || info.mode === "intensif") {
      lessons = getBimbelLessons(info.mode);
    } else {
      lessons = getSubjectLessons(key);
    }

    if (input && !input.dataset.bound) {
      input.dataset.bound = "1";
      input.addEventListener("input", () => {
        syncClear();
        renderList(lessons, input.value);
      });
      input.addEventListener("focus", () => renderList(lessons, input.value));
    }

    if (clear && !clear.dataset.bound) {
      clear.dataset.bound = "1";
      clear.addEventListener("click", () => {
        if (input) input.value = "";
        syncClear();
        renderList(lessons, "");
        input && input.focus();
      });
    }

    syncClear();
    renderList(lessons, input ? input.value : "");

    bindScrollHeader();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  window.renderSubjectPage = renderSubjectPage;

  // Intercept tombol Ruang Belajar di Home (tanpa ubah app.js)
  function bindHomeSubjectButtons() {
    document.addEventListener("click", (e) => {
      const btn = e.target && e.target.closest ? e.target.closest(".subject-btn") : null;
      if (!btn) return;

      const lbl = (btn.textContent || "").replace(/\s+/g, " ").trim();
      if (!lbl) return;

      const map = {
        "Bimbel Online": "online",
        "Bimbel Offline": "offline",
        "Pembelajaran Intensif": "intensif",
        "Nahwu": "nahwu",
        "Sharaf": "sharaf",
        "Balaghah": "balaghah",
        "Mantiq": "mantiq",
        "Adabul Bahs": "adabul_bahs",
        "Semua Pelajaran": "semua",
      };

      const key = map[lbl];
      if (!key) return;

      e.preventDefault();
      e.stopPropagation();
      setHash(ROUTE, { key });
    }, true);
  }

  document.addEventListener("DOMContentLoaded", () => {
    ensureRoute();
    bindHomeSubjectButtons();
  });
})();
