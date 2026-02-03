/* mobile-title-pack.js
   - Auto-hide: mobile title + home search bar
   - Hide saat scroll down, show saat scroll up / dekat atas
   - Aktif hanya di mobile & route #home untuk search bar
*/
(() => {
    "use strict";

    const titleEl = document.getElementById("mobileTopTitle");

    const isMobile = () => window.matchMedia("(max-width: 768px)").matches;
    const routeName = () => (location.hash || "#home").replace("#", "") || "home";

    let lastY = window.scrollY || 0;
    let ticking = false;

    const THRESHOLD_SHOW_AT_TOP = 24; // dekat atas -> selalu tampil
    const DELTA = 6;                 // sensitivitas scroll

    function getHomeSearchEl() {
        // elemen search home
        return document.querySelector(".home-global-search");
    }

    function showAll() {
        if (titleEl) titleEl.classList.remove("mt-hide");
        const hs = getHomeSearchEl();
        if (hs) hs.classList.remove("hs-hide");
    }

    function hideOnScrollDown() {
        if (titleEl) titleEl.classList.add("mt-hide");
        // search hanya hide kalau sedang di HOME
        if (routeName() === "home") {
            const hs = getHomeSearchEl();
            if (hs) hs.classList.add("hs-hide");
        }
    }

    function showOnScrollUp() {
        if (titleEl) titleEl.classList.remove("mt-hide");
        if (routeName() === "home") {
            const hs = getHomeSearchEl();
            if (hs) hs.classList.remove("hs-hide");
        }
    }

    function update() {
        ticking = false;

        if (!isMobile()) {
            // desktop: pastikan semua balik normal
            showAll();
            lastY = window.scrollY || 0;
            return;
        }

        const y = window.scrollY || 0;
        const diff = y - lastY;

        // dekat atas: selalu tampil
        if (y <= THRESHOLD_SHOW_AT_TOP) {
            showAll();
            lastY = y;
            return;
        }

        // scroll down => hide
        if (diff > DELTA) hideOnScrollDown();

        // scroll up => show
        if (diff < -DELTA) showOnScrollUp();

        lastY = y;
    }

    function onScroll() {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
        }
    }

    // Saat pindah route, pastikan search tidak nyangkut hidden
    function onRouteChange() {
        // kalau bukan home, jangan maksa ngapa2in ke search
        // tapi title tetap mengikuti scroll
        showAll();
        update();
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("hashchange", onRouteChange);

    // init
    update();
})();
