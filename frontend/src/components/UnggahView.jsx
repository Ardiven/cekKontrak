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

  const handleSubmit = (e) => {
    e?.preventDefault();
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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      
      {/* Hero Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
          Pahami kontrak sebelum kamu tanda tangan
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-lg mx-auto">
          Unggah PDF atau tempel teks. Kamu akan tahu pasal mana yang perlu diwaspadai.
        </p>
      </div>

      {/* Main Upload Card / Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 mb-6">
        
        {/* Tab Switcher: Segmented Control Polos */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg mb-5 max-w-xs mx-auto">
          <button
            type="button"
            onClick={() => setTab('pdf')}
            className={`flex-1 py-1.5 text-xs sm:text-sm font-medium rounded transition-colors cursor-pointer ${
              tab === 'pdf'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            PDF
          </button>
          <button
            type="button"
            onClick={() => setTab('text')}
            className={`flex-1 py-1.5 text-xs sm:text-sm font-medium rounded transition-colors cursor-pointer ${
              tab === 'text'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Teks
          </button>
        </div>

        {/* Upload Mode: PDF */}
        {tab === 'pdf' ? (
          <div className="mb-5">
            {!file ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-300 hover:border-accent rounded-xl p-8 sm:p-10 text-center transition-colors cursor-pointer bg-slate-50/50 hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-[32px] text-slate-400 mb-2 block">
                  upload_file
                </span>
                <p className="text-sm font-medium text-slate-800">
                  Tarik file PDF ke sini
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  atau <span className="text-accent underline">pilih dari perangkat</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-3">
                  Maksimal 10MB / 25 halaman. PDF berbasis teks.
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
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="material-symbols-outlined text-[20px] text-accent shrink-0">
                    description
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-xs text-slate-600 hover:text-slate-900 underline shrink-0 cursor-pointer"
                >
                  Ganti
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Upload Mode: Text */
          <div className="mb-5">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Tempelkan seluruh teks pasal kontrak perjanjian di sini..."
              className="w-full h-44 p-3 rounded border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-y"
            />
            <div className="text-right text-[11px] text-slate-400 mt-1">
              {text.length} karakter
            </div>
          </div>
        )}

        {/* Inputs: Judul & Jenis Kontrak */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Judul (opsional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Misal: Perjanjian Sewa Kos"
              className="w-full h-10 px-3 rounded border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Jenis kontrak
            </label>
            <select
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
              className="w-full h-10 px-3 rounded border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 bg-white"
            >
              <option value="sewa_kos">Sewa Kos</option>
              <option value="kerja_magang">Kerja Magang / Freelance</option>
              <option value="pinjaman">Pinjaman Dana</option>
              <option value="snk_aplikasi">S&K Aplikasi</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full h-10 bg-accent hover:bg-accent-hover text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                <span>Menganalisis…</span>
              </>
            ) : (
              <span>Analisis kontrak</span>
            )}
          </button>
        </div>

        {/* Disclaimer Note */}
        <p className="text-center text-xs text-slate-500 mt-3">
          CekKontrak membantu memahami kontrak, bukan pengganti nasihat hukum.
        </p>

      </div>

      {/* Contoh Kontrak 1-Klik: Links */}
      <div className="text-center text-xs text-slate-500 mb-10">
        <span className="text-slate-600 font-medium">Belum punya kontrak? Coba contoh:</span>{' '}
        <span className="inline-flex flex-wrap justify-center gap-1.5 mt-1 sm:mt-0">
          <button
            type="button"
            onClick={() => onLoadSample('sewa_kos')}
            className="text-accent hover:underline cursor-pointer"
          >
            Sewa kos
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => onLoadSample('kerja_magang')}
            className="text-accent hover:underline cursor-pointer"
          >
            Magang
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => onLoadSample('pinjaman')}
            className="text-accent hover:underline cursor-pointer"
          >
            Pinjaman
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => onLoadSample('snk_aplikasi')}
            className="text-accent hover:underline cursor-pointer"
          >
            S&K aplikasi
          </button>
        </span>
      </div>

      {/* Divider */}
      <hr className="border-slate-200 mb-8" />

      {/* Cara Kerja: 3 Kolom Singkat */}
      <div>
        <h2 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-4 text-center">
          Cara kerja
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
          <div>
            <div className="text-sm font-semibold text-slate-900 mb-1">
              <span className="text-accent font-bold mr-1">1</span> Unggah
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tarik file PDF atau tempelkan teks pasal kontrak yang ingin kamu periksa.
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900 mb-1">
              <span className="text-accent font-bold mr-1">2</span> Baca hasil
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ketahui skor risiko dan pasal mana yang berpotensi merugikan posisi kamu.
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900 mb-1">
              <span className="text-accent font-bold mr-1">3</span> Tanya AI
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tanyakan rincian atau minta saran negosiasi langsung berbasis nomor pasal kontrak.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
