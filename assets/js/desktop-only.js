/* =========================================================
   DESKTOP ONLY JS — SAFE
   - Tidak menyentuh mobile
   - Hanya memberi class guard: body.is-desktop
   ========================================================= */
(() => {
    const DESKTOP_MIN = 769;

    function applyDesktopFlag() {
        const isDesktop = window.innerWidth >= DESKTOP_MIN;
        document.body.classList.toggle("is-desktop", isDesktop);
    }

    window.addEventListener("resize", applyDesktopFlag, { passive: true });
    document.addEventListener("DOMContentLoaded", applyDesktopFlag);
    applyDesktopFlag();

    // assets/js/desktop-only.js
    (function () {
        const mq = window.matchMedia('(min-width: 769px)');

        function apply() {
            if (!document.body) return;
            document.body.classList.toggle('is-desktop', mq.matches);
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', apply, { once: true });
        } else {
            apply();
        }

        if (mq.addEventListener) mq.addEventListener('change', apply);
        else mq.addListener(apply); // Safari lama
    })();












    // DESKTOP ONLY — Al-Azhar Bimbel Percentage Card
    (function () {
        const mq = window.matchMedia("(min-width: 1024px)");

        function isHome() {
            const r = (location.hash || "#home").replace("#", "") || "home";
            return r === "home";
        }

        function getNums() {
            // Ambil dari localStorage agar bisa di-update tanpa edit kode
            const total = Number(localStorage.getItem("alz_total") || "0");
            const joined = Number(localStorage.getItem("alz_joined") || "0");
            return { total, joined };
        }

        function pct(joined, total) {
            if (!total || total <= 0) return 0;
            const p = (joined / total) * 100;
            return Math.max(0, Math.min(100, p));
        }

        function renderCard() {
            const isDesk = mq.matches && document.body.classList.contains("is-desktop");
            if (!isDesk || !isHome()) return;

            const home = document.querySelector('.route[data-route="home"]');
            const grid = home && home.querySelector(".home-grid");
            if (!grid) return;

            let card = document.getElementById("deskAlzStatCard");
            if (!card) {
                card = document.createElement("div");
                card.id = "deskAlzStatCard";
                card.className = "desk-stat-card card";
                card.setAttribute("data-area", "alazharStat");
                grid.appendChild(card);
            }

            const { total, joined } = getNums();
            const p = pct(joined, total);
            const pText = total > 0 ? `${Math.round(p * 10) / 10}%` : "—";

            card.innerHTML = `
      <div class="desk-stat-title">Mahasiswa Al-Azhar yang sudah ikut bimbel</div>

      <div class="desk-stat-row">
        <div class="desk-stat-value">${pText}</div>
        <div class="desk-stat-sub">${total > 0 ? `(${joined} dari ${total})` : "(atur datanya dulu)"}</div>
      </div>

      <div class="desk-stat-bar" aria-label="progress">
        <i style="width:${total > 0 ? p.toFixed(2) : 0}%;"></i>
      </div>

      <div class="desk-stat-meta">
        Sumber angka: pengaturan admin (localStorage) — desktop saja.
      </div>
    `;
        }

        function boot() {
            renderCard();
        }

        document.addEventListener("DOMContentLoaded", boot);
        window.addEventListener("hashchange", boot);

        if (mq.addEventListener) mq.addEventListener("change", boot);
        else mq.addListener(boot);
    })();


    /* DESKTOP ONLY JS — FIXED BREAKPOINT (SAFE) */
    (() => {
        // Desktop = lebar >= 1024 dan perangkat mendukung hover (umumnya laptop/pc)
        const mq = window.matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine)");

        function apply() {
            if (!document.body) return;
            document.body.classList.toggle("is-desktop", mq.matches);
        }

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", apply, { once: true });
        } else {
            apply();
        }

        if (mq.addEventListener) mq.addEventListener("change", apply);
        else mq.addListener(apply);
    })();

})();
