/* home-top-fix.js
 * Membuat header Home (judul + search) benar-benar "WhatsApp-like":
 * - Tidak ikut scroll (fixed terhadap viewport)
 * - Tanpa konflik dengan animasi route (karena route punya transform)
 * Strategi:
 * - Pindahkan <section class="home-global-search"> menjadi direct child #pageShell
 * - Toggle body class "home-top-visible" hanya saat hash #home
 */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);

  function getRouteName() {
    return (location.hash || "#home").replace("#", "") || "home";
  }

  function ensureHomeTopIsDirectChild() {
    const shell = $("#pageShell");
    if (!shell) return;

    // Cari header search di mana pun berada (biasanya di dalam #route-home)
    const existing = shell.querySelector(":scope > .home-global-search");
    if (existing) return; // sudah benar

    const inHome = $("#route-home .home-global-search");
    if (inHome) {
      // pindahkan ke atas route-home agar jadi fixed header yang stabil
      const homeRoute = $("#route-home");
      if (homeRoute) {
        shell.insertBefore(inHome, homeRoute);
      } else {
        shell.prepend(inHome);
      }
    }
  }

  function syncVisibility() {
    const r = getRouteName();
    document.body.classList.toggle("home-top-visible", r === "home");
  }

  function boot() {
    ensureHomeTopIsDirectChild();
    syncVisibility();
  }

  document.addEventListener("DOMContentLoaded", boot);
  window.addEventListener("hashchange", () => {
    // router mungkin menjalankan animasi; cukup sinkronkan class
    // elemen sudah dipindahkan sekali
    syncVisibility();
  });

  // expose optional hook (jika suatu saat mau dipanggil router)
  window.fixHomeTop = boot;
})();
