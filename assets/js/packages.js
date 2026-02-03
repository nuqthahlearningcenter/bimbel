/* packages.js — Paket Pilihan + Halaman Paket
   Dipanggil dari app.js lewat hook renderRoute()
*/

(() => {
  "use strict";

  const ADMIN_WA = "6285185409887";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ====== Konfigurasi paket ======
  // Catatan: "items" berisi 4 materi (id) yang akan ditampilkan sebagai checklist.
  // Kamu bisa ubah judul/price/discount/WA link kapan saja.
  const DATA = {
    "paket-online": {
      title: "Paket Bimbel Online",
      subtitle: "Gabungan materi online (4 materi per paket).",
      thumbClass: "online",
      bundles: [
        {
          title: "Bimbel Syariah — TK 1",
          eyebrow: "Paket Online",
          discount: "35%",
          price: "Rp379.000",
          per: "/bulan",
          items: ["Nahwu & Sharaf_tk1", "Tarikh Tasyri_tk1", "Tafsir Ayat Ahkam_tk1", "Ulumul Hadits_tk1"],
          images: ["assets/images/nu.png"],
          url: "https://nuqthah.myr.id/course/nahwu-sharaf",
        },
        {
          title: "Bimbel Syariah — TK 2",
          eyebrow: "Paket Online",
          discount: "50%",
          price: "Rp113.000",
          per: "/bulan",
          items: ["Nahwu & Sharaf_tk2", "Qodoya Fiqhiyah_tk2", "Tauhid_tk2", "Tafsir Ayat Ahkam_tk2"],
          images: ["assets/images/nu.png"],
          url: "https://nuqthah.myr.id/course/nahwu-sharaf",
        }
      ]
    },
    "paket-offline": {
      title: "Paket Bimbel Offline",
      subtitle: "Gabungan materi offline (4 materi per paket).",
      thumbClass: "offline",
      bundles: [
        {
          title: "Bimbel Syariah Offline — TK 1",
          eyebrow: "Paket Offline",
          discount: "25%",
          price: "Rp499.000",
          per: "/bulan",
          items: ["Nahwu & Sharaf_tk1", "Tauhid_tk1", "Qodoya Fiqhiyah_tk1", "Ushul Fiqih_tk1"],
          images: ["assets/images/nu.png"],
          url: "https://nuqthah.myr.id/course/nahwu-sharaf",
        }
      ]
    },
    "paket-intensif": {
      title: "Paket Intensif",
      subtitle: "Program intensif (4 materi per paket).",
      thumbClass: "intensif",
      bundles: [
        {
          title: "Intensif Syariah — TK 1",
          eyebrow: "Paket Intensif",
          discount: "20%",
          price: "Rp699.000",
          per: "/program",
          items: ["Nahwu & Sharaf_tk1", "Tafsir Ayat Ahkam_tk1", "Ulumul Hadits_tk1", "Ushul Fiqih_tk1"],
          images: ["assets/images/nu.png"],
          url: "https://nuqthah.myr.id/course/nahwu-sharaf."
        }
      ]
    },
    "tanya-langsung": {
      title: "Tanya Langsung",
      subtitle: "Chat langsung dengan konsultan/pengajar.",
      thumbClass: "chat",
      bundles: [
        {
          title: "Konsultasi 1x Sesi",
          eyebrow: "Chat Konsultan",
          discount: "",
          price: "Mulai Rp50.000",
          per: "/sesi",
          items: ["Tanya materi", "Konsultasi tugas", "Review pemahaman", "Arahan belajar"],

          url: "6285185409558",
          customItems: true

        }
      ]
    }
  };

  function getLessonsByMode(routeName) {
    // online => window.LESSONS_DATA
    if (routeName === "paket-offline") return (window.LESSONS_OFFLINE_DATA || []).slice();
    if (routeName === "paket-intensif") return (window.LESSONS_INTENSIF_DATA || []).slice();
    return (window.LESSONS_DATA || []).slice();
  }

  function buildLessonMap(routeName) {
    const map = new Map();
    getLessonsByMode(routeName).forEach(l => {
      if (l && l.id) map.set(String(l.id), l);
    });
    return map;
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function waLink(wa, text) {
    const digits = String(wa || "").replace(/[^\d]/g, "").replace(/^0/, "62");
    const msg = encodeURIComponent(String(text || ""));
    return `https://wa.me/${digits}?text=${msg}`;
  }

  // ====== HOME: Paket Pilihan tiles ======
  function bindHomePackageTiles() {
    const box = $("#homePackageTiles");
    if (!box || box._binded) return;
    box._binded = true;

    $$(".pkg-tile", box).forEach(tile => {
      const go = (route) => {
        const r = String(route || "").replace(/^#/, "").trim();
        if (!r) return;
        // Gunakan router utama jika ada (lebih konsisten & tidak tergantung scroll bawaan browser)
        if (typeof window.setRoute === "function") {
          window.setRoute(r);
        } else {
          // fallback
          location.hash = `#${r}`;
        }
      };

      tile.addEventListener("click", (e) => {
        const tgt = e?.target;
        const inner = tgt && tgt.closest ? tgt.closest("a,button") : null;

        // If user clicks the button/link inside: stop default behavior and route via hash router
        if (inner) {
          e.preventDefault();
          e.stopPropagation();
          go(inner.getAttribute("data-route") || inner.getAttribute("data-to") || inner.getAttribute("href"));
          if (!location.hash || location.hash === "#") go(tile.getAttribute("data-to"));
          return;
        }

        // Click anywhere on the tile
        go(tile.getAttribute("data-to"));
      });

      // keyboard accessibility
      tile.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          go(tile.getAttribute("data-to"));
        }
      });
    });
  }

  // Expose for app.js hooks
  window.bindHomePackageTiles = bindHomePackageTiles;


  // ====== Paket Materi (tampilan seperti Marketplace) ======
  const PAGE_SIZE_PKG = 8;
  const pkgState = Object.create(null);

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  function cleanPriceToNumber(priceStr) {
    // "Rp379.000" -> 379000 (fallback NaN)
    const s = String(priceStr || "").replace(/[^\d]/g, "");
    return s ? Number(s) : NaN;
  }

  function snippet(s, n) {
    const t = String(s || "");
    if (t.length <= n) return t;
    return t.slice(0, n - 1).trimEnd() + "…";
  }

  function bundleToMarketItem(routeName, cfg, b, idx) {
    // title mapping: "TK 1" -> "Paket Tingkat Satu" (biar terasa seperti contoh Marketplace)
    let name = b.cardTitle || b.title || `Paket ${idx + 1}`;
    const m = String(b.title || "").match(/TK\s*(\d+)/i);
    const level = m ? Number(m[1]) : null;

    if (!b.cardTitle && level) {
      const map = { 1: "Satu", 2: "Dua", 3: "Tiga", 4: "Empat", 5: "Lima" };
      name = `Paket Tingkat ${map[level] || level}`;
    }

    // Deskripsi (4 poin) — utamakan displayItems kalau ada,
    // kalau tidak ada: pakai mapping sederhana utk contoh paket materi.
    let displayItems = [];
    if (Array.isArray(b.displayItems) && b.displayItems.length) {
      displayItems = b.displayItems;
    } else if (level) {
      const levelItems = {
        1: ["Fiqih", "Nahwu", "Sharaf", "Balaghah"],
        2: ["Ushul Fiqh", "Mantiq", "Nahwu Lanjutan", "Balaghah Lanjutan"],
        3: ["Qawaid Fiqhiyah", "Balaghah", "Mantiq", "Adabul Bahs"]
      };
      displayItems = levelItems[level] || [];
    } else if (Array.isArray(b.items)) {
      displayItems = b.items;
    }

    const desc = (displayItems || [])
      .map(x => String(x).replace(/_/g, " ").replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .slice(0, 4)
      .join(" + ");

    return {
      id: `${routeName}-${idx}`,
      name,
      desc,
      price: b.cardPrice || b.price || "-",
      _priceNum: cleanPriceToNumber(b.cardPrice || b.price),
      url: b.url || "",
      wa: b.wa || cfg.wa || ADMIN_WA || "",
      cover: (b.images && b.images[0]) ? b.images[0] : (cfg.images && cfg.images[0]) ? cfg.images[0] : ""
    };
  }

  function renderPkgCard(item) {
    const card = document.createElement("div");
    card.className = "product-card";
    const cover = item.cover || "";
    card.innerHTML = `
      <div class="product-cover">
        ${cover ? `<img src="${cover}" alt="" loading="lazy" decoding="async" />` : ""}
      </div>
      <div class="product-body">
        <div class="product-name">${escapeHtml(item.name)}</div>
        <div class="product-desc">${escapeHtml(snippet(item.desc || "", 80))}</div>
        <div class="product-row">
          <div class="product-price">${escapeHtml(item.price)}</div>
          <div class="product-cta">Beli</div>
        </div>
      </div>
    `;

    card.addEventListener("click", () => {
      // Prioritas: buka URL website jika tersedia
      if (item.url) {
        window.open(item.url, "_blank", "noopener,noreferrer");
        return;
      }

      // Fallback (opsional): WhatsApp jika URL kosong
      const wa = item.wa;
      if (!wa) return;
      const text = `Assalamualaikum, saya mau beli ${item.name}. Mohon info detail paketnya ya.`;
      const url = waLink(wa, text);
      window.open(url, "_blank", "noopener,noreferrer");
    });
    return card;
  }

  function mountPkgMarketUI(routeName, cfg, root) {
    const container = $(".container", root) || root;

    // ids unique per route
    const sid = `pkgSearch-${routeName}`;
    const cid = `clearPkgSearch-${routeName}`;
    const gid = `pkgGrid-${routeName}`;
    const prevId = `pkgPrev-${routeName}`;
    const nextId = `pkgNext-${routeName}`;
    const infoId = `pkgPageInfo-${routeName}`;

    container.innerHTML = `
      <div class="pkg-page-head">
        <div>
          <div class="section-title">Paket Materi — ${escapeHtml(cfg.title || routeName)}</div>
          <div class="section-sub">${escapeHtml(cfg.subtitle || "Pilih paket untuk melihat gabungan materi.")}</div>
        </div>
        <a class="btn soft" href="#home" data-route="home">Kembali</a>
      </div>

      <div class="market-tools">
        <div class="search">
          <div class="icon">🔎</div>
          <input autocomplete="off" id="${sid}" placeholder="Cari paket materi…" type="search" />
          <button aria-label="Hapus pencarian" class="clear" id="${cid}" type="button">×</button>
        </div>
        <div class="muted" style="align-self:center;font-weight:900">Total: <span id="${routeName}-count">0</span></div>
      </div>

      <div aria-label="Daftar paket materi" class="product-grid" id="${gid}"></div>
      <div class="pager">
        <button class="btn" id="${prevId}" type="button">Sebelumnya</button>
        <div class="muted" id="${infoId}">—</div>
        <button class="btn" id="${nextId}" type="button">Berikutnya</button>
      </div>
    `;

    pkgState[routeName] = pkgState[routeName] || { page: 1, q: "" };

    const input = document.getElementById(sid);
    const clearBtn = document.getElementById(cid);
    const prevBtn = document.getElementById(prevId);
    const nextBtn = document.getElementById(nextId);

    function render() {
      const state = pkgState[routeName];
      const q = (state.q || "").trim().toLowerCase();

      const all = (cfg.bundles || []).map((b, idx) => bundleToMarketItem(routeName, cfg, b, idx));
      const filtered = all.filter(it => {
        if (!q) return true;
        const hay = `${it.name} ${it.desc} ${it.price}`.toLowerCase();
        return hay.includes(q);
      });

      // sort: by numeric price if possible
      filtered.sort((a, b) => {
        const an = Number.isFinite(a._priceNum) ? a._priceNum : Number.POSITIVE_INFINITY;
        const bn = Number.isFinite(b._priceNum) ? b._priceNum : Number.POSITIVE_INFINITY;
        return an - bn;
      });

      const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE_PKG));
      state.page = clamp(state.page, 1, totalPages);

      const start = (state.page - 1) * PAGE_SIZE_PKG;
      const pageItems = filtered.slice(start, start + PAGE_SIZE_PKG);

      const grid = document.getElementById(gid);
      if (!grid) return;
      grid.innerHTML = "";
      pageItems.forEach(it => grid.appendChild(renderPkgCard(it)));

      if (pageItems.length === 0) {
        grid.innerHTML = `<div class="panel"><div class="panel-bd">
          <b>Tidak ada paket.</b>
          <p class="muted">Coba ganti kata kunci.</p>
        </div></div>`;
      }

      const info = document.getElementById(infoId);
      if (info) info.textContent = `Halaman ${state.page} / ${totalPages}`;

      if (prevBtn) prevBtn.disabled = state.page <= 1;
      if (nextBtn) nextBtn.disabled = state.page >= totalPages;

      const countEl = document.getElementById(`${routeName}-count`);
      if (countEl) countEl.textContent = String(filtered.length);
    }

    if (input) {
      input.value = pkgState[routeName].q || "";
      input.addEventListener("input", () => {
        pkgState[routeName].q = input.value || "";
        pkgState[routeName].page = 1;
        render();
      });
    }
    if (clearBtn && input) {
      clearBtn.addEventListener("click", () => {
        input.value = "";
        pkgState[routeName].q = "";
        pkgState[routeName].page = 1;
        render();
        input.focus();
      });
    }
    if (prevBtn) prevBtn.addEventListener("click", () => { pkgState[routeName].page -= 1; render(); });
    if (nextBtn) nextBtn.addEventListener("click", () => { pkgState[routeName].page += 1; render(); });

    render();
  }


  function renderPackageRoute(routeName) {
    const cfg = DATA[routeName];
    if (!cfg) return;

    const root = $(`.route[data-route="${routeName}"]`);
    if (!root) return;

    // Tampilan baru: seperti halaman Marketplace (card grid + search + pager)
    mountPkgMarketUI(routeName, cfg, root);
  }

  // Public hook dipanggil app.js
  window.renderPackagesRoute = function (routeName) {
    // bind tiles di home (sekali)
    bindHomePackageTiles();

    // render hanya untuk route paket
    if (DATA[routeName]) renderPackageRoute(routeName);
  };

  document.addEventListener("DOMContentLoaded", () => { bindHomePackageTiles(); });
})();
