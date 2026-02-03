/* teacher.js
 * Fix halaman "Profil Pengajar" agar benar-benar tampil saat route #teacher:
 * - Memastikan <section id="route-teacher"> menjadi DIRECT CHILD dari #pageShell
 * - Opsional: re-render konten jika diperlukan
 */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);

  function teacherTemplate() {
    return `
      <section class="section">
        <div class="container">
          <div class="section-title">Profil Pengajar 👨‍🏫</div>

          <div class="panel">
            <div class="panel-bd">
              <div class="teacher-profile" style="margin:0;">
                <div class="tp-media">
                  <img
                    src="./assets/images/teacher.jpg"
                    alt="Profil pengajar"
                    onerror="this.style.display='none'; this.parentElement.classList.add('noimg');"
                  />
                  <div class="tp-fallback">M</div>
                </div>

                <div class="tp-info-box">
                  <div class="tp-kicker">Pengajar</div>
                  <div class="tp-name">Masisir Learning Team</div>
                  <div class="tp-meta">Bimbingan • Bahasa • Akademik</div>

                  <div class="tp-desc">
                    Profil pengajar bisa kamu ganti — simpan file <b>teacher.jpg</b> di <code>assets/images</code>.
                  </div>

                  <div class="muted" style="margin-top:10px;">
                    <b>Deskripsi Lengkap:</b>
                    <div style="margin-top:6px;">
                      • Fokus: Bimbingan bahasa & akademik<br>
                      • Metode: Terarah, bertahap, dan nyaman<br>
                      • Catatan: Konten ini bisa kamu kembangkan sesuai kebutuhan profil
                    </div>
                  </div>

                  <div class="tp-actions" style="margin-top:14px;">
                    <a class="btn" href="#explore" data-route="explore">Lihat Materi</a>
                    <a class="btn btn-soft" href="#home" data-route="home">Kembali</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
    `;
  }

  function ensureTeacherRouteIsDirectChild() {
    const shell = $("#pageShell");
    if (!shell) return;

    // 1) kalau sudah ada sebagai direct child, aman
    const direct = shell.querySelector(':scope > .route[data-route="teacher"], :scope > #route-teacher');
    if (direct) return;

    // 2) cari route-teacher yang "nyangkut" di tempat lain (biasanya di dalam home)
    const existing = $("#route-teacher");
    if (existing) {
      shell.appendChild(existing); // pindahkan jadi anak langsung pageShell
      return;
    }

    // 3) kalau belum ada sama sekali, buat baru
    const sec = document.createElement("section");
    sec.className = "route";
    sec.id = "route-teacher";
    sec.dataset.route = "teacher";
    sec.setAttribute("aria-label", "Profil Pengajar");
    sec.innerHTML = teacherTemplate();
    shell.appendChild(sec);
  }

  function renderTeacherPage() {
    ensureTeacherRouteIsDirectChild();

    // Pastikan kontennya ada (kalau sebelumnya kosong)
    const sec = $("#route-teacher");
    if (!sec) return;

    // Jika mau “paksa render ulang” setiap kali masuk route teacher, uncomment:
    // sec.innerHTML = teacherTemplate();

    // Kalau konten sudah ada tapi kosong, isi sekali
    if (!sec.innerHTML || !sec.innerHTML.trim()) {
      sec.innerHTML = teacherTemplate();
    }
  }

  // expose agar bisa dipanggil dari router app.js
  window.renderTeacherPage = renderTeacherPage;

  // jalan saat load: beresin struktur DOM dulu
  document.addEventListener("DOMContentLoaded", () => {
    ensureTeacherRouteIsDirectChild();
  });
})();


// Alias for router hook compatibility
window.fixTeacherRoute = window.renderTeacherPage;
/* teacher.js
 * Fix halaman "Profil Pengajar" agar benar-benar tampil saat route #teacher:
 * - Memastikan <section id="route-teacher"> menjadi DIRECT CHILD dari #pageShell
 * - Opsional: re-render konten jika diperlukan
 */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);

  function teacherTemplate() {
    return `
      <section class="section">
        <div class="container">
          <div class="section-title">Profil Pengajar 👨‍🏫</div>

          <div class="panel">
            <div class="panel-bd">
              <div class="teacher-profile" style="margin:0;">
                <div class="tp-media">
                  <img
                    src="./assets/images/teacher.jpg"
                    alt="Profil pengajar"
                    onerror="this.style.display='none'; this.parentElement.classList.add('noimg');"
                  />
                  <div class="tp-fallback">M</div>
                </div>

                <div class="tp-info-box">
                  <div class="tp-kicker">Pengajar</div>
                  <div class="tp-name">Masisir Learning Team</div>
                  <div class="tp-meta">Bimbingan • Bahasa • Akademik</div>

                  <div class="tp-desc">
                    Profil pengajar bisa kamu ganti — simpan file <b>teacher.jpg</b> di <code>assets/images</code>.
                  </div>

                  <div class="muted" style="margin-top:10px;">
                    <b>Deskripsi Lengkap:</b>
                    <div style="margin-top:6px;">
                      • Fokus: Bimbingan bahasa & akademik<br>
                      • Metode: Terarah, bertahap, dan nyaman<br>
                      • Catatan: Konten ini bisa kamu kembangkan sesuai kebutuhan profil
                    </div>
                  </div>

                  <div class="tp-actions" style="margin-top:14px;">
                    <a class="btn" href="#explore" data-route="explore">Lihat Materi</a>
                    <a class="btn btn-soft" href="#home" data-route="home">Kembali</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
    `;
  }

  function ensureTeacherRouteIsDirectChild() {
    const shell = $("#pageShell");
    if (!shell) return;

    // 1) kalau sudah ada sebagai direct child, aman
    const direct = shell.querySelector(':scope > .route[data-route="teacher"], :scope > #route-teacher');
    if (direct) return;

    // 2) cari route-teacher yang "nyangkut" di tempat lain (biasanya di dalam home)
    const existing = $("#route-teacher");
    if (existing) {
      shell.appendChild(existing); // pindahkan jadi anak langsung pageShell
      return;
    }

    // 3) kalau belum ada sama sekali, buat baru
    const sec = document.createElement("section");
    sec.className = "route";
    sec.id = "route-teacher";
    sec.dataset.route = "teacher";
    sec.setAttribute("aria-label", "Profil Pengajar");
    sec.innerHTML = teacherTemplate();
    shell.appendChild(sec);
  }

  function renderTeacherPage() {
    ensureTeacherRouteIsDirectChild();

    // Pastikan kontennya ada (kalau sebelumnya kosong)
    const sec = $("#route-teacher");
    if (!sec) return;

    // Jika mau “paksa render ulang” setiap kali masuk route teacher, uncomment:
    // sec.innerHTML = teacherTemplate();

    // Kalau konten sudah ada tapi kosong, isi sekali
    if (!sec.innerHTML || !sec.innerHTML.trim()) {
      sec.innerHTML = teacherTemplate();
    }
  }

  // expose agar bisa dipanggil dari router app.js
  window.renderTeacherPage = renderTeacherPage;

  // jalan saat load: beresin struktur DOM dulu
  document.addEventListener("DOMContentLoaded", () => {
    ensureTeacherRouteIsDirectChild();
  });
})();


// Alias for router hook compatibility
window.fixTeacherRoute = window.renderTeacherPage;
