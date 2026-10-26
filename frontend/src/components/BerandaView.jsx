import React from 'react';

export default function BerandaView({ onStartUpload, onLoadSample }) {
  return (
    <div class="flex flex-col w-full">
      {/* HERO SECTION WITH ASYMMETRIC PREVIEW */}
      <section class="relative w-full px-margin py-space-xl overflow-hidden">
        {/* Ambient subtle background aura */}
        <div class="absolute -top-32 -left-20 w-96 h-96 rounded-full bg-secondary-container/20 blur-3xl pointer-events-none"></div>
        <div class="absolute top-1/2 -right-32 w-80 h-80 rounded-full bg-surface-variant/40 blur-3xl pointer-events-none"></div>

        <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center relative z-10">
          
          {/* Left Column: Copy & Value Proposition */}
          <div class="lg:col-span-6 flex flex-col items-start space-y-space-md">
            <div class="inline-flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-surface-container-high text-on-surface">
              <span class="flex h-2 w-2 rounded-full bg-secondary animate-pulse"></span>
              <span class="font-label-md text-label-md text-on-surface-variant">Solusi Pintar Pra-Tanda Tangan</span>
            </div>

            <h1 class="font-headline-xl text-headline-xl text-on-surface tracking-tight leading-tight">
              Jangan Tanda Tangan Sebelum Kamu Paham Kontraknya.
            </h1>

            <p class="font-body-legal text-body-legal text-on-surface-variant max-w-xl">
              Unggah kontrakmu dan temukan pasal berisiko secara visual, pahami isinya dengan bahasa sehari-hari, serta siapkan draf revisi adil sebelum bernegosiasi.
            </p>

            {/* CTA Buttons */}
            <div class="flex flex-wrap items-center gap-space-sm pt-space-xs w-full sm:w-auto">
              <button
                onClick={onStartUpload}
                class="inline-flex items-center justify-center gap-space-xs px-space-lg py-3 rounded-lg bg-secondary hover:bg-on-secondary-fixed-variant text-on-secondary font-label-md text-label-md shadow-md hover:shadow-lg transition-all active:scale-[0.99]"
              >
                <span class="material-symbols-outlined text-[18px]">document_scanner</span>
                <span>Mulai Analisis Gratis</span>
              </button>

              <a
                href="#cara-kerja"
                class="inline-flex items-center justify-center gap-space-xs px-space-lg py-3 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md shadow-sm transition-all"
              >
                <span class="material-symbols-outlined text-[18px]">play_circle</span>
                <span>Lihat Cara Kerja</span>
              </a>
            </div>

            {/* Quick Sample Contracts */}
            <div class="pt-space-sm w-full">
              <span class="font-label-sm text-label-sm text-on-surface-variant font-semibold block mb-2">
                Coba Contoh Dokumen Nyata:
              </span>
              <div class="flex flex-wrap gap-2">
                <button
                  onClick={() => onLoadSample('sewa_kos')}
                  class="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-sm text-label-sm flex items-center gap-1.5 transition-colors border border-outline-variant/30"
                >
                  <span>🏠</span> Sewa Kos (Deposit & Denda)
                </button>
                <button
                  onClick={() => onLoadSample('kerja_magang')}
                  class="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-sm text-label-sm flex items-center gap-1.5 transition-colors border border-outline-variant/30"
                >
                  <span>💼</span> Kerja Magang (Non-Compete)
                </button>
                <button
                  onClick={() => onLoadSample('pinjaman')}
                  class="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-sm text-label-sm flex items-center gap-1.5 transition-colors border border-outline-variant/30"
                >
                  <span>💳</span> Pinjaman Dana (Bunga Harian)
                </button>
                <button
                  onClick={() => onLoadSample('snk_aplikasi')}
                  class="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-sm text-label-sm flex items-center gap-1.5 transition-colors border border-outline-variant/30"
                >
                  <span>📱</span> S&K Aplikasi (Klausul Sepihak)
                </button>
              </div>
            </div>

            {/* Trust Badges Strip */}
            <div class="pt-space-md grid grid-cols-1 sm:grid-cols-3 gap-space-sm w-full">
              <div class="flex items-center gap-space-xs p-space-xs rounded-lg bg-surface-container-lowest shadow-sm">
                <span class="material-symbols-outlined text-secondary text-[20px]">translate</span>
                <span class="font-label-sm text-label-sm text-on-surface-variant font-medium">100% Bahasa Indonesia</span>
              </div>
              <div class="flex items-center gap-space-xs p-space-xs rounded-lg bg-surface-container-lowest shadow-sm">
                <span class="material-symbols-outlined text-secondary text-[20px]">timer</span>
                <span class="font-label-sm text-label-sm text-on-surface-variant font-medium">Analisis Cepat &lt; 1 Menit</span>
              </div>
              <div class="flex items-center gap-space-xs p-space-xs rounded-lg bg-surface-container-lowest shadow-sm">
                <span class="material-symbols-outlined text-secondary text-[20px]">lock_open</span>
                <span class="font-label-sm text-label-sm text-on-surface-variant font-medium">Tanpa Akun untuk Mencoba</span>
              </div>
            </div>
          </div>

          {/* Right Column: Stitch Interactive Preview Card */}
          <div class="lg:col-span-6 relative mt-space-lg lg:mt-0">
            <div class="absolute inset-0 bg-surface-container-high rounded-xl -rotate-1 translate-x-2 translate-y-2 opacity-60"></div>
            <div class="relative bg-surface-container-lowest rounded-xl shadow-xl p-space-lg flex flex-col space-y-space-md">
              
              {/* Document Header Bar */}
              <div class="flex items-start justify-between gap-space-sm">
                <div class="flex items-center gap-space-sm min-w-0">
                  <div class="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary shrink-0">
                    <span class="material-symbols-outlined">description</span>
                  </div>
                  <div class="truncate">
                    <div class="flex items-center gap-space-xs">
                      <h3 class="font-title-sm text-title-sm text-on-surface truncate font-semibold">Perjanjian Sewa Kos Griya Harmoni</h3>
                      <span class="material-symbols-outlined text-secondary text-[16px]">verified</span>
                    </div>
                    <p class="font-label-sm text-label-sm text-on-surface-variant">PDF • 7 Pasal • Terindeks Vektor</p>
                  </div>
                </div>

                {/* Risk Score Metric */}
                <div class="flex flex-col items-end shrink-0 bg-error-container/40 px-space-sm py-1 rounded-lg">
                  <div class="flex items-baseline gap-1">
                    <span class="font-headline-md text-headline-md text-error font-bold">75</span>
                    <span class="font-label-sm text-label-sm text-on-surface-variant">/100</span>
                  </div>
                  <span class="font-label-sm text-label-sm text-error font-semibold">Tinggi Risiko</span>
                </div>
              </div>

              {/* Risk Distribution Breakdown */}
              <div class="bg-surface-container-low p-space-sm rounded-lg flex flex-col space-y-space-xs">
                <div class="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                  <span>Distribusi Risiko Klausul</span>
                  <span class="font-semibold text-on-surface">7 Pasal Total</span>
                </div>
                <div class="w-full h-2.5 rounded-full bg-surface-container flex overflow-hidden">
                  <div class="h-full bg-error" style={{ width: '28%' }}></div>
                  <div class="h-full bg-[#d97706]" style={{ width: '28%' }}></div>
                  <div class="h-full bg-secondary" style={{ width: '44%' }}></div>
                </div>
                <div class="flex items-center justify-between pt-1 font-label-sm text-label-sm">
                  <span class="inline-flex items-center gap-1 text-error font-semibold">
                    <span class="w-2 h-2 rounded-full bg-error"></span>2 Berisiko
                  </span>
                  <span class="inline-flex items-center gap-1 text-[#d97706] font-semibold">
                    <span class="w-2 h-2 rounded-full bg-[#d97706]"></span>2 Perlu Teliti
                  </span>
                  <span class="inline-flex items-center gap-1 text-secondary font-semibold">
                    <span class="w-2 h-2 rounded-full bg-secondary"></span>3 Aman
                  </span>
                </div>
              </div>

              {/* Clause Diff Card Preview */}
              <div class="bg-surface-container-lowest rounded-lg p-space-md space-y-space-sm border border-outline-variant/30 shadow-sm">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-space-xs">
                    <span class="px-2 py-0.5 rounded font-label-sm text-label-sm bg-error-container text-on-error-container font-semibold">
                      Pasal 3 • Uang Jaminan
                    </span>
                    <span class="font-label-sm text-label-sm text-error font-bold flex items-center gap-0.5">
                      <span class="material-symbols-outlined text-[14px]">warning</span> RISIKO TINGGI
                    </span>
                  </div>
                </div>

                <div class="p-space-sm rounded bg-surface-container-low font-body-legal text-body-sm text-on-surface-variant italic border-l-4 border-error">
                  “Apabila Pihak Kedua berhenti menyewa sebelum masa kontrak berakhir, maka seluruh uang deposit dianggap hangus dan tidak dapat dikembalikan dengan alasan apapun.”
                </div>

                <div class="p-space-sm rounded-lg bg-surface-container-low space-y-1">
                  <span class="font-label-sm text-label-sm text-secondary font-semibold uppercase flex items-center gap-1">
                    <span class="material-symbols-outlined text-[15px]">translate</span>
                    Maksud Bahasa Awam:
                  </span>
                  <p class="font-body-sm text-body-sm text-on-surface">
                    Uang jaminan Anda berisiko hilang tanpa bukti riil biaya kerusakan kamar.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="cara-kerja" class="w-full bg-surface-container-low py-space-xl px-margin">
        <div class="max-w-7xl mx-auto space-y-space-lg">
          <div class="text-center space-y-space-xs max-w-2xl mx-auto">
            <span class="font-label-md text-label-md text-secondary uppercase font-semibold">Alur Pengguna</span>
            <h2 class="font-headline-lg text-headline-lg text-on-surface font-bold">
              Cara Kerja CekKontrak
            </h2>
            <p class="font-body-default text-body-default text-on-surface-variant">
              Tiga langkah mudah dari berkas kontrak mentah menjadi bekal negosiasi yang jelas.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-space-lg pt-space-md">
            <div class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm space-y-space-sm">
              <div class="w-12 h-12 rounded-xl bg-secondary-container/40 text-on-secondary-container flex items-center justify-center font-bold text-headline-md">
                1
              </div>
              <h3 class="font-title-sm text-title-sm text-on-surface font-bold">Unggah PDF atau Tempel Teks</h3>
              <p class="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Sistem membaca dokumen, memverifikasi keterbacaan teks digital, dan memecah naskah secara rapi per pasal.
              </p>
            </div>

            <div class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm space-y-space-sm">
              <div class="w-12 h-12 rounded-xl bg-secondary-container/40 text-on-secondary-container flex items-center justify-center font-bold text-headline-md">
                2
              </div>
              <h3 class="font-title-sm text-title-sm text-on-surface font-bold">Analisis Risiko & Penjelasan Awam</h3>
              <p class="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Setiap pasal dinilai dalam 3 level warna (Merah, Kuning, Hijau) lengkap dengan alasan dan kalimat pengganti yang lebih adil.
              </p>
            </div>

            <div class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm space-y-space-sm">
              <div class="w-12 h-12 rounded-xl bg-secondary-container/40 text-on-secondary-container flex items-center justify-center font-bold text-headline-md">
                3
              </div>
              <h3 class="font-title-sm text-title-sm text-on-surface font-bold">Tanya RAG & Bekal Negosiasi</h3>
              <p class="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Ajukan pertanyaan ke Chatbot yang hanya menjawab dari isi kontrak, salin draf revisi, atau unduh laporan PDF resmi.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
