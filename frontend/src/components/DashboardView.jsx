import React, { useState } from 'react';

export default function DashboardView({ doc, onOpenChat, onNewAnalysis, onCopy }) {
  const [filter, setFilter] = useState('all');

  if (!doc) return null;

  const filteredClauses = (doc.clauses || []).filter(c => {
    if (filter === 'all') return true;
    return c.level === filter;
  });

  const isRedScore = doc.overall_score >= 60;
  const isYellowScore = doc.overall_score >= 35 && doc.overall_score < 60;

  const filterButtons = [
    { key: 'all', label: `Semua (${doc.clauses?.length || 0})`, activeClass: 'bg-slate-900 text-white', inactiveClass: 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200' },
    { key: 'merah', label: `🔴 Berisiko (${doc.counts?.merah || 0})`, activeClass: 'bg-rose-600 text-white', inactiveClass: 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200' },
    { key: 'kuning', label: `🟡 Perlu Teliti (${doc.counts?.kuning || 0})`, activeClass: 'bg-amber-600 text-white', inactiveClass: 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-200' },
    { key: 'hijau', label: `🟢 Aman (${doc.counts?.hijau || 0})`, activeClass: 'bg-emerald-600 text-white', inactiveClass: 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200' },
  ];

  return (
    <div className="py-4 max-w-7xl mx-auto w-full space-y-5">

      {/* Top Document Meta Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/80">
        <div className="flex flex-col gap-4">
          {/* Meta Row */}
          <div className="flex flex-wrap items-center gap-2 font-label-sm text-xs text-slate-500">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 font-bold uppercase tracking-wider border border-teal-200/60">
              {doc.contract_type || 'Perjanjian'}
            </span>
            <span className="text-slate-300">•</span>
            <span>Dianalisis: {doc.created_at ? doc.created_at.substring(0, 10) : 'Hari ini'}</span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">auto_stories</span>
              {doc.clauses ? doc.clauses.length : 0} Pasal
            </span>
            {doc.from_cache && (
              <span className="text-secondary font-bold flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[14px]">bolt</span>
                Cache Hash
              </span>
            )}
          </div>

          {/* Title + Action Group */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <h1 className="font-headline-lg text-xl sm:text-2xl lg:text-3xl text-slate-900 tracking-tight font-extrabold leading-tight">
              {doc.title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => window.open(`/api/documents/${doc.document_id}/export`, '_blank')}
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-label-md text-xs font-semibold transition-all border border-slate-200 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">download</span>
                <span className="hidden sm:inline">Ekspor PDF</span>
                <span className="sm:hidden">Ekspor</span>
              </button>

              <button
                type="button"
                onClick={onOpenChat}
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-label-md text-xs font-semibold transition-all shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px] text-teal-400">forum</span>
                <span className="hidden sm:inline">Tanya AI Kontrak</span>
                <span className="sm:hidden">Tanya AI</span>
              </button>

              <button
                type="button"
                onClick={onNewAnalysis}
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-label-md text-xs font-semibold transition-all border border-slate-200 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">add</span>
                <span className="hidden sm:inline">Kontrak Lain</span>
                <span className="sm:hidden">Baru</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Risk Assessment */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/80">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

          {/* Score & Status Indicator */}
          <div className="lg:col-span-4 bg-slate-50 rounded-xl p-5 flex flex-col justify-between border border-slate-200/70 gap-4">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <span className="font-label-sm text-xs text-slate-500 uppercase tracking-wider font-bold">Tingkat Risiko Dokumen</span>
                <p className="font-body-sm text-xs text-slate-600">Evaluasi bobot pasal hukum</p>
              </div>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-label-md text-xs font-bold ${
                isRedScore
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : isYellowScore
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                <span className="material-symbols-outlined text-[14px]">report_problem</span>
                <span>{doc.risk_level?.toUpperCase()}</span>
              </span>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="font-headline-xl text-4xl sm:text-5xl text-slate-900 tracking-tight font-extrabold">{doc.overall_score}</span>
              <span className="font-headline-md text-xl text-slate-400 font-semibold">/ 100</span>
              <span className={`ml-2 font-label-sm text-xs px-2 py-0.5 rounded font-bold ${
                isRedScore ? 'text-rose-700 bg-rose-100' : isYellowScore ? 'text-amber-800 bg-amber-100' : 'text-emerald-800 bg-emerald-100'
              }`}>
                {isRedScore ? 'Rentan Sengketa' : isYellowScore ? 'Perlu Teliti' : 'Klausul Standar'}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                <div className="bg-rose-500 h-full transition-all duration-500" style={{ width: `${Math.min((doc.counts?.merah || 0) * 25, 45)}%` }}></div>
                <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${Math.min((doc.counts?.kuning || 0) * 15, 35)}%` }}></div>
                <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: '35%' }}></div>
              </div>
              <div className="flex justify-between font-label-sm text-[11px] text-slate-500">
                <span>0 (Kritis)</span>
                <span>Toleransi</span>
                <span>100 (Aman)</span>
              </div>
            </div>
          </div>

          {/* Plain Language Executive Summary */}
          <div className="lg:col-span-8 flex flex-col justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-secondary font-label-md text-xs uppercase font-bold tracking-wider">
                <span className="material-symbols-outlined text-[18px]">psychology</span>
                <span>Kesimpulan Awam dari AI CekKontrak:</span>
              </div>
              <p className="font-body-legal text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                {doc.summary}
              </p>
            </div>

            {/* 3 Metric Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-rose-50/70 border border-rose-200/70 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs">
                <div className="space-y-0.5">
                  <span className="font-label-sm text-xs text-rose-800 font-bold">Risiko Tinggi</span>
                  <p className="font-headline-md text-xl sm:text-2xl text-rose-800 font-extrabold">{doc.counts?.merah || 0} Pasal</p>
                  <span className="font-label-sm text-[11px] text-rose-700 font-medium hidden sm:block">Perlu Negosiasi</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-rose-200/70 flex items-center justify-center text-rose-800 shrink-0">
                  <span className="material-symbols-outlined text-[20px]">warning</span>
                </div>
              </div>

              <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs">
                <div className="space-y-0.5">
                  <span className="font-label-sm text-xs text-amber-800 font-bold">Perlu Teliti</span>
                  <p className="font-headline-md text-xl sm:text-2xl text-amber-800 font-extrabold">{doc.counts?.kuning || 0} Pasal</p>
                  <span className="font-label-sm text-[11px] text-amber-700 font-medium hidden sm:block">Minta Klarifikasi</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-amber-200/70 flex items-center justify-center text-amber-800 shrink-0">
                  <span className="material-symbols-outlined text-[20px]">info</span>
                </div>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs">
                <div className="space-y-0.5">
                  <span className="font-label-sm text-xs text-emerald-800 font-bold">Aman</span>
                  <p className="font-headline-md text-xl sm:text-2xl text-emerald-800 font-extrabold">{doc.counts?.hijau || 0} Pasal</p>
                  <span className="font-label-sm text-[11px] text-emerald-700 font-medium hidden sm:block">Hak Wajar</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-200/70 flex items-center justify-center text-emerald-800 shrink-0">
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Scrollable filter tabs on mobile */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 -mx-4 sm:mx-0 px-4 sm:px-0">
          {filterButtons.map(btn => (
            <button
              key={btn.key}
              type="button"
              onClick={() => setFilter(btn.key)}
              className={`px-3 sm:px-4 py-2 rounded-xl font-label-md text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                filter === btn.key ? btn.activeClass : btn.inactiveClass
              }`}
            >
              {btn.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setFilter('questions')}
            className={`px-3 sm:px-4 py-2 rounded-xl font-label-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              filter === 'questions'
                ? 'bg-teal-700 text-white'
                : 'bg-white text-teal-800 hover:bg-teal-50 border border-teal-200'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">quiz</span>
            <span>Pertanyaan ({doc.questions?.length || 0})</span>
          </button>
        </div>

        <span className="font-label-sm text-xs text-slate-500 font-medium shrink-0">
          {filter === 'questions' ? (doc.questions?.length || 0) : filteredClauses.length} item
        </span>
      </div>

      {/* Main Content: Clauses List or Questions List */}
      {filter === 'questions' ? (
        <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-xs border border-slate-200/80 space-y-4">
          <div className="space-y-1">
            <h3 className="font-title-sm text-lg text-slate-900 font-bold">Daftar Pertanyaan Sebelum Tanda Tangan</h3>
            <p className="font-body-sm text-xs sm:text-sm text-slate-600">
              Gunakan poin-poin pertanyaan strategis ini saat bernegosiasi dengan pihak pengelola atau perusahaan:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {doc.questions && doc.questions.map((q, idx) => (
              <div key={q.id || idx} className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 shadow-xs hover:border-teal-400 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full font-label-sm text-xs bg-teal-100 text-teal-900 font-bold">
                    Pertanyaan {idx + 1}{q.nomor_pasal ? ` • Pasal ${q.nomor_pasal}` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => onCopy(q.pertanyaan)}
                    className="text-secondary hover:text-teal-900 font-label-sm text-xs flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    <span className="material-symbols-outlined text-[15px]">content_copy</span>
                    <span>Salin</span>
                  </button>
                </div>
                <p className="font-title-sm text-sm text-slate-900 font-bold">{q.pertanyaan}</p>
                <p className="font-body-sm text-xs text-slate-600 leading-relaxed">
                  <strong>Tujuan:</strong> {q.tujuan}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Clauses List */
        <div className="space-y-4">
          {filteredClauses.map((c) => {
            const isRed = c.level === 'merah';
            const isYellow = c.level === 'kuning';
            const borderRibbon = isRed ? 'border-l-4 border-rose-500' : isYellow ? 'border-l-4 border-amber-500' : 'border-l-4 border-emerald-500';

            return (
              <div
                key={c.nomor_pasal}
                id={`clause-card-${c.nomor_pasal}`}
                className={`bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/80 space-y-4 ${borderRibbon} transition-all duration-300`}
              >
                {/* Clause Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-headline-md text-lg text-slate-900 font-extrabold">Pasal {c.nomor_pasal}</span>
                    {c.judul && <span className="font-title-sm text-sm text-slate-600 font-medium">• {c.judul}</span>}
                    <span className={`px-2.5 py-0.5 rounded font-label-sm text-xs font-bold ${
                      isRed ? 'bg-rose-100 text-rose-800' : isYellow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isRed ? 'Risiko Tinggi' : isYellow ? 'Perlu Teliti' : 'Aman & Wajar'}
                    </span>
                  </div>

                  <span className={`font-label-sm text-xs font-bold flex items-center gap-1 shrink-0 ${
                    isRed ? 'text-rose-600' : isYellow ? 'text-amber-700' : 'text-emerald-700'
                  }`}>
                    <span className="material-symbols-outlined text-[16px]">
                      {isRed ? 'warning' : isYellow ? 'info' : 'check_circle'}
                    </span>
                    <span className="hidden sm:inline">{isRed ? 'KLAUSUL BERISIKO' : isYellow ? 'PERLU KLARIFIKASI' : 'KETENTUAN STANDAR'}</span>
                  </span>
                </div>

                {/* Source Original Text */}
                <div className="p-4 rounded-xl bg-slate-50 font-body-legal text-xs sm:text-sm text-slate-600 italic border border-slate-200/60 leading-relaxed">
                  "{c.isi}"
                </div>

                {/* 2-Column Explanation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/60 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-500 font-label-sm text-xs font-bold uppercase tracking-wider">
                      <span className="material-symbols-outlined text-[16px] text-slate-600">visibility</span>
                      <span>Alasan Penilaian Risiko:</span>
                    </div>
                    <p className="font-body-default text-xs sm:text-sm text-slate-800 leading-relaxed">{c.alasan}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-100/80 space-y-1">
                    <div className="flex items-center gap-1.5 text-teal-800 font-label-sm text-xs font-bold uppercase tracking-wider">
                      <span className="material-symbols-outlined text-[16px]">translate</span>
                      <span>Maksud Bahasa Awam:</span>
                    </div>
                    <p className="font-body-default text-xs sm:text-sm text-slate-800 leading-relaxed">{c.penjelasan_awam}</p>
                  </div>
                </div>

                {/* Fair Revision Suggestion */}
                {c.saran_revisi && (
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <span className="font-label-md text-xs text-amber-900 font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-amber-700">tips_and_updates</span>
                        Usulan Draf Pengganti yang Lebih Adil:
                      </span>
                      <p className="font-body-sm text-xs sm:text-sm text-slate-800 italic leading-relaxed">"{c.saran_revisi}"</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onCopy(c.saran_revisi)}
                      className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-amber-300 text-slate-900 font-label-md text-xs font-semibold flex items-center gap-1 shrink-0 self-start sm:self-center shadow-xs cursor-pointer active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-[15px]">content_copy</span>
                      <span>Salin Revisi</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
