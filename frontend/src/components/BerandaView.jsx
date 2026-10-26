import React from 'react';

export default function BerandaView({ onStartUpload, onLoadSample }) {
  return (
    <div className="flex flex-col w-full space-y-10">

      {/* HERO SECTION */}
      <section className="relative w-full py-6 sm:py-10 overflow-hidden">
        {/* Subtle Ambient Aura Backgrounds */}
        <div className="absolute -top-32 -left-20 w-80 h-80 rounded-full bg-secondary-container/20 blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 -right-32 w-72 h-72 rounded-full bg-surface-variant/40 blur-3xl pointer-events-none"></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">

          {/* Left Column: Copy & Value Proposition */}
          <div className="flex flex-col items-start space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
              <span className="flex h-2 w-2 rounded-full bg-secondary animate-pulse"></span>
              <span className="font-label-md text-xs font-semibold">Pendamping Hukum Awam Berbasis AI</span>
            </div>

            <h1 className="font-headline-xl text-3xl sm:text-4xl lg:text-5xl text-slate-900 tracking-tight font-extrabold leading-[1.15]">
              Jangan Tanda Tangan Sebelum Kamu Paham Kontraknya.
            </h1>

            <p className="font-body-legal text-base text-slate-600 leading-relaxed">
              Unggah PDF atau tempel teks kontrakmu. Sistem secara otomatis mendeteksi pasal berisiko, menjelaskannya dalam bahasa awam, serta menyiapkan bekal negosiasi dan draf revisi yang adil.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
              <button
                type="button"
                onClick={onStartUpload}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-secondary hover:bg-on-secondary-fixed-variant text-white font-label-md text-sm font-semibold shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[19px]">document_scanner</span>
                <span>Mulai Analisis Gratis</span>
              </button>

              <a
                href="#cara-kerja"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-label-md text-sm font-semibold border border-slate-200 shadow-xs transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[19px] text-slate-500">play_circle</span>
                <span>Lihat Cara Kerja</span>
              </a>
            </div>

            {/* Quick Sample Contracts */}
            <div className="w-full">
              <span className="font-label-sm text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-2.5">
                Coba Contoh Kontrak Nyata (1-Klik):
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'sewa_kos', emoji: '🏠', label: 'Sewa Kos' },
                  { key: 'kerja_magang', emoji: '💼', label: 'Kerja Magang' },
                  { key: 'pinjaman', emoji: '💳', label: 'Pinjaman Dana' },
                  { key: 'snk_aplikasi', emoji: '📱', label: 'S&K Aplikasi' },
                ].map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onLoadSample(item.key)}
                    className="px-3 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center gap-2 transition-all border border-slate-200 hover:border-secondary shadow-xs cursor-pointer"
                  >
                    <span className="text-base">{item.emoji}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Trust Badges Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                <span className="material-symbols-outlined text-secondary text-[20px] shrink-0">translate</span>
                <span className="font-label-sm text-xs text-slate-600 font-medium">100% Bahasa Indonesia</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                <span className="material-symbols-outlined text-secondary text-[20px] shrink-0">timer</span>
                <span className="font-label-sm text-xs text-slate-600 font-medium">Analisis Cepat &lt; 1 Menit</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                <span className="material-symbols-outlined text-secondary text-[20px] shrink-0">lock_open</span>
                <span className="font-label-sm text-xs text-slate-600 font-medium">Bisa Tanpa Login</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Product Card Preview */}
          <div className="relative mt-2 lg:mt-0">
            <div className="relative bg-white rounded-2xl border border-slate-200/80 shadow-lg p-5 sm:p-6 flex flex-col space-y-4">

              {/* Document Header Bar */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-secondary shrink-0">
                    <span className="material-symbols-outlined">description</span>
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-title-sm text-sm text-slate-900 font-bold">Perjanjian Sewa Kamar Kost</h3>
                      <span className="material-symbols-outlined text-secondary text-[16px]">verified</span>
                    </div>
                    <p className="font-label-sm text-xs text-slate-500">PDF • 7 Pasal • Analisis Otomatis</p>
                  </div>
                </div>

                {/* Risk Score Metric Badge */}
                <div className="flex flex-col items-end shrink-0 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200/60">
                  <div className="flex items-baseline gap-1">
                    <span className="font-headline-md text-xl text-rose-600 font-extrabold">75</span>
                    <span className="font-label-sm text-xs text-slate-400">/100</span>
                  </div>
                  <span className="font-label-sm text-[11px] text-rose-700 font-bold uppercase tracking-wider">Tinggi Risiko</span>
                </div>
              </div>

              {/* Risk Distribution Breakdown */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 flex flex-col space-y-2">
                <div className="flex items-center justify-between font-label-sm text-xs text-slate-600">
                  <span>Distribusi Risiko Klausul</span>
                  <span className="font-semibold text-slate-900">7 Pasal Total</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 flex overflow-hidden">
                  <div className="h-full bg-rose-500" style={{ width: '28%' }}></div>
                  <div className="h-full bg-amber-500" style={{ width: '28%' }}></div>
                  <div className="h-full bg-emerald-500" style={{ width: '44%' }}></div>
                </div>
                <div className="flex items-center justify-between pt-1 font-label-sm text-xs">
                  <span className="inline-flex items-center gap-1 text-rose-700 font-bold">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>2 Berisiko
                  </span>
                  <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>2 Perlu Teliti
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>3 Aman
                  </span>
                </div>
              </div>

              {/* Clause Diff Card Spotlight */}
              <div className="bg-white rounded-xl p-4 space-y-3 border border-slate-200/90 shadow-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded font-label-sm text-xs bg-rose-100 text-rose-800 font-bold">
                    Pasal 3 • Uang Jaminan
                  </span>
                  <span className="font-label-sm text-xs text-rose-600 font-bold flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[14px]">warning</span> BERISIKO
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 font-body-legal text-xs text-slate-600 italic border-l-4 border-rose-500">
                  "Apabila Pihak Kedua berhenti menyewa sebelum masa kontrak berakhir, maka seluruh uang deposit dianggap hangus."
                </div>

                <div className="p-3 rounded-lg bg-teal-50/60 border border-teal-100/60 space-y-1">
                  <span className="font-label-sm text-xs text-teal-800 font-bold uppercase flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">translate</span>
                    Maksud Bahasa Awam:
                  </span>
                  <p className="font-body-sm text-xs text-slate-700 leading-relaxed">
                    Uang deposit Anda berisiko hilang sepihak jika Anda harus pindah sebelum kontrak habis.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="cara-kerja" className="w-full bg-slate-100/80 rounded-2xl py-10 px-5 sm:px-10 border border-slate-200/70">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="font-label-md text-xs text-secondary uppercase font-bold tracking-wider">Alur Mudah</span>
            <h2 className="font-headline-lg text-2xl sm:text-3xl text-slate-900 font-bold tracking-tight">
              Cara Kerja CekKontrak
            </h2>
            <p className="font-body-default text-sm text-slate-600">
              Ubah naskah hukum yang rumit menjadi pemahaman jelas dan bekal negosiasi yang konkret.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                num: 1,
                title: 'Unggah PDF atau Tempel Teks',
                desc: 'Sistem mengekstrak naskah PDF secara otomatis, memvalidasi teks digital, dan memecah dokumen secara rapi per pasal.'
              },
              {
                num: 2,
                title: 'Analisis Risiko & Penjelasan Awam',
                desc: 'Tiap pasal dinilai dalam 3 tingkatan (Merah, Kuning, Hijau), dijelaskan alasannya, dan dilengkapi usulan draf revisi adil.'
              },
              {
                num: 3,
                title: 'Tanya RAG & Bekal Negosiasi',
                desc: 'Ajukan pertanyaan ke Chatbot yang hanya menjawab dari isi kontrak, salin poin pertanyaan negosiasi, atau ekspor laporan PDF.'
              }
            ].map(step => (
              <div key={step.num} className="bg-white p-6 rounded-xl shadow-xs border border-slate-200/80 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-secondary flex items-center justify-center font-extrabold text-lg">
                  {step.num}
                </div>
                <h3 className="font-title-sm text-sm text-slate-900 font-bold">{step.title}</h3>
                <p className="font-body-sm text-xs text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
