
function hideSplash() {
  const splash = document.getElementById('splash');
  if (!splash) return;
  splash.classList.add('hide');
  // remove after transition
  setTimeout(() => { try { splash.remove(); } catch (e) { } }, 1000);
}

/* MASISIR — Nuqthah Learn (V6)
   Single-page app (hash router)
   Data mode: Hybrid (File + localStorage)
*/

(() => {
  "use strict";

  // Inject tiny CSS for inline home quick-mode row (no HTML structure change)
  (function injectHomeQuickModeCSS() {
    if (document.getElementById("homeQuickModeCSS")) return;
    const css = `
      .quick-filter #homeQuickModeRow { margin-top: 10px; }
      .quick-filter #homeQuickModeRow .mode-actions { display:flex; gap:10px; }
      /* Samakan style tombol mode dengan tombol aksi (.btn.soft) */
      .quick-filter #homeQuickModeRow .mode-actions .qf-mode-btn{
        flex:1 1 0;
        display:inline-flex;
        align-items:center;
        justify-content:center;
        border-radius: 999px !important;
        padding: 8px 10px !important;
        font-size: 12px !important;
        font-weight: 900 !important;
        min-height: 38px;
      }
      /* Inactive: gunakan varian soft bawaan (.btn.soft) */
      .quick-filter #homeQuickModeRow .mode-actions .qf-mode-btn:not(.is-active){
        opacity: .95;
      }
      /* Active: mirip state aktif chip */
     .quick-filter #homeQuickModeRow .mode-actions .qf-mode-btn.is-active{
  border-color: rgb(146 71 0) !important;
  background: color-mix(in srgb, #f4a417 86%, transparent) !important;
  color: #ffffff !important;
}

    `;
    const st = document.createElement("style");
    st.id = "homeQuickModeCSS";
    st.textContent = css;
    document.head.appendChild(st);
  })();

  // =========================
  // Config
  // =========================
  const ADMIN_WA = "6285185409887";
  const ALLOWED_SELLERS = ["6282124305514"];     // bisa diganti/tambah oleh admin
  const ALLOWED_REPORTERS = ["201503468476"];    // bisa diganti/tambah oleh admin

  // Konfigurasi tombol di modal materi (edit di lessons-data.js)
  const LESSON_ACTIONS = window.LESSON_ACTIONS || {};

  const LS = {
    THEME: "nuqthah_theme",
    ROUTE: "nuqthah_route",
    EXPLORE_CAT: "nuqthah_explore_cat",
    OFFLINE_CAT: "nuqthah_offline_cat",
    INTENSIF_CAT: "nuqthah_intensif_cat",
    FOCUS: "nuqthah_focus_state",
    NOTES: "nuqthah_notes",
    PRODUCTS_EXTRA: "nuqthah_products_extra",
    NEWS_EXTRA: "nuqthah_news_extra",
    GLOBAL_Q: "nuqthah_global_q",
    SUBJECTS_EXTRA: "nuqthah_subjects_extra"
  };

  const PAGE_SIZE_PRODUCTS = 8;
  const PAGE_SIZE_NEWS = 6;

  // =========================
  // Helpers
  // =========================
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Pastikan tombol mode (Bimbel Online/Offline/Intensif) selalu bisa diklik
  // walaupun ada handler lain yang mengganggu.
  (function bindHomeModeButtonsDirect() {
    document.addEventListener("click", (e) => {
      const a = e.target && e.target.closest ? e.target.closest("a.mode-btn[data-route], a.mode-btn[href^='#']") : null;
      if (!a) return;

      // Batasi hanya tombol mode di area Home Quick Modes
      const inHomeModes = a.closest && a.closest(".home-quick-modes, #homeQuickModeRow, .home-material-modes");
      if (!inHomeModes) return;

      const route = (a.getAttribute("data-route") || (a.getAttribute("href") || "").replace(/^#/, "") || "").trim();
      if (!route) return;

      e.preventDefault();
      e.stopPropagation();
      location.hash = `#${route}`;
    }, true);
  })();



  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  function normalizeWA(wa) {
    return String(wa || "")
      .replace(/[^\d]/g, "")
      .replace(/^0/, "62")
      .trim();
  }

  function waLink(wa, text) {
    const n = normalizeWA(wa);
    const msg = encodeURIComponent(String(text || ""));
    // Standard WhatsApp deeplink (works on mobile + webview + desktop)
    return `https://wa.me/${n}?text=${msg}`;
  }


  function applyTemplate(tpl, vars) {
    return String(tpl || "")
      .replaceAll("{title}", vars.title ?? "")
      .replaceAll("{category}", vars.category ?? "")
      .replaceAll("{level}", vars.level ?? "")
      .replaceAll("{meetings}", vars.meetings ?? "")
      .replaceAll("{teacher}", vars.teacher ?? "")
      .replaceAll("{price}", vars.price ?? "");
  }

  function getLessonPriceLabel(lesson) {
    return (lesson && lesson.priceLabel) || (LESSON_ACTIONS && LESSON_ACTIONS.priceLabel) || "Rp 100K";
  }

  function getLessonPaymentWA(lesson) {
    return (lesson && lesson.paymentWa) ||
      (LESSON_ACTIONS && LESSON_ACTIONS.payment && LESSON_ACTIONS.payment.waNumber) ||
      (LESSON_ACTIONS && LESSON_ACTIONS.adminWa) ||
      null;
  }

  function getLessonRegisterUrl(lesson) {
    return (lesson && (lesson.formUrl || lesson.registerUrl)) ||
      (LESSON_ACTIONS && LESSON_ACTIONS.register && LESSON_ACTIONS.register.formUrl) ||
      (LESSON_ACTIONS && LESSON_ACTIONS.googleFormUrl) ||
      "";
  }

  function safeJsonParse(s, fallback) {
    // JSON.parse(null) menghasilkan null (tidak error), jadi harus dipaksa fallback
    if (s === null || s === undefined || s === "") return fallback;
    try {
      const v = JSON.parse(s);
      return (v === null ? fallback : v);
    } catch {
      return fallback;
    }
  }


  function toast(title, msg) {
    const el = $("#toast");
    $("#toastTitle").textContent = title || "Info";
    $("#toastMsg").textContent = msg || "";
    el.classList.add("show");
    window.clearTimeout(toast._t);
    toast._t = window.setTimeout(() => el.classList.remove("show"), 3600);
  }

  function setYear() {
    const y = $("#year");
    if (y) y.textContent = String(new Date().getFullYear());
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  // =========================
  // Lesson helpers (availability + meetings)
  // =========================
  function getMeetingsFromLesson(l) {
    const m = Number(l && l.meetings);
    if (!Number.isNaN(m) && m > 0) return m;
    const ch = (l && Array.isArray(l.chapters)) ? l.chapters.filter(Boolean) : [];
    if (ch.length) return ch.length;
    return 1;
  }


  function isLessonAvailable(l) {
    if (typeof l?.available === "boolean") return l.available;

    // If single-link lesson
    if (l?.url || l?.driveId) return true;

    // If chapter-based lesson: available if any chapter available
    const ch = (l && Array.isArray(l.chapters)) ? l.chapters.filter(Boolean) : [];
    if (!ch.length) return false;
    return ch.some((c) => {
      if (typeof c?.available === "boolean") return c.available;
      return !!(c?.url || c?.driveId || c?.audioDriveId);
    });
  }

  // =========================
  // Theme (dark mode) — only in Settings page button
  // =========================
  function applyTheme(theme) {
    const t = theme === "dark" ? "dark" : "light";
    document.body.classList.toggle("dark", t === "dark");
    localStorage.setItem(LS.THEME, t);
  }

  function initTheme() {
    const saved = localStorage.getItem(LS.THEME);
    if (saved) {
      applyTheme(saved);
    } else {
      // respect system preference
      const prefers = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      applyTheme(prefers ? "dark" : "light");
    }
  }


  function renderSubjectPageSafe() {
    try { window.renderSubjectPage(); } catch (e) { /* noop */ }
  }

  // =========================
  // Router
  // =========================
  // NOTE: tambah 2 route baru: offline & intensif
  const routes = ["home", "teach", "explore", "offline", "intensif", "tips", "learn", "market", "news", "teacher", "settings", "subject", "paket-online", "paket-offline", "paket-intensif", "tanya-langsung"];
  // IMPORTANT: set to null so the first render always happens.
  // If this is set to "home", initial load would no-op when start route is home.
  let currentRoute = null;

  // Show the Livin-like top bar ONLY on Home
  function updateTopbarVisibility(routeName) {
    // simpan route aktif ke <body> supaya CSS bisa spesifik per halaman
    try { document.body.setAttribute('data-route', routeName); } catch (e) { }

    const topbar = document.getElementById('mTopbar');
    if (!topbar) return;

    // Topbar hanya tampil di Home
    topbar.style.display = (routeName === 'home') ? '' : 'none';
  }



  function parseHash() {
    const h = (location.hash || "").replace(/^#/, "");
    if (!h) return "home";
    const [name] = h.split("?");
    return routes.includes(name) ? name : "home";
  }

  function setRoute(name, { save = true } = {}) {
    const next = routes.includes(name) ? name : "home";
    if (save) localStorage.setItem(LS.ROUTE, next);
    if (location.hash.replace(/^#/, "") !== next) {
      location.hash = `#${next}`;
      return;
    }
    // already there
    renderRoute(next);
  }

  // expose router for other modules (packages.js, etc.)
  window.setRoute = setRoute;


  function renderRoute(name) {
    updateTopbarVisibility(name);

    // Jika user menekan tombol untuk halaman yang sama (mis. logo M ketika sudah di Home,
    // atau ikon settings ketika sudah di Pengaturan), jangan lakukan animasi leave/enter
    // karena itu membuat konten terlihat "hilang" sesaat.
    if (name === currentRoute) {
      const shell = $("#pageShell");
      const sec = shell && $(`.route[data-route="${name}"]`, shell);

      if (name === "teacher") {
        if (typeof window.fixTeacherRoute === "function") window.fixTeacherRoute();

        // Pastikan route yg sama tetap terlihat (punya active + enter)
        if (sec) {
          sec.classList.add("active", "enter");
          sec.classList.remove("leave");
        }

      }


      window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
      return;
    }


    currentRoute = name;
    const shell = $("#pageShell");

    // leave old
    $$(".route.active", shell).forEach(sec => {
      sec.classList.remove("enter");
      sec.classList.add("leave");
      window.setTimeout(() => {
        sec.classList.remove("active", "leave");
      }, 220);
    });

    // enter new
    const sec = $(`.route[data-route="${name}"]`, shell);
    if (!sec) return;
    sec.classList.add("active");
    // next tick for transition
    requestAnimationFrame(() => sec.classList.add("enter"));

    // per-route hooks
    if (name === "teach") {
      if (typeof window.renderTeachPage === "function") {
        try { window.renderTeachPage(); } catch (e) { renderTeachNeeds(); }
      } else {
        renderTeachNeeds();
      }
    }
    if (name === "home") {
      renderHomeQuickChips();
      bindHomeModeQuickFilter();
    }
    if (name === "explore") renderExplore();
    if (name === "offline") renderOffline();
    if (name === "intensif") renderIntensif();
    if (name === "learn") renderLearn();
    if (name === "market") renderMarket();
    if (name === "news") renderNews();
    if (name === "settings") renderSettings();
    if (name === "subject") renderSubjectPageSafe();

    // Paket pages (paket-online/offline/intensif/tanya-langsung)
    if (typeof window.renderPackagesRoute === "function") {
      try { window.renderPackagesRoute(name); } catch (e) { console.warn(e); }
    }

    // scroll to top when changing route
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function initRouter() {
    window.addEventListener("hashchange", () => renderRoute(parseHash()));
    const start = parseHash() || localStorage.getItem(LS.ROUTE) || "home";
    // If first load has no hash, set it and render immediately using "start"
    if (!location.hash) {
      location.hash = `#${start}`;
      renderRoute(start);
      return;
    }
    renderRoute(parseHash() || "home");
  }

  // =========================
  // Data (Hybrid)
  // =========================
  function getLessons() {
    return (window.LESSONS_DATA || []).slice();
  }

  // Materi khusus: Offline & Intensif (data dari file terpisah)
  function getLessonsOffline() {
    return (window.LESSONS_OFFLINE_DATA || []).slice();
  }

  function getLessonsIntensif() {
    return (window.LESSONS_INTENSIF_DATA || []).slice();
  }
  function getProducts() {
    const base = (window.PRODUCTS_DATA || []).slice();
    const extra = safeJsonParse(localStorage.getItem(LS.PRODUCTS_EXTRA), []);
    return base.concat(Array.isArray(extra) ? extra : []);
  }

  function saveExtraProducts(items) {
    localStorage.setItem(LS.PRODUCTS_EXTRA, JSON.stringify(items || []));
  }

  function getNews() {
    const base = (window.NEWS_DATA || []).slice();
    const extra = safeJsonParse(localStorage.getItem(LS.NEWS_EXTRA), []);
    return base.concat(Array.isArray(extra) ? extra : []);
  }

  function saveExtraNews(items) {
    localStorage.setItem(LS.NEWS_EXTRA, JSON.stringify(items || []));
  }

  // =========================
  // Global Search (Home - Mobile)
  // =========================
  function normalizeText(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function getTeachersFromDom() {
    // Ambil data pengajar dari DOM (route teacher) agar otomatis ikut saat kamu update HTML.
    const names = new Set();
    const items = [];

    // coba dua versi: id route-teacher (index.html) atau template dari teacher-fix.js
    const root = document.getElementById("route-teacher") || document.querySelector('[data-route="teacher"]');
    if (!root) return items;

    const nodes = Array.from(root.querySelectorAll(".tp-name"));
    nodes.forEach(n => {
      const name = (n.textContent || "").trim();
      if (!name || names.has(name)) return;
      names.add(name);

      // meta (kalau ada)
      let meta = "Pengajar";
      const box = n.closest(".tp-info-box");
      const metaEl = box ? box.querySelector(".tp-meta") : null;
      if (metaEl && metaEl.textContent) meta = metaEl.textContent.trim();

      items.push({
        kind: "Pengajar",
        title: name,
        subtitle: meta,
        route: "teacher",
        payload: { name }
      });
    });
    return items;
  }

  function buildGlobalSearchIndex() {
    const lessons = getLessons().map(l => ({
      kind: "Materi",
      title: l.title,
      subtitle: `${l.category || "—"} • ${l.level || "—"}`,
      route: "explore",
      payload: { lessonId: l.id }
    }));

    const news = getNews().map(n => ({
      kind: "Info",
      title: n.title,
      subtitle: `${n.org || "—"} • ${n.field || "—"}`,
      route: "news",
      payload: { newsId: n.id }
    }));

    const products = getProducts().map(p => ({
      kind: "Produk",
      title: p.name,
      subtitle: `${(p.type || "—").toUpperCase()} • Rp ${p.price || "-"}`,
      route: "market",
      payload: { productId: p.id }
    }));

    const teachers = getTeachersFromDom();

    const all = lessons.concat(teachers, news, products);
    return all.map(x => {
      const blob = normalizeText(`${x.title} ${x.subtitle} ${x.kind}`);
      return { ...x, _blob: blob };
    });
  }

  function searchGlobalIndex(index, q, limit = 8) {
    const query = normalizeText(q);
    if (!query) return [];

    const tokens = query.split(" ").filter(Boolean);
    const scored = [];
    for (const item of index) {
      let ok = true;
      for (const t of tokens) {
        if (!item._blob.includes(t)) { ok = false; break; }
      }
      if (!ok) continue;

      // skor sederhana: lebih pendek & match di awal lebih tinggi
      const pos = item._blob.indexOf(tokens[0]);
      const score = (pos === 0 ? 30 : pos > 0 ? 20 : 10) + Math.max(0, 20 - item._blob.length / 30);
      scored.push({ item, score });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(x => x.item);
  }

  function renderHomeGlobalResults(results, q) {
    const box = $("#homeGlobalResults");
    if (!box) return;

    if (!q || results.length === 0) {
      box.innerHTML = q ? `<div class="wr-empty">Tidak ada hasil untuk “${escapeHtml(q)}”.</div>` : "";
      box.hidden = !q;
      return;
    }

    const total = results.length;
    box.innerHTML = `
      <div class="wr-head"><b>Hasil pencarian</b><span>${total} ditampilkan</span></div>
      <div class="wr-list">
        ${results.map((r, i) => `
          <div class="wr-item" role="button" tabindex="0" data-idx="${i}">
            <b>${escapeHtml(r.title)}</b>
            <small>${escapeHtml(r.kind)} • ${escapeHtml(r.subtitle || "")}</small>
          </div>
        `).join("")}
      </div>
    `;
    box.hidden = false;

    // click handlers
    $$(".wr-item", box).forEach(el => {
      const idx = Number(el.dataset.idx || 0);
      const item = results[idx];
      const go = () => openGlobalSearchResult(item, q);
      el.addEventListener("click", go);
      el.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
    });
  }

  function openGlobalSearchResult(item, q) {
    // simpan query agar halaman tujuan bisa pakai (Explore/News/Market)
    try { localStorage.setItem(LS.GLOBAL_Q, String(q || "")); } catch (e) { }

    // navigasi
    setRoute(item.route);
  }

  function initHomeGlobalSearch() {
    const input = $("#homeGlobalSearch");
    const clear = $("#homeGlobalClear");
    const results = $("#homeGlobalResults");
    if (!input || !clear || !results) return;

    // build index lazily (teacher dom needs to exist)
    let index = [];
    const ensureIndex = () => {
      if (index.length) return;
      index = buildGlobalSearchIndex();
    };

    const syncClear = () => {
      const has = !!(input.value || "").trim();
      clear.style.display = has ? "grid" : "none";
      if (!has) { results.hidden = true; results.innerHTML = ""; }
    };

    const run = () => {
      const q = (input.value || "").trim();
      syncClear();
      if (!q) return;
      ensureIndex();
      const found = searchGlobalIndex(index, q, 8);
      renderHomeGlobalResults(found, q);
    };

    input.addEventListener("input", run);
    input.addEventListener("focus", run);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        input.value = "";
        syncClear();
      }
    });

    clear.addEventListener("click", () => {
      input.value = "";
      syncClear();
      input.focus();
    });

    // tutup dropdown saat klik luar
    document.addEventListener("click", (e) => {
      const wrap = e.target && e.target.closest ? e.target.closest(".home-global-search") : null;
      if (!wrap) {
        results.hidden = true;
      }
    });
  }

  // =========================
  // Explore
  // =========================
  let exploreCategory = "all";
  let offlineCategory = "all";
  let intensifCategory = "all";

  function lessonCategories(lessons) {
    const set = new Set(lessons.map(x => x.category).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  function setExploreCategory(cat) {
    exploreCategory = cat || "all";
    localStorage.setItem(LS.EXPLORE_CAT, exploreCategory);
    renderExplore();
  }

  function setOfflineCategory(cat) {
    offlineCategory = cat || "all";
    localStorage.setItem(LS.OFFLINE_CAT, offlineCategory);
    renderOffline();
  }

  function setIntensifCategory(cat) {
    intensifCategory = cat || "all";
    localStorage.setItem(LS.INTENSIF_CAT, intensifCategory);
    renderIntensif();
  }

  // =========================
  // Home: Pelajaran Favorit (grid seperti screenshot)
  // - 8 tombol utama
  // - Tombol "Semua Pelajaran" membuka bottom-sheet berisi tombol tambahan
  // - Ada opsi tambah tombol (disimpan di localStorage)
  // =========================
  const SUBJECTS_MAIN = [
    { key: "online", label: "Bimbel Online", icon: "🌐", route: "explore", category: "all" },
    { key: "offline", label: "Bimbel Offline", icon: "🏫", route: "offline", category: "all" },

    { key: "nahwu", label: "Nahwu", icon: "📘", route: "explore", category: "all", query: "Nahwu" },
    { key: "sharaf", label: "Sharaf", icon: "📗", route: "explore", category: "all", query: "Sharaf" },
    { key: "balaghah", label: "Balaghah", icon: "🗣️", route: "explore", category: "all", query: "Balaghah" },
    { key: "mantiq", label: "Mantiq", icon: "🧠", route: "explore", category: "all", query: "Mantiq" },
    { key: "adabul", label: "Adabul Bahs", icon: "🧾", route: "explore", category: "all", query: "Adabul" },

    { key: "all", label: "Semua Pelajaran", icon: "▦", special: "all" },
  ];


  const SUBJECTS_MORE_DEFAULT = [
    { key: "fiqih", label: "Fiqih", icon: "📙", route: "explore", category: "all", query: "Fiqih" },
    { key: "ushul_fiqih", label: "Ushul Fiqih", icon: "📙", route: "explore", category: "all", query: "Ushul Fiqih" },
    { key: "aqidah", label: "Aqidah", icon: "🕌", route: "explore", category: "all", query: "Aqidah" },
    { key: "tafsir", label: "Tafsir", icon: "📖", route: "explore", category: "all", query: "Tafsir" },
    { key: "hadits", label: "Hadits", icon: "📜", route: "explore", category: "all", query: "Hadits" },
  ];

  function loadExtraSubjects() {
    const extra = safeJsonParse(localStorage.getItem(LS.SUBJECTS_EXTRA), []);
    return Array.isArray(extra) ? extra : [];
  }

  function saveExtraSubjects(list) {
    try { localStorage.setItem(LS.SUBJECTS_EXTRA, JSON.stringify(list || [])); } catch (e) { }
  }

  function allMoreSubjects() {
    // gabungkan default + extra user
    const extra = loadExtraSubjects();
    const seen = new Set();
    const merged = [];
    [...SUBJECTS_MORE_DEFAULT, ...extra].forEach(s => {
      const key = String(s.key || s.label || "").trim().toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      merged.push({
        key,
        label: String(s.label || "").trim() || "Pelajaran",
        icon: String(s.icon || "📚"),
        route: (s.route === "offline" || s.route === "intensif") ? s.route : "explore",
        category: String(s.category || "all"),
        query: String(s.query || "").trim(),
      });
    });
    return merged;
  }

  function subjectRouteConfig(route) {
    if (route === "offline") return { route: "offline", lsKey: LS.OFFLINE_CAT };
    if (route === "intensif") return { route: "intensif", lsKey: LS.INTENSIF_CAT };
    return { route: "explore", lsKey: LS.EXPLORE_CAT };
  }

  function goBySubject(s) {
    // BUKA halaman khusus Ruang Belajar (route: #subject)
    // Kirim juga metadata untuk tombol tambahan (title/icon/mode/q),
    // tapi untuk tombol utama cukup param key saja.
    const params = new URLSearchParams();
    params.set("key", String(s.key || "").toLowerCase());

    if (s.label) params.set("title", String(s.label));
    if (s.icon) params.set("icon", String(s.icon));
    if (s.route) params.set("mode", String(s.route)); // explore/offline/intensif
    if (s.query) params.set("q", String(s.query));

    location.hash = `#subject?${params.toString()}`;
  }

  function makeSubjectButton(s) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "subject-btn";

    const rawLabel = String(s.label ?? "");
    b.setAttribute("aria-label", rawLabel.replace(/\r?\n/g, " "));

    b.innerHTML = `
    <span class="subject-ico" aria-hidden="true">${s.icon ?? ""}</span>
    <span class="subject-lbl">${escapeHtml(rawLabel).replace(/\r?\n/g, "<br>")}</span>
  `.trim();

    b.addEventListener("click", () => {
      if (s.special === "all") return openSubjectsSheet();
      goBySubject(s);
    });

    return b;
  }



  function ensureSubjectsSheetStyle() {
    if (document.getElementById("subjectsSheetStyle")) return;
    const st = document.createElement("style");
    st.id = "subjectsSheetStyle";
    st.textContent = `
      .subjects-sheet-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);display:none;align-items:flex-end;justify-content:center;z-index:1600}
      .subjects-sheet-overlay.show{display:flex}
      .subjects-sheet{width:min(720px,100%);background:var(--surface-solid);border-radius:26px 26px 0 0;box-shadow:0 -26px 90px rgba(0,0,0,.35);overflow:hidden}
      .subjects-sheet-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:16px 16px 10px}
      .subjects-sheet-title{font-size:18px;font-weight:1000;letter-spacing:-.2px}
      .subjects-sheet-close{border:0;background:rgba(0,0,0,.08);width:38px;height:38px;border-radius:14px;cursor:pointer;font-weight:1000}
      body.dark .subjects-sheet-close{background:rgba(255,255,255,.10)}
      .subjects-sheet-body{padding:0 16px 16px}
      .subjects-sheet-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;padding:10px 0 2px}
      .subjects-sheet-form{margin-top:14px;padding:12px;border-radius:18px;border:1px solid var(--border);background: #ffffff}
      .subjects-sheet-form .row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      .subjects-sheet-form label{font-size:12px;font-weight:900;color:var(--muted);display:block;margin:2px 0 6px}
      .subjects-sheet-form input,.subjects-sheet-form select{width:100%;border-radius:14px;border:1px solid var(--border);background: #ffffff;color:var(--text);padding:10px 12px;font-weight:800}
      .subjects-sheet-form .actions{display:flex;gap:10px;justify-content:flex-end;margin-top:10px}
      .subjects-sheet-form .mini{padding:10px 12px;border-radius:999px;font-size:12px;font-weight:1000}
      .subjects-sheet-list{margin-top:10px;display:flex;flex-wrap:wrap;gap:10px}
      .subjects-sheet-pill{display:inline-flex;align-items:center;gap:8px;padding:8px 10px;border-radius:999px;border:1px solid var(--border);background: #ffffff;font-weight:900;font-size:12px}
      .subjects-sheet-pill button{border:0;background:rgba(0,0,0,.10);width:26px;height:26px;border-radius:999px;cursor:pointer}
      body.dark .subjects-sheet-pill button{background:rgba(255,255,255,.12)}
    `;
    document.head.appendChild(st);
  }

  function ensureSubjectsSheet() {
    ensureSubjectsSheetStyle();
    let ov = document.getElementById("subjectsSheetOverlay");
    if (ov) return ov;

    ov = document.createElement("div");
    ov.id = "subjectsSheetOverlay";
    ov.className = "subjects-sheet-overlay";
    ov.innerHTML = `
      <div class="subjects-sheet" role="dialog" aria-modal="true" aria-label="Semua pelajaran">
        <div class="subjects-sheet-head">
          <div class="subjects-sheet-title">Semua Pelajaran</div>
          <button class="subjects-sheet-close" type="button" aria-label="Tutup">✕</button>
        </div>
        <div class="subjects-sheet-body">
          <div class="subjects-sheet-grid" id="subjectsSheetGrid"></div>

          <div class="subjects-sheet-form" aria-label="Tambah tombol">
            <div class="muted" style="font-weight:900">Tambah tombol baru</div>
            <div class="row" style="margin-top:10px">
              <div>
                <label>Nama tombol</label>
                <input id="subjName" placeholder="Contoh: Faraidh" />
              </div>
              <div>
                <label>Kata kunci (untuk pencarian)</label>
                <input id="subjQuery" placeholder="Contoh: Faraidh" />
              </div>
              <div>
                <label>Tujuan</label>
                <select id="subjRoute">
                  <option value="explore">Cari Materi (Online)</option>
                  <option value="offline">Bimbel Offline</option>
                  <option value="intensif">Intensif</option>
                </select>
              </div>
              <div>
                <label>Icon (emoji)</label>
                <input id="subjIcon" placeholder="📚" maxlength="3" />
              </div>
            </div>

            <div class="actions">
              <button class="btn btn-soft mini" type="button" id="subjReset">Reset</button>
              <button class="btn primary mini" type="button" id="subjAdd">Tambah</button>
            </div>

            <div class="muted" style="margin-top:8px">Tombol tambahan tersimpan di HP (localStorage).</div>
            <div class="subjects-sheet-list" id="subjectsExtraList"></div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(ov);

    // close
    const close = ov.querySelector(".subjects-sheet-close");
    close.addEventListener("click", closeSubjectsSheet);

    ov.addEventListener("click", (e) => {
      if (e.target === ov) closeSubjectsSheet();
    });

    // add handlers
    ov.querySelector("#subjReset").addEventListener("click", () => {
      ov.querySelector("#subjName").value = "";
      ov.querySelector("#subjQuery").value = "";
      ov.querySelector("#subjRoute").value = "explore";
      ov.querySelector("#subjIcon").value = "";
    });

    ov.querySelector("#subjAdd").addEventListener("click", () => {
      const name = (ov.querySelector("#subjName").value || "").trim();
      const query = (ov.querySelector("#subjQuery").value || "").trim();
      const route = (ov.querySelector("#subjRoute").value || "explore").trim();
      const icon = (ov.querySelector("#subjIcon").value || "📚").trim() || "📚";

      if (!name) return toast("Nama kosong", "Isi nama tombol dulu.");
      if (!query) return toast("Kata kunci kosong", "Isi kata kunci pencarian dulu.");

      const extra = loadExtraSubjects();
      extra.unshift({
        key: `u_${Date.now()}`,
        label: name,
        query,
        route,
        icon
      });
      saveExtraSubjects(extra);

      // reset inputs
      ov.querySelector("#subjName").value = "";
      ov.querySelector("#subjQuery").value = "";
      ov.querySelector("#subjRoute").value = "explore";
      ov.querySelector("#subjIcon").value = "";

      renderSubjectsSheet();
      toast("Tersimpan", "Tombol baru ditambahkan.");
    });

    return ov;
  }

  function renderSubjectsExtraPills(ov) {
    const list = ov.querySelector("#subjectsExtraList");
    if (!list) return;
    const extra = loadExtraSubjects();

    list.innerHTML = "";
    if (!extra.length) {
      list.innerHTML = `<span class="muted">Belum ada tombol tambahan buatan kamu.</span>`;
      return;
    }

    extra.slice(0, 30).forEach((s, idx) => {
      const pill = document.createElement("div");
      pill.className = "subjects-sheet-pill";
      pill.innerHTML = `
        <span aria-hidden="true">${escapeHtml(String(s.icon || "📚"))}</span>
        <span>${escapeHtml(String(s.label || "Pelajaran"))}</span>
        <button type="button" aria-label="Hapus">✕</button>
      `;
      pill.querySelector("button").addEventListener("click", () => {
        const next = loadExtraSubjects().filter((_, i) => i !== idx);
        saveExtraSubjects(next);
        renderSubjectsSheet();
        toast("Dihapus", "Tombol dihapus.");
      });
      list.appendChild(pill);
    });
  }

  function renderSubjectsSheet() {
    const ov = ensureSubjectsSheet();
    const grid = ov.querySelector("#subjectsSheetGrid");
    if (!grid) return;

    grid.innerHTML = "";
    allMoreSubjects().forEach(s => grid.appendChild(makeSubjectButton(s)));

    renderSubjectsExtraPills(ov);
  }

  function openSubjectsSheet() {
    const ov = ensureSubjectsSheet();
    renderSubjectsSheet();
    ov.classList.add("show");
  }

  function closeSubjectsSheet() {
    const ov = document.getElementById("subjectsSheetOverlay");
    if (ov) ov.classList.remove("show");
  }

  function renderHomeQuickChips() {
    const wrap = $("#homeQuickChips");
    if (!wrap) return;

    wrap.innerHTML = "";
    SUBJECTS_MAIN.forEach(s => wrap.appendChild(makeSubjectButton(s)));
  }


  // =========================
  // Home: Quick Filter Modal (Online/Offline/Intensif)
  // - Dibuka dari 3 tombol mode di Home (.home-material-modes .mode-btn)
  // - Tanpa mengubah struktur HTML lain (modal + CSS dibuat via JS)
  // =========================
  let qfModalState = { mode: "explore" };

  function ensureQuickFilterModalStyle() {
    if (document.getElementById("qfModalStyle")) return;
    const st = document.createElement("style");
    st.id = "qfModalStyle";
    st.textContent = `
      .qf-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);display:none;align-items:center;justify-content:center;padding:22px;z-index:1400}
      .qf-modal-overlay.show{display:flex}
      .qf-modal{width:min(560px,100%);border-radius:28px;background:#efe7ff;box-shadow:0 26px 110px rgba(0,0,0,.25);overflow:hidden}
      .qf-modal-inner{padding:22px}
      .qf-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:16px}
      .qf-modal-title{font-size:30px;line-height:1.05;font-weight:1000;letter-spacing:-.6px;color:#0b0b0b}
      .qf-close{width:42px;height:42px;border-radius:14px;border:0;background:rgba(0,0,0,.10);color:#0b0b0b;font-weight:1000;cursor:pointer}
      .qf-modal .qf-mode-row{display:flex;gap:10px;justify-content:space-between;margin:10px 0 18px}
      .qf-modal .qf-mode-btn{flex:1 1 0;border:0;border-radius:999px;padding:8px 10px;font-size:12px;font-weight:1000;cursor:pointer;background: color-mix(in srgb, var(--surface-solid) 70%, transparent); color: var(--text); border: 1px solid var(--border)}
      .qf-modal .qf-mode-btn.is-active{background: radial-gradient(260px 120px at 20% 0%, rgb(var(--primary-rgb) / .22), transparent 60%), color-mix(in srgb, var(--surface-solid) 70%, transparent)}
      .qf-modal .qf-chips{display:flex;flex-wrap:wrap;gap:10px;padding-top:8px}
      .qf-modal .qf-chip-btn{border:0;border-radius:999px;padding:8px 10px;font-size:16px;font-weight:1000;cursor:pointer;background: radial-gradient(260px 120px at 20% 0%, rgb(var(--primary-rgb) / .22), transparent 60%), color-mix(in srgb, var(--surface-solid) 70%, transparent);color:#fff}
      .qf-modal .qf-chip-btn:active{transform:translateY(1px)}
    `.trim();
    document.head.appendChild(st);
  }

  function ensureQuickFilterModal() {
    ensureQuickFilterModalStyle();

    let overlay = document.getElementById("qfModalOverlay");
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.id = "qfModalOverlay";
    overlay.className = "qf-modal-overlay";
    overlay.innerHTML = `
      <div class="qf-modal" role="dialog" aria-modal="true" aria-label="Filter Cepat">
        <div class="qf-modal-inner">
          <div class="qf-modal-head">
            <div class="qf-modal-title">Filter Cepat</div>
            <button class="qf-close" type="button" aria-label="Tutup">✕</button>
          </div>

          <div class="qf-mode-row" id="qfModeRow"></div>
          <div class="qf-chips" id="qfChipRow"></div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // close handlers
    const closeBtn = overlay.querySelector(".qf-close");
    if (closeBtn) closeBtn.addEventListener("click", closeQuickFilterModal);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeQuickFilterModal();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeQuickFilterModal();
    });

    return overlay;
  }

  function openQuickFilterModal(mode) {
    qfModalState.mode = (mode === "offline" || mode === "intensif") ? mode : "explore";
    const overlay = ensureQuickFilterModal();
    overlay.classList.add("show");
    renderQuickFilterModal();
  }

  function closeQuickFilterModal() {
    const overlay = document.getElementById("qfModalOverlay");
    if (!overlay) return;
    overlay.classList.remove("show");
  }

  function getModeConfig(mode) {
    if (mode === "offline") {
      return { mode: "offline", getLessons: () => getLessonsOffline(), lsKey: LS.OFFLINE_CAT, route: "offline" };
    }
    if (mode === "intensif") {
      return { mode: "intensif", getLessons: () => getLessonsIntensif(), lsKey: LS.INTENSIF_CAT, route: "intensif" };
    }
    return { mode: "explore", getLessons: () => getLessons(), lsKey: LS.EXPLORE_CAT, route: "explore" };
  }

  function renderQuickFilterModal() {
    const overlay = ensureQuickFilterModal();
    const modeRow = overlay.querySelector("#qfModeRow");
    const chipRow = overlay.querySelector("#qfChipRow");
    if (!modeRow || !chipRow) return;

    const modes = [
      { key: "explore", text: "Online" },
      { key: "offline", text: "Ofline" },
      { key: "intensif", text: "Intensif" },
    ];

    // Top mode pills
    modeRow.innerHTML = modes.map(m => `
      <button type="button" class="btn soft qf-mode-btn ${qfModalState.mode === m.key ? "is-active" : ""}" data-mode="${m.key}">
        ${m.text}
      </button>
    `).join("");

    Array.from(modeRow.querySelectorAll(".qf-mode-btn")).forEach(btn => {
      btn.addEventListener("click", () => {
        qfModalState.mode = btn.getAttribute("data-mode") || "explore";
        renderQuickFilterModal();
      });
    });

    // Category chips
    const cfg = getModeConfig(qfModalState.mode);
    const lessons = cfg.getLessons();
    const categories = lessonCategories(lessons);

    chipRow.innerHTML = "";
    const addChip = (label, value) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "qf-chip-btn";
      b.textContent = label;
      b.addEventListener("click", () => {
        try { localStorage.setItem(cfg.lsKey, value); } catch (e) { }
        closeQuickFilterModal();
        setRoute(cfg.route);
      });
      chipRow.appendChild(b);
    };

    addChip("Semua", "all");
    categories.forEach(cat => addChip(cat, cat));
  }

  function bindHomeModeQuickFilter() {
    // Versi baru: tombol kategori di Home menggunakan grid "Pelajaran Favorit"
    // Sembunyikan 3 tombol lama (Online/Offline/Intensif) jika masih ada.
    const home = document.querySelector('.route[data-route="home"]');
    if (!home) return;

    const modesSection = home.querySelector(".home-material-modes");
    if (modesSection) modesSection.style.display = "none";

    // Render 8 tombol utama
    renderHomeQuickChips();
  }

  function updateHomeModeButtonsActive() {
    const home = document.querySelector('.route[data-route="home"]');
    if (!home) return;

    const mode = (window.__HOME_QF_MODE || "explore");
    const btns = home.querySelectorAll("#homeQuickModeRow .mode-actions .mode-btn");
    btns.forEach(btn => {
      const route =
        btn.getAttribute("data-route") ||
        (btn.getAttribute("href") || "").replace(/^#/, "") ||
        "explore";
      const isActive =
        (mode === "offline" && route === "offline") ||
        (mode === "intensif" && route === "intensif") ||
        (mode === "explore" && (route === "explore" || route === "home"));
      btn.classList.toggle("is-active", !!isActive);
    });
  }





  function renderExplore() {
    const lessons = getLessons();
    const chips = $("#categoryChips");
    const categories = lessonCategories(lessons);

    // Create chips (Explore) if empty or different
    if (chips && chips.childElementCount === 0) {
      chips.appendChild(makeChip("Semua", () => setExploreCategory("all"), "all"));
      categories.forEach(cat => chips.appendChild(makeChip(cat, () => setExploreCategory(cat), cat)));
    }

    // active chip styling
    const stored = localStorage.getItem(LS.EXPLORE_CAT) || "all";
    exploreCategory = stored;
    $$(".chip", chips).forEach(c => c.classList.toggle("is-active", c.dataset.value === exploreCategory));

    const searchInput = $("#searchInput");

    // Prefill from global search (Home search bar)
    const gq = (localStorage.getItem(LS.GLOBAL_Q) || "").trim();
    if (gq && searchInput) {
      searchInput.value = gq;
      // jangan hapus jika user lanjut cari di halaman lain; tapi supaya tidak "nyangkut" berlebihan,
      // kita hapus setelah diterapkan di Explore.
      try { localStorage.removeItem(LS.GLOBAL_Q); } catch (e) { }
    }
    const clear = $("#clearSearch");
    const query = (searchInput?.value || "").trim().toLowerCase();

    if (clear) clear.style.display = query ? "grid" : "none";

    const filtered = lessons.filter(l => {
      const inCat = exploreCategory === "all" || String(l.category).toLowerCase() === exploreCategory.toLowerCase();
      if (!inCat) return false;
      if (!query) return true;
      const hay = `${l.title} ${l.desc} ${l.category} ${l.level}`.toLowerCase();
      return hay.includes(query);
    });

    const grid = $("#classGrid");
    if (!grid) return;
    grid.innerHTML = "";

    filtered.forEach(lesson => grid.appendChild(renderLessonCard(lesson)));

    if (filtered.length === 0) {
      const empty = document.createElement("div");
      empty.className = "panel";
      empty.innerHTML = `<div class="panel-bd">
        <b>Tidak ada materi.</b>
        <p class="muted">Coba ganti kategori atau kata kunci.</p>
      </div>`;
      grid.appendChild(empty);
    }
  }

  // =========================
  // Offline & Intensif (halaman baru — struktur sama seperti Explore)
  // =========================
  function renderOffline() {
    const lessons = getLessonsOffline();
    const chips = $("#categoryChipsOffline");
    const categories = lessonCategories(lessons);

    if (chips && chips.childElementCount === 0) {
      chips.appendChild(makeChip("Semua", () => setOfflineCategory("all"), "all"));
      categories.forEach(cat => chips.appendChild(makeChip(cat, () => setOfflineCategory(cat), cat)));
    }

    offlineCategory = localStorage.getItem(LS.OFFLINE_CAT) || "all";
    $$(".chip", chips).forEach(c => c.classList.toggle("is-active", c.dataset.value === offlineCategory));

    const searchInput = $("#searchInputOffline");

    // Prefill dari tombol Home (pakai LS.GLOBAL_Q)
    const gq = (localStorage.getItem(LS.GLOBAL_Q) || "").trim();
    if (gq && searchInput) {
      searchInput.value = gq;
      try { localStorage.removeItem(LS.GLOBAL_Q); } catch (e) { }
    }
    const clear = $("#clearSearchOffline");
    const query = (searchInput?.value || "").trim().toLowerCase();
    if (clear) clear.style.display = query ? "grid" : "none";

    const filtered = lessons.filter(l => {
      const inCat = offlineCategory === "all" || String(l.category).toLowerCase() === offlineCategory.toLowerCase();
      if (!inCat) return false;
      if (!query) return true;
      const hay = `${l.title} ${l.desc} ${l.category} ${l.level}`.toLowerCase();
      return hay.includes(query);
    });

    const grid = $("#classGridOffline");
    if (!grid) return;
    grid.innerHTML = "";
    filtered.forEach(lesson => grid.appendChild(renderLessonCard(lesson)));

    if (filtered.length === 0) {
      const empty = document.createElement("div");
      empty.className = "panel";
      empty.innerHTML = `<div class="panel-bd">
        <b>Tidak ada materi.</b>
        <p class="muted">Coba ganti kategori atau kata kunci.</p>
      </div>`;
      grid.appendChild(empty);
    }
  }

  function renderIntensif() {
    const lessons = getLessonsIntensif();
    const chips = $("#categoryChipsIntensif");
    const categories = lessonCategories(lessons);

    if (chips && chips.childElementCount === 0) {
      chips.appendChild(makeChip("Semua", () => setIntensifCategory("all"), "all"));
      categories.forEach(cat => chips.appendChild(makeChip(cat, () => setIntensifCategory(cat), cat)));
    }

    intensifCategory = localStorage.getItem(LS.INTENSIF_CAT) || "all";
    $$(".chip", chips).forEach(c => c.classList.toggle("is-active", c.dataset.value === intensifCategory));

    const searchInput = $("#searchInputIntensif");

    // Prefill dari tombol Home (pakai LS.GLOBAL_Q)
    const gq = (localStorage.getItem(LS.GLOBAL_Q) || "").trim();
    if (gq && searchInput) {
      searchInput.value = gq;
      try { localStorage.removeItem(LS.GLOBAL_Q); } catch (e) { }
    }
    const clear = $("#clearSearchIntensif");
    const query = (searchInput?.value || "").trim().toLowerCase();
    if (clear) clear.style.display = query ? "grid" : "none";

    const filtered = lessons.filter(l => {
      const inCat = intensifCategory === "all" || String(l.category).toLowerCase() === intensifCategory.toLowerCase();
      if (!inCat) return false;
      if (!query) return true;
      const hay = `${l.title} ${l.desc} ${l.category} ${l.level}`.toLowerCase();
      return hay.includes(query);
    });

    const grid = $("#classGridIntensif");
    if (!grid) return;
    grid.innerHTML = "";
    filtered.forEach(lesson => grid.appendChild(renderLessonCard(lesson)));

    if (filtered.length === 0) {
      const empty = document.createElement("div");
      empty.className = "panel";
      empty.innerHTML = `<div class="panel-bd">
        <b>Tidak ada program.</b>
        <p class="muted">Coba ganti kategori atau kata kunci.</p>
      </div>`;
      grid.appendChild(empty);
    }
  }

  function makeChip(label, onClick, value, isHome = false) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.textContent = label;
    b.dataset.value = value;
    b.addEventListener("click", onClick);
    // prevent focus ring weird on mobile tap
    b.addEventListener("pointerdown", () => b.blur(), { passive: true });
    return b;
  }


  function renderLessonCard(lesson) {
    const card = document.createElement("div");
    card.className = "class-card";
    card.tabIndex = 0;

    const available = isLessonAvailable(lesson);
    const meetings = getMeetingsFromLesson(lesson);

    const badge = `<div class="badge new ${available ? "is-available" : "is-unavailable"}">${available ? "TERSEDIA" : "TIDAK TERSEDIA"}</div>`;
    const meta = `${lesson.category || "—"} • ${lesson.level || "—"} • ${meetings} pertemuan`;

    card.innerHTML = `
      ${badge}
      <h3>${escapeHtml(lesson.title)}</h3>
      <p>${escapeHtml(lesson.desc || "")}</p>
      <div class="meta">${escapeHtml(meta)}</div>
    `;

    const open = () => {
      if (!available) {
        toast("Belum tersedia", "Materi ini belum tersedia.");
        return;
      }
      openLessonEntry(lesson);
    };
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => { if (e.key === "Enter") open(); });

    return card;
  }


  // =========================
  // Focus Mode (Learn)
  // =========================
  function getFocusState() {
    return safeJsonParse(localStorage.getItem(LS.FOCUS), {
      selectedId: null,
      done: {},
    });
  }

  function setFocusState(next) {
    localStorage.setItem(LS.FOCUS, JSON.stringify(next));
  }

  function getNotes() {
    return safeJsonParse(localStorage.getItem(LS.NOTES), {});
  }

  function setNotes(notes) {
    localStorage.setItem(LS.NOTES, JSON.stringify(notes || {}));
  }

  function renderLearn() {
    const lessons = getLessons();
    const state = getFocusState();
    const list = $("#learnList");
    const count = $("#learnCount");
    if (!list) return;

    list.innerHTML = "";
    if (count) count.textContent = String(lessons.length);

    lessons.forEach(ls => {
      const item = document.createElement("div");
      item.className = "lesson-item";
      item.tabIndex = 0;
      item.dataset.id = ls.id;
      item.innerHTML = `
        <b>${escapeHtml(ls.title)}</b>
        <small>${escapeHtml(`${ls.category} • ${ls.level} • ${getMeetingsFromLesson(ls)} pertemuan`)}</small>
        <small>${escapeHtml(ls.desc || "")}</small>
      `;
      const pick = () => {
        state.selectedId = ls.id;
        setFocusState(state);
        applyLearnSelection(ls);
      };
      item.addEventListener("click", pick);
      item.addEventListener("keydown", (e) => { if (e.key === "Enter") pick(); });
      list.appendChild(item);
    });

    // restore selection
    const selected = lessons.find(x => x.id === state.selectedId) || lessons[0];
    if (selected) {
      state.selectedId = selected.id;
      setFocusState(state);
      applyLearnSelection(selected);
    }
    updateLearnProgress();
  }

  function applyLearnSelection(lesson) {
    const state = getFocusState();
    $$(".lesson-item").forEach(el => el.classList.toggle("active", el.dataset.id === lesson.id));

    $("#learnTitle").textContent = lesson.title;
    $("#learnMeta").textContent = `${lesson.category} • ${lesson.level} • ${getMeetingsFromLesson(lesson)} pertemuan`;

    const frame = $("#learnFrame");
    const empty = $("#learnEmpty");

    const url = String(lesson && lesson.url || "").trim();
    const hasRealUrl = !!(url && !/example\.com/i.test(url));

    if (frame && empty) {
      if (hasRealUrl) {
        empty.style.display = "none";
        frame.style.display = "block";
        frame.src = url;
      } else {
        frame.src = "";
        frame.style.display = "none";
        empty.style.display = "block";
        empty.textContent = "Preview materi belum tersedia.";
      }
    }

    // notes
    const notes = getNotes();
    const ta = $("#learnNotes");
    if (ta) {
      ta.value = notes[lesson.id] || "";
      ta.oninput = () => {
        const n = getNotes();
        n[lesson.id] = ta.value;
        setNotes(n);
      };
    }

    // actions
    const openBtn = $("#learnOpen");
    const doneBtn = $("#learnDone");
    if (openBtn) openBtn.onclick = () => {
      const url = String(lesson && lesson.url || "").trim();
      const hasRealUrl = !!(url && !/example\.com/i.test(url));
      if (hasRealUrl) window.open(url, "_blank", "noopener,noreferrer");
      else toast("Belum tersedia", "Link materi belum diisi.");
    };
    if (doneBtn) doneBtn.onclick = () => {
      state.done = state.done || {};
      state.done[lesson.id] = true;
      setFocusState(state);
      updateLearnProgress();
      toast("Tersimpan", "Materi ditandai selesai.");
    };
  }

  function updateLearnProgress() {
    const lessons = getLessons();
    const state = getFocusState();
    const doneMap = state.done || {};
    const doneCount = lessons.filter(x => doneMap[x.id]).length;
    const pct = lessons.length ? Math.round((doneCount / lessons.length) * 100) : 0;

    const bar = $("#learnBar");
    const pctEl = $("#learnPct");
    if (bar) bar.style.width = `${pct}%`;
    if (pctEl) pctEl.textContent = `${pct}%`;
  }

  // =========================
  // News
  // =========================
  let newsPage = 1;

  function renderNews() {
    const all = getNews().slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    const newsSearch = $("#newsSearch");
    const gq = (localStorage.getItem(LS.GLOBAL_Q) || "").trim();
    if (gq && newsSearch) {
      newsSearch.value = gq;
      try { localStorage.removeItem(LS.GLOBAL_Q); } catch (e) { }
    }
    const q = (newsSearch?.value || "").trim().toLowerCase();
    const org = ($("#orgFilter")?.value || "all");

    // fill org filter once
    const orgFilter = $("#orgFilter");
    if (orgFilter && orgFilter.dataset.filled !== "1") {
      const set = new Set(all.map(x => x.org).filter(Boolean));
      Array.from(set).sort((a, b) => a.localeCompare(b)).forEach(o => {
        const opt = document.createElement("option");
        opt.value = o;
        opt.textContent = o;
        orgFilter.appendChild(opt);
      });
      orgFilter.dataset.filled = "1";
    }

    const filtered = all.filter(n => {
      const matchOrg = org === "all" || String(n.org || "").toLowerCase() === org.toLowerCase();
      if (!matchOrg) return false;
      if (!q) return true;
      const hay = `${n.title} ${n.body} ${n.org} ${n.field}`.toLowerCase();
      return hay.includes(q);
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE_NEWS));
    newsPage = clamp(newsPage, 1, totalPages);

    const start = (newsPage - 1) * PAGE_SIZE_NEWS;
    const pageItems = filtered.slice(start, start + PAGE_SIZE_NEWS);

    const grid = $("#newsGrid");
    if (!grid) return;
    grid.innerHTML = "";

    pageItems.forEach(item => grid.appendChild(renderNewsCard(item)));

    if (pageItems.length === 0) {
      grid.innerHTML = `<div class="panel"><div class="panel-bd">
        <b>Tidak ada berita.</b>
        <p class="muted">Coba ganti filter atau kata kunci.</p>
      </div></div>`;
    }

    $("#newsPageInfo").textContent = `Halaman ${newsPage} / ${totalPages}`;
    $("#newsPrev").disabled = newsPage <= 1;
    $("#newsNext").disabled = newsPage >= totalPages;
  }

  function renderNewsCard(n) {
    const card = document.createElement("div");
    card.className = "news-card";
    const img = (n.images && n.images[0]) ? `<img class="news-img" src="${n.images[0]}" alt="" loading="lazy" decoding="async" />` : "";
    const date = n.date ? formatDate(n.date) : "—";
    card.innerHTML = `
      ${img}
      <h3>${escapeHtml(n.title)}</h3>
      <div class="meta2"><span>🏷️ ${escapeHtml(n.org || "—")}</span><span>•</span><span>${escapeHtml(n.field || "—")}</span><span>•</span><span>🗓️ ${escapeHtml(date)}</span></div>
      <p>${escapeHtml(snippet(n.body || "", 220))}</p>
      <button class="btn btn-soft" type="button">Baca lengkap</button>
    `;
    const btn = $("button", card);
    btn.addEventListener("click", () => openNewsModal(n));
    return card;
  }

  function openNewsModal(n) {
    openModal({
      title: n.title,
      subtitle: `${n.org || "—"} • ${n.field || "—"} • ${formatDate(n.date)}`,
      desc: n.body || "",
      badges: [
        `🏷️ ${n.org || "—"}`,
        `📌 ${n.field || "—"}`,
        `🗓️ ${formatDate(n.date)}`
      ],
      mode: "news",
      images: n.images || [],
      primary: { label: "Tutup", onClick: closeModal },
      secondary: { label: "—", onClick: null, hidden: true }
    });
  }

  // =========================
  // Marketplace
  // =========================
  let prodPage = 1;
  let prodFilter = "all";

  function renderMarket() {
    const all = getProducts().slice().reverse(); // newest last in base; reverse to show newest first
    const productSearch = $("#productSearch");
    const gq = (localStorage.getItem(LS.GLOBAL_Q) || "").trim();
    if (gq && productSearch) {
      productSearch.value = gq;
      try { localStorage.removeItem(LS.GLOBAL_Q); } catch (e) { }
    }
    const q = (productSearch?.value || "").trim().toLowerCase();

    const filtered = all.filter(p => {
      const inType = prodFilter === "all" || String(p.type || "").toLowerCase() === prodFilter;
      if (!inType) return false;
      if (!q) return true;
      const hay = `${p.name} ${p.desc} ${p.type} ${p.price}`.toLowerCase();
      return hay.includes(q);
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE_PRODUCTS));
    prodPage = clamp(prodPage, 1, totalPages);

    const start = (prodPage - 1) * PAGE_SIZE_PRODUCTS;
    const pageItems = filtered.slice(start, start + PAGE_SIZE_PRODUCTS);

    const grid = $("#productGrid");
    if (!grid) return;
    grid.innerHTML = "";
    pageItems.forEach(p => grid.appendChild(renderProductCard(p)));

    if (pageItems.length === 0) {
      grid.innerHTML = `<div class="panel"><div class="panel-bd">
        <b>Tidak ada produk.</b>
        <p class="muted">Coba ganti filter atau kata kunci.</p>
      </div></div>`;
    }

    $("#prodPageInfo").textContent = `Halaman ${prodPage} / ${totalPages}`;
    $("#prodPrev").disabled = prodPage <= 1;
    $("#prodNext").disabled = prodPage >= totalPages;

    // update active filter chips
    $$(".market-filters .chip").forEach(ch => ch.classList.toggle("is-active", ch.dataset.filter === prodFilter));
  }

  function renderProductCard(p) {
    const card = document.createElement("div");
    card.className = "product-card";
    const cover = (p.images && p.images[0]) ? p.images[0] : "";
    card.innerHTML = `
      <div class="product-cover">
        ${cover ? `<img src="${cover}" alt="" loading="lazy" decoding="async" />` : ""}
      </div>
      <div class="product-body">
        <div class="product-name">${escapeHtml(p.name)}</div>
        <div class="product-desc">${escapeHtml(snippet(p.desc || "", 80))}</div>
        <div class="product-row">
          <div class="product-price">Rp ${escapeHtml(p.price || "-")}</div>
          <div class="product-cta">Lihat</div>
        </div>
      </div>
    `;
    card.addEventListener("click", () => openProductModal(p));
    return card;
  }

  function openProductModal(p) {
    const buyText = `Assalamualaikum, saya tertarik dengan produk: ${p.name}. Apakah masih tersedia?`;
    const buyUrl = waLink(p.sellerWa, buyText);

    openModal({
      title: p.name,
      subtitle: `Jenis: ${(p.type || "—").toUpperCase()} • Penjual: ${maskWA(p.sellerWa)}`,
      desc: p.desc || "",
      badges: [
        `Rp ${p.price || "-"}`,
        `${(p.type || "—").toUpperCase()}`
      ],
      mode: "product",
      images: p.images || [],
      primary: {
        label: `Beli (WA)`,
        onClick: () => window.open(buyUrl, "_blank", "noopener,noreferrer")
      },
      secondary: { label: "Tutup", onClick: closeModal }
    });
  }

  // =========================
  // Modal (shared)
  // =========================
  let modalState = { mode: "lesson", images: [], idx: 0 };

  function openModal({ title, subtitle, desc, badges, mode, images, primary, secondary }) {
    modalState = { mode: mode || "lesson", images: images || [], idx: 0 };

    $("#modalTitle").textContent = title || "Preview";
    $("#modalSubtitle").textContent = subtitle || "—";
    $("#modalDesc").textContent = desc || "—";

    const badgesEl = $("#modalBadges");
    badgesEl.innerHTML = "";
    (badges || []).forEach(b => {
      const s = document.createElement("span");
      s.className = "tiny";
      s.textContent = b;
      badgesEl.appendChild(s);
    });

    const overlay = $("#modalOverlay");
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");

    const ph = $("#modalPlaceholder");
    const frame = $("#modalFrame");
    const carousel = $("#modalCarousel");
    const image = $("#modalImage");

    // reset visibility
    ph.style.display = "grid";
    frame.style.display = "none";
    carousel.hidden = true;


    // ensure carousel never overlays/takes taps when hidden
    carousel.style.display = "none";
    // default placeholder layout (can be overridden per mode)
    ph.style.placeItems = "center";
    ph.style.overflow = "hidden";
    ph.style.padding = "";
    if (modalState.mode === "product" || modalState.mode === "news") {
      // image carousel if any
      const imgs = (modalState.images || []).filter(Boolean);
      if (imgs.length > 0) {
        ph.style.display = "none";
        carousel.hidden = false;
        carousel.style.display = "grid";
        image.src = imgs[0];
        image.alt = title || "";
        renderDots(imgs.length);
        setDotActive(0);
      }
    } else if (modalState.mode === "chapter" || modalState.mode === "audio") {
      // custom content inside placeholder (chapter picker / login / audio)
      ph.style.display = "grid";
      // allow list to be scrolled & tapped on mobile
      ph.style.placeItems = "stretch";
      ph.style.overflow = "auto";
      ph.style.padding = "18px 16px 22px";

      frame.style.display = "none";
      frame.src = "";
      carousel.hidden = true;
      carousel.style.display = "none";
    } else {
      // lesson
      ph.style.display = "none";
      frame.style.display = "block";
      frame.src = subtitle && subtitle.includes("youtube") ? subtitle : ""; // not used; will be set by openLessonModal
    }

    // buttons
    const pBtn = $("#modalPrimary");
    const sBtn = $("#modalSecondary");
    const cBtn = $("#modalCancel");

    pBtn.textContent = primary?.label || "OK";
    pBtn.onclick = primary?.onClick || closeModal;

    if (secondary?.hidden) {
      sBtn.style.display = "none";
      sBtn.onclick = null;
    } else {
      sBtn.style.display = "inline-flex";
      sBtn.textContent = secondary?.label || "Buka";
      sBtn.onclick = secondary?.onClick || null;
    }

    cBtn.onclick = closeModal;

    // focus management
    $("#modalClose").focus();
  }

  function closeModal() {
    const overlay = $("#modalOverlay");
    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
    // stop iframe
    const frame = $("#modalFrame");
    frame.src = "";
  }



  // =========================
  // Access (Login removed)
  // =========================


  function drivePreviewUrlFromAny(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const m = raw.match(/\/d\/([a-zA-Z0-9_-]+)/);
    const id = m ? m[1] : raw;
    return `https://drive.google.com/file/d/${id}/preview`;
  }

  function openLessonEntry(lesson) {
    // Jika ada chapters: tampilkan picker (tanpa login/whitelist gate)
    const hasChapters = Array.isArray(lesson?.chapters) && lesson.chapters.length > 0;
    if (hasChapters) {
      openChapterPickerModal(lesson);
      return;
    }
    openLessonModal(lesson);
  }

  function openChapterPickerModal(lesson) {
    openModal({
      title: lesson.title,
      subtitle: "Pilih pertemuan",
      desc: "",
      badges: [],
      mode: "chapter",
      images: [],
      primary: { label: "Tutup", onClick: closeModal },
      secondary: { label: "—", onClick: null, hidden: true }
    });

    const ph = document.getElementById("modalPlaceholder");
    const chapters = (lesson.chapters || []).slice();

    const items = chapters.map((ch, idx) => {
      const label = String(ch.label || `Pertemuan ke-${idx + 1}`);
      const disabled = (ch.available === false);
      return `
        <button class="chapter-btn ${disabled ? "is-disabled" : ""}" type="button" data-idx="${idx}" ${disabled ? "disabled" : ""}>
          ${escapeHtml(label)}
        </button>`;
    }).join("");

    ph.innerHTML = `
      <div class="chapter-picker">
        ${items || `<div class="panel"><div class="panel-bd"><b>Tidak ada pelajaran.</b></div></div>`}
      </div>
    `;

    ph.querySelectorAll(".chapter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.idx || "0");
        const ch = chapters[idx];
        if (!ch) return;
        if (ch.available === false) {
          toast("Belum tersedia", "Pelajaran ini belum tersedia.");
          return;
        }
        openAudioModal(lesson, ch);
      });
    });
  }

  function openAudioModal(lesson, chapter) {
    const label = String(chapter.label || "");
    const src =
      (chapter.audioDriveId ? drivePreviewUrlFromAny(chapter.audioDriveId) :
        (chapter.driveId ? drivePreviewUrlFromAny(chapter.driveId) :
          (chapter.url || "")));

    if (!src) {
      toast("Tidak ada audio", "Link audio belum diisi.");
      return;
    }

    openModal({
      title: lesson.title,
      subtitle: label || "Audio",
      desc: "",
      badges: [],
      mode: "audio",
      images: [],
      primary: { label: "Tutup", onClick: closeModal },
      secondary: { label: "—", onClick: null, hidden: true }
    });

    const ph = document.getElementById("modalPlaceholder");
    ph.innerHTML = `
      <div class="audio-player">
        <iframe
          src="${src}"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowfullscreen
          referrerpolicy="strict-origin-when-cross-origin"
          loading="lazy"
        ></iframe>
        <div class="muted" style="margin-top:10px">
          Jika diminta akses, pastikan link/file-nya bisa diakses (public atau kamu punya izin).
        </div>
      </div>
    `;
  }
  function renderDots(n) {
    const dots = $("#icDots");
    dots.innerHTML = "";
    for (let i = 0; i < n; i++) {
      const d = document.createElement("i");
      dots.appendChild(d);
    }
  }

  function setDotActive(idx) {
    const dots = $$("#icDots i");
    dots.forEach((d, i) => d.classList.toggle("active", i === idx));
  }

  function stepCarousel(dir) {
    const imgs = (modalState.images || []).filter(Boolean);
    if (imgs.length === 0) return;
    modalState.idx = (modalState.idx + dir + imgs.length) % imgs.length;
    $("#modalImage").src = imgs[modalState.idx];
    setDotActive(modalState.idx);
  }

  // Lesson modal wrapper (sets iframe & actions)
  function openLessonModal(lesson) {
    // Anggap example.com sebagai link dummy (placeholder) agar tidak tampil di preview.
    const url = String(lesson && lesson.url || "").trim();
    const hasRealUrl = !!(url && !/example\.com/i.test(url));

    const meetings = getMeetingsFromLesson(lesson);

    const priceLabel = getLessonPriceLabel(lesson);

    const t = lesson && lesson.teacher ? lesson.teacher : null;
    const photo = t && t.photo ? t.photo : "./assets/images/nu.png";
    const name = t && t.name ? t.name : "Pengajar";
    const role = t && t.role ? t.role : "";
    const bio = t && t.bio ? t.bio : "";

    const metaBits = [
      lesson.category || "—",
      lesson.level || "—",
      (typeof lesson?.minutes === "number" && lesson.minutes > 0) ? `${lesson.minutes} menit` : `${meetings} pertemuan`
    ];
    const subtitle = metaBits.filter(Boolean).join(" • ");

    // BIO dipindah ke bagian "Tentang" (modalDesc)
    const aboutText = bio || lesson.desc || "";

    openModal({
      title: lesson.title,
      subtitle,
      desc: aboutText,
      badges: [
        priceLabel,
        lesson.category,
        lesson.level,
        (typeof lesson?.minutes === "number" && lesson.minutes > 0) ? `${lesson.minutes} menit` : `${meetings} pertemuan`
      ].filter(Boolean),
      mode: "lesson",
      images: [],
      primary: {
        label: "gabung grup WA",
        onClick: () => {
          const st = getFocusState();
          st.selectedId = lesson.id;
          setFocusState(st);

          const wa = getLessonPaymentWA(lesson);
          if (!wa) {
            toast("Nomor WA belum diatur", "Atur payment.waNumber di lessons-data.js");
            return;
          }

          const tpl = (lesson && lesson.paymentMessageTemplate)
            || (LESSON_ACTIONS && LESSON_ACTIONS.payment && LESSON_ACTIONS.payment.messageTemplate)
            || "Assalamualaikum, saya ingin mengirim bukti pembayaran untuk materi: {title} ({price}).";

          const msg = applyTemplate(tpl, {
            title: lesson.title,
            category: lesson.category || "",
            level: lesson.level || "",
            meetings: String(meetings),
            teacher: (t && t.name) ? t.name : "",
            price: priceLabel
          });
          // Redirect langsung supaya di HP/WebView tidak dianggap popup.
          window.location.href = waLink(wa, msg);
        }
      },
      secondary: {
        label: "Beli Materi",
        onClick: () => {
          const formUrl = getLessonRegisterUrl(lesson);
          if (!formUrl) {
            toast("Link daftar belum diatur", "Atur register.formUrl di lessons-data.js");
            return;
          }
          // Sama seperti WA: lebih aman pakai redirect langsung.
          window.location.href = formUrl;
        },
        hidden: !getLessonRegisterUrl(lesson)
      }
    });

    const frame = $("#modalFrame");
    const ph = $("#modalPlaceholder");
    const carousel = $("#modalCarousel");

    // pastikan mode lesson tidak menampilkan carousel produk
    if (carousel) carousel.hidden = true;

    // Jika ada URL valid, tampilkan iframe seperti biasa.
    if (hasRealUrl) {
      if (ph) {
        ph.classList.remove("is-teacher-hero");
        ph.style.display = "none";
        ph.innerHTML = "Loading preview…";
      }
      if (frame) {
        frame.style.display = "block";
        frame.src = url;
      }
      return;
    }

    // Jika URL kosong / placeholder, tampilkan FOTO PENGAJAR penuh (full-bleed)
    if (frame) {
      frame.src = "";
      frame.style.display = "none";
    }
    if (!ph) return;

    ph.style.display = "block";
    ph.classList.add("is-teacher-hero");
    ph.innerHTML = `
      <div class="modal-teacher-hero">
        <img class="modal-teacher-img" src="${escapeHtml(photo)}" alt="${escapeHtml(name)}"
          loading="lazy" decoding="async"
          onerror="this.style.display='none'; this.parentElement.classList.add('noimg');" />
        <div class="modal-teacher-overlay">
          <div class="modal-teacher-name">${escapeHtml(name)}</div>
          ${role ? `<div class="modal-teacher-role">${escapeHtml(role)}</div>` : ``}
        </div>
      </div>
    `;
  }

  // Expose modal opener for external modules (subjects-pages.js, etc.)
  window.openLessonModal = openLessonModal;


  // =========================
  // Settings (admin panels)
  // =========================
  const admin = {
    seller: false,
    reporter: false
  };

  function isAllowed(wa, role) {
    const n = normalizeWA(wa);
    if (!n) return false;
    if (role === "seller") return ALLOWED_SELLERS.map(normalizeWA).includes(n);
    if (role === "reporter") return ALLOWED_REPORTERS.map(normalizeWA).includes(n);
    return false;
  }

  function setAdminStatus() {
    const status = $("#adminStatus");
    const sellerPanel = $("#sellerPanel");
    const reporterPanel = $("#reporterPanel");

    const parts = [];
    if (admin.seller) parts.push("Seller ✅");
    if (admin.reporter) parts.push("Reporter ✅");
    const text = parts.length ? parts.join(" • ") : "terkunci";

    status.textContent = `Status: ${text}`;
    sellerPanel.hidden = !admin.seller;
    reporterPanel.hidden = !admin.reporter;
  }

  function renderSettings() {
    setAdminStatus();
  }

  async function compressImageToDataURL(file, { maxW = 1200, quality = 0.78, mime = "image/webp" } = {}) {
    // Some browsers may not support webp in canvas; fallback to jpeg.
    const img = await fileToImage(file);
    const { width, height } = img;

    const scale = Math.min(1, maxW / width);
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, w, h);

    // try webp then fallback
    let out = "";
    try {
      out = canvas.toDataURL(mime, quality);
      if (!out.startsWith("data:image")) throw new Error("bad");
    } catch {
      out = canvas.toDataURL("image/jpeg", Math.min(0.85, quality + 0.1));
    }
    return out;
  }

  function fileToImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };
      img.src = url;
    });
  }

  async function handleAddProduct() {
    const name = ($("#pName").value || "").trim();
    const desc = ($("#pDesc").value || "").trim();
    const price = ($("#pPrice").value || "").trim();
    const type = $("#pType").value || "barang";
    const sellerWa = ($("#pSellerWA").value || "").trim();
    const files = $("#pImages").files;

    if (!name || !desc || !price || !sellerWa) {
      toast("Lengkapi data", "Nama, deskripsi, harga, dan WA penjual wajib diisi.");
      return;
    }

    const normSeller = normalizeWA(sellerWa);
    if (!normSeller) {
      toast("WA tidak valid", "Gunakan format angka, contoh: 62812...");
      return;
    }

    const images = [];
    if (files && files.length) {
      try {
        for (const f of Array.from(files).slice(0, 8)) {
          const dataUrl = await compressImageToDataURL(f, { maxW: 1200, quality: 0.78 });
          images.push(dataUrl);
        }
      } catch (e) {
        console.warn(e);
        toast("Gagal upload", "Jika gagal, kirim foto ke admin untuk ditambahkan manual.");
      }
    }

    const extra = safeJsonParse(localStorage.getItem(LS.PRODUCTS_EXTRA), []);
    const item = {
      id: `pr_${Date.now()}`,
      name, desc, type,
      price,
      sellerWa: normSeller,
      images: images.length ? images : []
    };
    extra.unshift(item);
    saveExtraProducts(extra);

    // reset form
    $("#pName").value = "";
    $("#pDesc").value = "";
    $("#pPrice").value = "";
    $("#pSellerWA").value = "";
    $("#pImages").value = "";

    toast("Tersimpan", "Produk baru ditambahkan.");
  }

  async function handleAddNews() {
    const title = ($("#nTitle").value || "").trim();
    const body = ($("#nBody").value || "").trim();
    const org = ($("#nOrg").value || "").trim();
    const field = ($("#nField").value || "").trim();
    const file = $("#nImage").files && $("#nImage").files[0];

    if (!title || !body || !org || !field) {
      toast("Lengkapi data", "Judul, isi, organisasi, dan bidang wajib diisi.");
      return;
    }

    const images = [];
    if (file) {
      try {
        images.push(await compressImageToDataURL(file, { maxW: 1400, quality: 0.78 }));
      } catch (e) {
        console.warn(e);
        toast("Gagal upload", "Jika gagal, kirim foto ke admin untuk ditambahkan manual.");
      }
    }

    const extra = safeJsonParse(localStorage.getItem(LS.NEWS_EXTRA), []);
    extra.unshift({
      id: `nw_${Date.now()}`,
      title,
      body,
      org,
      field,
      date: new Date().toISOString().slice(0, 10),
      images
    });
    saveExtraNews(extra);

    // reset
    $("#nTitle").value = "";
    $("#nBody").value = "";
    $("#nOrg").value = "";
    $("#nField").value = "";
    $("#nImage").value = "";

    // reset org filter list to rebuild on news route
    const orgFilter = $("#orgFilter");
    if (orgFilter) orgFilter.dataset.filled = "0";

    toast("Tersimpan", "Berita baru ditambahkan.");
  }

  // =========================
  // Misc UI bindings
  // =========================
  function bindNav() {
    // data-go buttons
    $$("[data-go]").forEach(el => {
      el.addEventListener("click", () => setRoute(el.dataset.go));
      el.addEventListener("pointerdown", () => el.blur(), { passive: true });
      // allow keyboard
      if (el.classList.contains("brand")) {
        el.addEventListener("keydown", (e) => { if (e.key === "Enter") setRoute("home"); });
      }
    });

    // shortcuts (E/T/L etc)
    window.addEventListener("keydown", (e) => {
      if (e.target && ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      const k = e.key.toLowerCase();
      if (k === "e") setRoute("explore");
      if (k === "t") setRoute("tips");
      if (k === "l") setRoute("learn");
      if (k === "s") setRoute("settings");
      if (k === "escape") closeModal();
    });
  }

  function bindExplore() {
    const s = $("#searchInput");
    const clear = $("#clearSearch");
    const reset = $("#resetFilters");

    if (s) s.addEventListener("input", renderExplore);
    if (clear) clear.addEventListener("click", () => { s.value = ""; renderExplore(); s.focus(); });

    if (reset) reset.addEventListener("click", () => {
      localStorage.setItem(LS.EXPLORE_CAT, "all");
      exploreCategory = "all";
      if (s) s.value = "";
      renderExplore();
      toast("Reset", "Filter dikembalikan.");
    });
  }

  function bindOffline() {
    const s = $("#searchInputOffline");
    const clear = $("#clearSearchOffline");
    const reset = $("#resetFiltersOffline");

    if (s) s.addEventListener("input", renderOffline);
    if (clear) clear.addEventListener("click", () => { s.value = ""; renderOffline(); s.focus(); });

    if (reset) reset.addEventListener("click", () => {
      localStorage.setItem(LS.OFFLINE_CAT, "all");
      offlineCategory = "all";
      if (s) s.value = "";
      renderOffline();
      toast("Reset", "Filter dikembalikan.");
    });
  }

  function bindIntensif() {
    const s = $("#searchInputIntensif");
    const clear = $("#clearSearchIntensif");
    const reset = $("#resetFiltersIntensif");

    if (s) s.addEventListener("input", renderIntensif);
    if (clear) clear.addEventListener("click", () => { s.value = ""; renderIntensif(); s.focus(); });

    if (reset) reset.addEventListener("click", () => {
      localStorage.setItem(LS.INTENSIF_CAT, "all");
      intensifCategory = "all";
      if (s) s.value = "";
      renderIntensif();
      toast("Reset", "Filter dikembalikan.");
    });
  }

  function bindLearn() {
    const reset = $("#learnReset");
    if (reset) reset.addEventListener("click", () => {
      localStorage.removeItem(LS.FOCUS);
      localStorage.removeItem(LS.NOTES);
      toast("Reset", "Progress & catatan dihapus.");
      renderLearn();
    });
  }

  function bindMarket() {
    const search = $("#productSearch");
    const clear = $("#clearProductSearch");

    if (search) search.addEventListener("input", () => { prodPage = 1; renderMarket(); });
    if (clear) clear.addEventListener("click", () => { search.value = ""; prodPage = 1; renderMarket(); search.focus(); });

    // filter chips
    $$(".market-filters .chip").forEach(ch => {
      ch.addEventListener("click", () => {
        prodFilter = ch.dataset.filter || "all";
        prodPage = 1;
        renderMarket();
      });
    });

    $("#prodPrev").addEventListener("click", () => { prodPage--; renderMarket(); });
    $("#prodNext").addEventListener("click", () => { prodPage++; renderMarket(); });
  }

  function bindNews() {
    const s = $("#newsSearch");
    const org = $("#orgFilter");
    if (s) s.addEventListener("input", () => { newsPage = 1; renderNews(); });
    if (org) org.addEventListener("change", () => { newsPage = 1; renderNews(); });

    $("#newsPrev").addEventListener("click", () => { newsPage--; renderNews(); });
    $("#newsNext").addEventListener("click", () => { newsPage++; renderNews(); });
  }

  function bindSettings() {
    const darkBtn = $("#darkToggleSettings");
    if (darkBtn) darkBtn.addEventListener("click", () => {
      const isDark = document.body.classList.contains("dark");
      applyTheme(isDark ? "light" : "dark");
      toast("Tampilan", isDark ? "Mode terang aktif." : "Mode gelap aktif.");
    });

    // gate
    $("#unlockSeller").addEventListener("click", () => {
      const wa = $("#adminWA").value;
      if (!isAllowed(wa, "seller")) {
        toast("Tidak diizinkan", "Nomor ini belum terdaftar sebagai Seller. Daftar ke admin dan minta nomor kamu ditambahkan.");
        return;
      }
      admin.seller = true;
      setAdminStatus();
      toast("Unlocked", "Panel Seller aktif.");
    });

    $("#unlockReporter").addEventListener("click", () => {
      const wa = $("#adminWA").value;
      if (!isAllowed(wa, "reporter")) {
        toast("Tidak diizinkan", "Nomor ini belum terdaftar sebagai Reporter. Daftar ke admin dan minta nomor kamu ditambahkan.");
        return;
      }
      admin.reporter = true;
      setAdminStatus();
      toast("Unlocked", "Panel Reporter aktif.");
    });

    $("#lockAdmin").addEventListener("click", () => {
      admin.seller = false;
      admin.reporter = false;
      setAdminStatus();
      toast("Terkunci", "Panel admin dimatikan.");
    });

    $("#addProduct").addEventListener("click", handleAddProduct);
    $("#addNews").addEventListener("click", handleAddNews);

    // register buttons in settings
    $("#btnRegisterSeller2").addEventListener("click", () => openRegister("seller"));
    $("#btnRegisterReporter").addEventListener("click", () => openRegister("reporter"));
  }



  // =========================
  // Teach Needs (Daftar Pengajar -> materi yang diajarkan)
  // =========================
  const LS_TEACH_NEEDS = "masisir_teach_needs_v1";
  function getTeachNeedsState() {
    // Bentuk data:
    // { "<lessonId>": "filled" | "needed" }
    // Default: beberapa diisi sebagai contoh agar 2 status muncul.
    const base = {};
    const lessons = getLessons();
    lessons.forEach((l, i) => {
      base[l.id] = (i === 0) ? "filled" : "needed";
    });
    const saved = safeJsonParse(localStorage.getItem(LS_TEACH_NEEDS), null);
    if (!saved || typeof saved !== "object") return base;
    return { ...base, ...saved };
  }

  function renderTeachNeeds() {
    const lessons = getLessons();
    const state = getTeachNeedsState();

    const grid = $("#teachNeedGrid");
    const summary = $("#teachNeedSummary");
    if (!grid) return;

    grid.innerHTML = "";

    const filled = lessons.filter(l => state[l.id] === "filled");
    const needed = lessons.filter(l => state[l.id] !== "filled");

    if (summary) {
      summary.textContent = `Status pengajar: ${filled.length} materi terisi • ${needed.length} materi masih membutuhkan pengajar.`;
    }

    lessons.forEach(lesson => {
      const st = state[lesson.id] === "filled" ? "TERISI" : "BUTUH PENGAJAR";
      const badgeClass = state[lesson.id] === "filled" ? "badge" : "badge new";
      const meta = `${lesson.category || "—"} • ${lesson.level || "—"} • ${getMeetingsFromLesson(lesson)} pertemuan`;

      const card = document.createElement("div");
      card.className = "class-card";
      card.tabIndex = 0;

      card.innerHTML = `
        <div class="${badgeClass}">${st}</div>
        <h3>${escapeHtml(lesson.title)}</h3>
        <p>${escapeHtml(lesson.desc || "")}</p>
        <div class="meta">${escapeHtml(meta)}</div>
      `;

      const open = () => openLessonEntry(lesson);
      card.addEventListener("click", open);
      card.addEventListener("keydown", (e) => { if (e.key === "Enter") open(); });

      grid.appendChild(card);
    });

    if (lessons.length === 0) {
      grid.innerHTML = `<div class="panel"><div class="panel-bd">
        <b>Tidak ada materi.</b>
        <p class="muted">Data materi belum tersedia.</p>
      </div></div>`;
    }
  }

  function bindTeach() {
    const btn = $("#teachRegisterBtn");
    if (btn) btn.addEventListener("click", () => openRegister("teacher"));
  }

  function bindHome() {
    $("#btnRegisterSeller").addEventListener("click", () => openRegister("seller"));

    // Tombol "Daftar Pengajar" di home dialihkan ke halaman baru (teach),
    // sedangkan tombol WA admin pengajar tetap tersedia di halaman teach.
    const teacherBtn = $("#btnRegisterTeacher");
    if (teacherBtn) {
      teacherBtn.addEventListener("click", () => setRoute("teach"));
    }
  }

  function openRegister(kind) {
    let text = "";
    if (kind === "seller") {
      text = [
        "Assalamualaikum admin, saya ingin daftar sebagai SELLER di Masisir.",
        "",
        "• Nama:",
        "• Nomor WA saya (wajib):",
        "• Jenis barang/jasa:",
        "• Catatan: mohon tambahkan nomor WA saya ke sistem Seller.",
        "",
        "Jika ingin upload foto, saya siap kirim foto produk ke admin jika diperlukan."
      ].join("\n");
    } else if (kind === "reporter") {
      text = [
        "Assalamualaikum admin, saya ingin daftar sebagai REPORTER (pemberita) di Masisir.",
        "",
        "• Nama:",
        "• Nomor WA saya (wajib):",
        "• Nama organisasi:",
        "• Organisasi bidang apa (pendidikan/sosial/olahraga/dll):",
        "• Catatan: mohon tambahkan nomor WA saya ke sistem Reporter.",
        "",
        "Jika ingin upload foto, saya siap kirim foto berita ke admin jika diperlukan."
      ].join("\n");
    } else {
      // teacher
      text = [
        "Assalamualaikum admin, saya ingin daftar sebagai PENGAJAR BIMBEL di Masisir.",
        "",
        "• Nama:",
        "• Nomor WA saya (wajib):",
        "• Bidang pengajaran:",
        "• Pengalaman singkat:",
        "• Catatan: mohon konfirmasi & tambahkan profil saya."
      ].join("\n");
    }
    window.open(waLink(ADMIN_WA, text), "_blank", "noopener,noreferrer");
  }

  // =========================
  // Escape / formatting
  // =========================
  function escapeHtml(s) {
    return String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function snippet(s, n) {
    const str = String(s || "").trim();
    if (str.length <= n) return str;
    return str.slice(0, n - 1) + "…";
  }

  function formatDate(iso) {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      const fmt = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" });
      return fmt.format(d);
    } catch { return iso; }
  }

  function maskWA(wa) {
    const n = normalizeWA(wa);
    if (!n) return "—";
    if (n.length <= 6) return n;
    return `${n.slice(0, 4)}••••${n.slice(-3)}`;
  }

  // =========================
  // Modal bindings
  // =========================
  function bindModal() {
    $("#modalClose").addEventListener("click", closeModal);
    $("#modalCancel").addEventListener("click", closeModal);
    $("#modalOverlay").addEventListener("click", (e) => {
      if (e.target && e.target.id === "modalOverlay") closeModal();
    });

    $("#icPrev").addEventListener("click", () => stepCarousel(-1));
    $("#icNext").addEventListener("click", () => stepCarousel(1));

    // toast
    $("#toastClose").addEventListener("click", () => $("#toast").classList.remove("show"));
  }

  // =========================
  // Init
  // =========================
  async function init() {
    initTheme();
    setYear();

    // splash
    await sleep(520);
    hideSplash();

    bindNav();
    bindModal();
    bindHome();
    initHomeGlobalSearch();
    bindTeach();
    bindExplore();
    bindOffline();
    bindIntensif();
    bindLearn();
    bindNews();
    bindMarket();
    bindSettings();

    // default explore category (from LS)
    exploreCategory = localStorage.getItem(LS.EXPLORE_CAT) || "all";
    offlineCategory = localStorage.getItem(LS.OFFLINE_CAT) || "all";
    intensifCategory = localStorage.getItem(LS.INTENSIF_CAT) || "all";

    // init router last (it calls render hooks)
    initRouter();
  }

  // guard for missing data files
  function waitForData() {
    const ready = () =>
      Array.isArray(window.LESSONS_DATA) &&
      Array.isArray(window.LESSONS_OFFLINE_DATA) &&
      Array.isArray(window.LESSONS_INTENSIF_DATA) &&
      Array.isArray(window.PRODUCTS_DATA) &&
      Array.isArray(window.NEWS_DATA);

    if (ready()) return Promise.resolve();
    return new Promise((resolve) => {
      const t = setInterval(() => {
        if (ready()) {
          clearInterval(t);
          resolve();
        }
      }, 30);
      setTimeout(() => { clearInterval(t); resolve(); }, 2500);
    });
  }

  waitForData().then(init);

  /* ===============================
     HOME PROMO SLIDER LOGIC (Manual Infinite, Center)
     - Tanpa auto-slide
     - Infinite loop walau hanya 3 foto (clone kiri/kanan)
     - Slide manual (swipe/drag) + dot navigation
  ================================ */
  (function () {
    const track = document.getElementById("promoTrack");
    const dotsWrap = document.getElementById("promoDots");
    if (!track || !dotsWrap) return;

    // Ambil slide asli (real)
    const realSlides = Array.from(track.children);
    const realCount = realSlides.length;
    if (realCount < 2) {
      // build dots minimal
      dotsWrap.innerHTML = "";
      for (let i = 0; i < realCount; i++) {
        const d = document.createElement("span");
        if (i === 0) d.classList.add("active");
        dotsWrap.appendChild(d);
      }
      return;
    }

    // Reset dots (jaga kalau sebelumnya pernah dibangun)
    dotsWrap.innerHTML = "";
    for (let i = 0; i < realCount; i++) {
      const d = document.createElement("span");
      if (i === 0) d.classList.add("active");
      d.addEventListener("click", () => goReal(i));
      dotsWrap.appendChild(d);
    }
    const dots = Array.from(dotsWrap.children);

    // Clone 1 slide di kiri & kanan untuk efek infinite
    const firstClone = realSlides[0].cloneNode(true);
    const lastClone = realSlides[realCount - 1].cloneNode(true);
    firstClone.dataset.clone = "1";
    lastClone.dataset.clone = "1";

    track.insertBefore(lastClone, realSlides[0]);
    track.appendChild(firstClone);

    const allSlides = Array.from(track.children); // [lastClone, ...real, firstClone]

    function setActiveDot(realIndex) {
      const idx = ((realIndex % realCount) + realCount) % realCount;
      dots.forEach(d => d.classList.remove("active"));
      if (dots[idx]) dots[idx].classList.add("active");
    }

    function goReal(realIndex) {
      const idx = ((realIndex % realCount) + realCount) % realCount;
      const target = allSlides[idx + 1]; // +1 karena ada clone di awal
      if (!target) return;
      track.scrollTo({ left: target.offsetLeft, behavior: "smooth" });
      setActiveDot(idx);
      currentReal = idx;
    }

    // Start posisi: slide real pertama (index 0) -> allSlides[1]
    let currentReal = 0;
    requestAnimationFrame(() => {
      const start = allSlides[1];
      if (start) track.scrollLeft = start.offsetLeft;
      setActiveDot(0);
    });

    // Cari slide yg paling dekat dengan posisi tengah viewport
    let raf = 0;
    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;

        // Infinite jump (tanpa animasi) saat menyentuh ujung clone
        const maxLeft = track.scrollWidth - track.clientWidth;
        if (track.scrollLeft <= 0) {
          // lompat ke real terakhir
          const lastReal = allSlides[realCount]; // karena: 0 clone, 1..realCount real, realCount+1 clone
          if (lastReal) track.scrollLeft = lastReal.offsetLeft;
        } else if (track.scrollLeft >= maxLeft - 1) {
          // lompat ke real pertama
          const firstReal = allSlides[1];
          if (firstReal) track.scrollLeft = firstReal.offsetLeft;
        }

        const center = track.scrollLeft + track.clientWidth / 2;

        let bestAllIdx = 1;
        let bestDist = Infinity;
        for (let i = 0; i < allSlides.length; i++) {
          const s = allSlides[i];
          const mid = s.offsetLeft + s.offsetWidth / 2;
          const d = Math.abs(mid - center);
          if (d < bestDist) {
            bestDist = d;
            bestAllIdx = i;
          }
        }

        // Map ke real index
        let realIdx = bestAllIdx - 1;
        if (realIdx < 0) realIdx = realCount - 1;
        if (realIdx >= realCount) realIdx = 0;

        if (realIdx !== currentReal) {
          currentReal = realIdx;
          setActiveDot(realIdx);
        }
      });
    }

    track.addEventListener("scroll", onScroll, { passive: true });

    // Snap correction saat user selesai swipe (biar selalu rapi di tengah)
    // (scrollend belum support semua browser, jadi pakai debounce)
    let t = 0;
    track.addEventListener("scroll", () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        goReal(currentReal);
      }, 120);
    }, { passive: true });

    // Pastikan click/tap slide juga bisa pindah ke slide itu (opsional)
    allSlides.forEach((s, i) => {
      s.addEventListener("click", () => {
        // ignore click clone mapping handled below
        let realIdx = i - 1;
        if (realIdx < 0) realIdx = realCount - 1;
        if (realIdx >= realCount) realIdx = 0;
        goReal(realIdx);
      });
    });
  })();



  // =========================
  // PATCH: Mobile Livin-like Nav (Top + Bottom) — no conflict
  // =========================
  (function () {
    const $$p = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    function routeName() {
      return (location.hash || "#home").replace("#", "") || "home";
    }

    function syncBottomNav() {
      const rn = routeName();
      $$p(".m-bottom-nav .m-nav-item, .m-bottom-nav .m-nav-mid").forEach(a => {
        const r = a.getAttribute("data-route");
        const active =
          (r === rn) ||
          (a.classList.contains("m-nav-mid") && ["explore", "offline", "intensif"].includes(rn));
        a.classList.toggle("is-active", !!active);
      });
    }

    function bindTopbarGo() {
      $$p(".m-topbar [data-go]").forEach(btn => {
        if (btn._boundGo) return;
        btn._boundGo = true;
        btn.addEventListener("click", () => {
          const go = btn.getAttribute("data-go");
          if (go) setRoute(go);
        });
      });
    }

    function bindRefresh() {
      const rf = document.getElementById("btnRefresh");
      if (!rf || rf._boundRf) return;
      rf._boundRf = true;
      rf.addEventListener("click", () => location.reload());
    }

    document.addEventListener("DOMContentLoaded", () => {
      bindTopbarGo();
      bindRefresh();
      syncBottomNav();
    });

    window.addEventListener("hashchange", () => {
      bindTopbarGo();
      syncBottomNav();
    });
  })();












  async function startMayarCheckout(lesson) {
    // ambil data user dari form kecil / modal
    const user = {
      name: document.querySelector("#payName").value.trim(),
      email: document.querySelector("#payEmail").value.trim(),
      mobile: document.querySelector("#payMobile").value.trim(),
    };

    const body = {
      courseId: lesson.id,
      courseTitle: `${lesson.title} - ${lesson.level || ""}`.trim(),
      price: lesson.price || 250000, // kamu bisa tambahkan field price ke data lesson
      user,
    };

    const r = await fetch("http://localhost:8787/api/pay/create-invoice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await r.json();
    if (!r.ok) {
      alert(data?.error || "Gagal membuat invoice");
      return;
    }

    // Simpan orderId agar setelah balik bisa cek status
    localStorage.setItem("pendingOrderId", data.orderId);

    // Redirect ke halaman pembayaran Mayar
    window.location.href = data.payUrl;
  }

})();
