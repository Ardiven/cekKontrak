import React, { useState, useRef } from 'react';

export default function UnggahView({ onAnalyze, isLoading, onLoadSample }) {
  const [tab, setTab] = useState('pdf'); // 'pdf' or 'text'
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [contractType, setContractType] = useState('sewa_kos');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.toLowerCase().endsWith('.pdf')) {
        alert('File harus berformat PDF (.pdf)');
        return;
      }
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "));
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (!selected.name.toLowerCase().endsWith('.pdf')) {
        alert('File harus berformat PDF (.pdf)');
        return;
      }
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "));
      }
    }
  };

  const handleSubmit = () => {
    if (tab === 'pdf') {
      if (!file) {
        alert('Silakan pilih atau jatuhkan file PDF kontrak terlebih dahulu.');
        return;
      }
      onAnalyze({ type: 'pdf', file, title, contractType });
    } else {
      if (!text.trim() || text.trim().length < 20) {
        alert('Teks kontrak terlalu pendek (minimal 20 karakter).');
        return;
      }
      onAnalyze({ type: 'text', text, title, contractType });
    }
  };

  return (
    <div class="px-gutter lg:px-margin py-space-lg flex flex-col gap-space-lg max-w-7xl mx-auto w-full">
      
      {/* Top Header Breadcrumb & Heading */}
      <section class="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
        <div class="flex flex-col gap-space-xs">
          <div class="flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md uppercase tracking-wider">
            <span class="material-symbols-outlined text-[16px] text-secondary">shield</span>
            <span>Workspace Analisis</span>
            <span class="text-outline-variant">/</span>
            <span class="text-secondary font-semibold">Persiapan Dokumen</span>
          </div>
          <h1 class="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
            Analisis Kontrak Baru
          </h1>
          <p class="font-body-default text-body-default text-on-surface-variant max-w-2xl">
            Unggah dokumen PDF atau tempel isi pasal kontrak untuk mendeteksi klausul berisiko dan mendapatkan penjelasan awam dalam hitungan detik.
          </p>
        </div>

        {/* Security badges */}
        <div class="flex items-center gap-space-md p-space-sm bg-surface-container-low rounded-xl">
          <div class="flex items-center gap-space-xs px-space-sm py-space-xs bg-surface-container-lowest rounded-lg shadow-sm">
            <span class="material-symbols-outlined text-secondary text-[18px]">lock</span>
            <span class="font-label-sm text-label-sm text-on-surface font-semibold">Enkripsi Aman</span>
          </div>
          <div class="flex items-center gap-space-xs px-space-sm py-space-xs bg-surface-container-lowest rounded-lg shadow-sm">
            <span class="material-symbols-outlined text-secondary text-[18px]">bolt</span>
            <span class="font-label-sm text-label-sm text-on-surface font-semibold">Hash Caching ⚡</span>
          </div>
        </div>
      </section>

      {/* Main Grid: Form Left, Preview/Tips Right */}
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        
        {/* Left Column: Form Container */}
        <div class="lg:col-span-8 flex flex-col gap-space-lg">
          <div class="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-lg">
            
            {/* Tab switchers */}
            <div class="flex items-center gap-space-xs bg-surface-container-low p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setTab('pdf')}
                class={`flex-1 flex items-center justify-center gap-space-xs py-space-sm rounded-lg font-label-md text-label-md transition-all ${
                  tab === 'pdf' 
                    ? 'bg-surface-container-lowest text-on-surface shadow-sm font-semibold' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span class="material-symbols-outlined text-[18px] text-secondary">picture_as_pdf</span>
                <span>Unggah File PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setTab('text')}
                class={`flex-1 flex items-center justify-center gap-space-xs py-space-sm rounded-lg font-label-md text-label-md transition-all ${
                  tab === 'text' 
                    ? 'bg-surface-container-lowest text-on-surface shadow-sm font-semibold' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span class="material-symbols-outlined text-[18px]">edit_note</span>
                <span>Tempel Teks Kontrak</span>
              </button>
            </div>

            {/* Content: PDF Dropzone */}
            {tab === 'pdf' ? (
              <div class="flex flex-col gap-space-md">
                {!file ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    class="relative group bg-surface-container-low/70 hover:bg-secondary-container/20 rounded-xl p-space-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer border-2 border-dashed border-outline-variant/50 hover:border-secondary"
                  >
                    <div class="w-14 h-14 rounded-2xl bg-surface-container-lowest shadow-md flex items-center justify-center text-secondary mb-space-md group-hover:scale-110 transition-transform">
                      <span class="material-symbols-outlined text-[32px]">upload_file</span>
                    </div>
                    <p class="font-title-sm text-title-sm text-on-surface mb-space-xs font-semibold">
                      Tarik dan letakkan file PDF di sini atau <span class="text-secondary underline underline-offset-4">pilih file dari perangkat</span>
                    </p>
                    <p class="font-body-sm text-body-sm text-on-surface-variant max-w-md">
                      Mendukung PDF berbasis teks (maks 10MB / 25 halaman). Dokumen hasil scan foto tulisan tangan belum didukung.
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      class="hidden"
                    />
                  </div>
                ) : (
                  <div class="bg-surface-container-low rounded-xl p-space-md flex flex-col sm:flex-row sm:items-center justify-between gap-space-md shadow-sm border border-secondary/30">
                    <div class="flex items-center gap-space-md min-w-0">
                      <div class="w-12 h-12 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center flex-shrink-0">
                        <span class="material-symbols-outlined text-[28px]">picture_as_pdf</span>
                      </div>
                      <div class="flex flex-col min-w-0">
                        <span class="font-title-sm text-title-sm text-on-surface font-semibold truncate">{file.name}</span>
                        <span class="font-label-sm text-label-sm text-on-surface-variant">
                          {(file.size / 1024).toFixed(1)} KB • Siap dianalisis
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      class="px-space-sm py-space-xs rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest font-label-md text-label-md transition-colors flex items-center gap-1 self-end sm:self-center"
                    >
                      <span class="material-symbols-outlined text-[16px]">sync</span>
                      <span>Ganti File</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Content: Text Paste */
              <div class="flex flex-col gap-space-sm">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Tempelkan seluruh teks pasal kontrak perjanjian di sini... (Minimal 20 karakter)"
                  class="w-full h-64 p-space-md rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-default text-body-default focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 resize-y"
                />
                <div class="text-right font-label-sm text-label-sm text-on-surface-variant">
                  {text.length} karakter
                </div>
              </div>
            )}

            {/* Document Metadata Form */}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-space-md pt-space-xs border-t border-outline-variant/30">
              <div class="flex flex-col gap-1">
                <label class="font-label-md text-label-md text-on-surface-variant">Judul Kontrak (Opsional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Misal: Perjanjian Sewa Kamar Kos"
                  class="px-space-md py-2.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-default text-body-default focus:outline-none focus:border-secondary"
                />
              </div>

              <div class="flex flex-col gap-1">
                <label class="font-label-md text-label-md text-on-surface-variant">Kategori Kontrak</label>
                <select
                  value={contractType}
                  onChange={(e) => setContractType(e.target.value)}
                  class="px-space-md py-2.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-default text-body-default focus:outline-none focus:border-secondary"
                >
                  <option value="sewa_kos">Sewa Kos</option>
                  <option value="kerja_magang">Kerja Magang / Freelance</option>
                  <option value="pinjaman">Pinjaman Dana</option>
                  <option value="snk_aplikasi">Syarat & Ketentuan (S&K)</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
            </div>

            {/* Action CTA */}
            <div class="pt-space-sm flex justify-end">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                class="w-full sm:w-auto px-space-xl py-3 rounded-lg bg-secondary hover:bg-on-secondary-fixed-variant text-on-secondary font-label-md text-label-md shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <span class="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                    <span>Menganalisis Pasal...</span>
                  </>
                ) : (
                  <>
                    <span class="material-symbols-outlined text-[20px]">bolt</span>
                    <span>Mulai Analisis Kontrak</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

        {/* Right Column: Sample Contracts & Tips */}
        <div class="lg:col-span-4 flex flex-col gap-space-md">
          <div class="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-space-md">
            <h3 class="font-title-sm text-title-sm text-on-surface font-bold flex items-center gap-1.5">
              <span class="material-symbols-outlined text-secondary text-[20px]">quickreply</span>
              Coba Contoh Cepat:
            </h3>
            <p class="font-body-sm text-body-sm text-on-surface-variant">
              Klik salah satu contoh kontrak di bawah ini untuk langsung mengisi dan menguji sistem:
            </p>

            <div class="space-y-2">
              <button
                type="button"
                onClick={() => {
                  onLoadSample('sewa_kos');
                  setTab('text');
                }}
                class="w-full text-left p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors flex items-start gap-space-xs"
              >
                <span class="text-xl">🏠</span>
                <div>
                  <div class="font-label-md text-label-md text-on-surface font-semibold">Sewa Kos Griya Harmoni</div>
                  <div class="font-label-sm text-label-sm text-on-surface-variant">Memuat klausul deposit hangus & penalti keluar awal</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onLoadSample('kerja_magang');
                  setTab('text');
                }}
                class="w-full text-left p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors flex items-start gap-space-xs"
              >
                <span class="text-xl">💼</span>
                <div>
                  <div class="font-label-md text-label-md text-on-surface font-semibold">Kerja Magang & Freelance</div>
                  <div class="font-label-sm text-label-sm text-on-surface-variant">Klausul larangan proyek luar & wewenang sepihak</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onLoadSample('pinjaman');
                  setTab('text');
                }}
                class="w-full text-left p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors flex items-start gap-space-xs"
              >
                <span class="text-xl">💳</span>
                <div>
                  <div class="font-label-md text-label-md text-on-surface font-semibold">Pinjaman Dana Cepat</div>
                  <div class="font-label-sm text-label-sm text-on-surface-variant">Bunga harian 1.5% & akses kontak sepihak</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onLoadSample('snk_aplikasi');
                  setTab('text');
                }}
                class="w-full text-left p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors flex items-start gap-space-xs"
              >
                <span class="text-xl">📱</span>
                <div>
                  <div class="font-label-md text-label-md text-on-surface font-semibold">S&K SuperApp Digital</div>
                  <div class="font-label-sm text-label-sm text-on-surface-variant">Pelepasan ganti rugi total & ubah aturan sepihak</div>
                </div>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
