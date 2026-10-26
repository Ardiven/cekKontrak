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
        alert('Silakan pilih atau tarik file PDF kontrak terlebih dahulu.');
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
    <div className="py-4 sm:py-6 flex flex-col gap-6 sm:gap-8 max-w-6xl mx-auto w-full">
      
      {/* Top Header Breadcrumb & Heading */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-slate-500 font-label-md text-xs uppercase tracking-wider">
            <span className="material-symbols-outlined text-[16px] text-secondary">shield</span>
            <span>Workspace Analisis</span>
            <span className="text-slate-300">/</span>
            <span className="text-secondary font-bold">Persiapan Dokumen</span>
          </div>
          <h1 className="font-headline-xl text-2xl sm:text-3xl text-slate-900 tracking-tight font-extrabold">
            Analisis Kontrak Baru
          </h1>
          <p className="font-body-default text-sm text-slate-600 max-w-2xl">
            Unggah file PDF atau tempel teks pasal kontrak Anda untuk membedah potensi risiko, alasan, dan draf revisi yang adil.
          </p>
        </div>

        {/* Security badges */}
        <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-100 rounded-xl border border-slate-200/80">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg shadow-xs border border-slate-200">
            <span className="material-symbols-outlined text-secondary text-[16px]">lock</span>
            <span className="font-label-sm text-xs text-slate-800 font-semibold">Enkripsi Aman</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg shadow-xs border border-slate-200">
            <span className="material-symbols-outlined text-secondary text-[16px]">bolt</span>
            <span className="font-label-sm text-xs text-slate-800 font-semibold">Hash Caching ⚡</span>
          </div>
        </div>
      </section>

      {/* Main Grid: Form Left, Preview/Tips Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        
        {/* Left Column: Form Container */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-8 flex flex-col gap-6">
            
            {/* Tab switchers */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200/70">
              <button
                type="button"
                onClick={() => setTab('pdf')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-label-md text-sm transition-all cursor-pointer ${
                  tab === 'pdf' 
                    ? 'bg-white text-slate-900 shadow-xs font-bold border border-slate-200/70' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[19px] text-secondary">picture_as_pdf</span>
                <span>Unggah File PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setTab('text')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-label-md text-sm transition-all cursor-pointer ${
                  tab === 'text' 
                    ? 'bg-white text-slate-900 shadow-xs font-bold border border-slate-200/70' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[19px]">edit_note</span>
                <span>Tempel Teks Kontrak</span>
              </button>
            </div>

            {/* Content: PDF Dropzone */}
            {tab === 'pdf' ? (
              <div className="flex flex-col gap-4">
                {!file ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className="relative group bg-slate-50 hover:bg-teal-50/50 rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer border-2 border-dashed border-slate-300 hover:border-secondary"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-xs flex items-center justify-center text-secondary mb-3 group-hover:scale-105 transition-transform border border-slate-200">
                      <span className="material-symbols-outlined text-[32px]">upload_file</span>
                    </div>
                    <p className="font-title-sm text-sm sm:text-base text-slate-800 mb-1 font-semibold">
                      Tarik dan letakkan file PDF di sini atau <span className="text-secondary underline underline-offset-4">pilih dari perangkat</span>
                    </p>
                    <p className="font-body-sm text-xs text-slate-500 max-w-md">
                      Mendukung PDF berbasis teks (maks 10MB / 25 halaman). Dokumen hasil foto tulisan tangan belum didukung.
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-secondary/40 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-[24px]">picture_as_pdf</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-title-sm text-sm text-slate-900 font-bold truncate">{file.name}</span>
                        <span className="font-label-sm text-xs text-slate-500">
                          {(file.size / 1024).toFixed(1)} KB • Siap dianalisis
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200 font-label-md text-xs transition-colors flex items-center gap-1 self-end sm:self-center cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">sync</span>
                      <span>Ganti File</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Content: Text Paste */
              <div className="flex flex-col gap-2">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Tempelkan seluruh teks pasal kontrak perjanjian di sini... (Minimal 20 karakter)"
                  className="w-full h-64 p-4 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-body-default text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 resize-y"
                />
                <div className="text-right font-label-sm text-xs text-slate-500">
                  {text.length} karakter
                </div>
              </div>
            )}

            {/* Document Metadata Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-xs text-slate-700 font-semibold">Judul Kontrak (Opsional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Misal: Perjanjian Sewa Kamar Kost"
                  className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-body-default text-sm focus:outline-none focus:border-secondary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-xs text-slate-700 font-semibold">Kategori Kontrak</label>
                <select
                  value={contractType}
                  onChange={(e) => setContractType(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-body-default text-sm focus:outline-none focus:border-secondary"
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
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-secondary hover:bg-on-secondary-fixed-variant text-white font-label-md text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-98"
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                    <span>Menganalisis Pasal...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">bolt</span>
                    <span>Mulai Analisis Kontrak</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

        {/* Right Column: Sample Contracts Quick Test */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <h3 className="font-title-sm text-sm text-slate-900 font-bold flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <span className="material-symbols-outlined text-secondary text-[20px]">quickreply</span>
              Coba Contoh Cepat:
            </h3>
            <p className="font-body-sm text-xs text-slate-600 leading-relaxed">
              Klik salah satu dokumen uji coba di bawah ini untuk langsung mengisi dan menguji sistem:
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  onLoadSample('sewa_kos');
                  setTab('text');
                }}
                className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-teal-50/50 border border-slate-200/70 hover:border-secondary transition-all flex items-start gap-2.5 cursor-pointer"
              >
                <span className="text-xl">🏠</span>
                <div className="min-w-0">
                  <div className="font-label-md text-xs text-slate-900 font-bold truncate">Sewa Kos Griya Harmoni</div>
                  <div className="font-label-sm text-[11px] text-slate-500 leading-snug">Deposit hangus & penalti sisa sewa</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onLoadSample('kerja_magang');
                  setTab('text');
                }}
                className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-teal-50/50 border border-slate-200/70 hover:border-secondary transition-all flex items-start gap-2.5 cursor-pointer"
              >
                <span className="text-xl">💼</span>
                <div className="min-w-0">
                  <div className="font-label-md text-xs text-slate-900 font-bold truncate">Kerja Magang & Freelance</div>
                  <div className="font-label-sm text-[11px] text-slate-500 leading-snug">Larangan non-compete 2 tahun & hak cipta</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onLoadSample('pinjaman');
                  setTab('text');
                }}
                className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-teal-50/50 border border-slate-200/70 hover:border-secondary transition-all flex items-start gap-2.5 cursor-pointer"
              >
                <span className="text-xl">💳</span>
                <div className="min-w-0">
                  <div className="font-label-md text-xs text-slate-900 font-bold truncate">Pinjaman Dana Cepat</div>
                  <div className="font-label-sm text-[11px] text-slate-500 leading-snug">Bunga harian 1.5% & akses kontak</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onLoadSample('snk_aplikasi');
                  setTab('text');
                }}
                className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-teal-50/50 border border-slate-200/70 hover:border-secondary transition-all flex items-start gap-2.5 cursor-pointer"
              >
                <span className="text-xl">📱</span>
                <div className="min-w-0">
                  <div className="font-label-md text-xs text-slate-900 font-bold truncate">S&K SuperApp Digital</div>
                  <div className="font-label-sm text-[11px] text-slate-500 leading-snug">Pelepasan ganti rugi total & klausul sepihak</div>
                </div>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
