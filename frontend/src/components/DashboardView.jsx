import React, { useState, useMemo } from 'react';

export default function DashboardView({ doc, onOpenChat, onNewAnalysis, onCopy }) {
  const [filter, setFilter] = useState('all'); // 'all', 'merah', 'kuning', 'hijau'

  // Sort clauses: Berisiko (merah) -> Perlu teliti (kuning) -> Aman (hijau)
  const sortedClauses = useMemo(() => {
    if (!doc?.clauses) return [];
    const priority = { merah: 1, kuning: 2, hijau: 3 };
    return [...doc.clauses].sort((a, b) => {
      const pA = priority[a.level] || 4;
      const pB = priority[b.level] || 4;
      if (pA !== pB) return pA - pB;
      return (parseInt(a.nomor_pasal, 10) || 0) - (parseInt(b.nomor_pasal, 10) || 0);
    });
  }, [doc]);

  // Accordion state: Berisiko (merah) open by default, others closed
  const [openMap, setOpenMap] = useState(() => {
    const initial = {};
    if (doc?.clauses) {
      doc.clauses.forEach((c) => {
        if (c.level === 'merah') {
          initial[c.nomor_pasal] = true;
        }
      });
    }
    return initial;
  });

  const toggleAccordion = (num) => {
    setOpenMap((prev) => ({ ...prev, [num]: !prev[num] }));
  };

  if (!doc) return null;

  const filteredClauses = sortedClauses.filter((c) => {
    if (filter === 'all') return true;
    return c.level === filter;
  });

  // Risk styling tokens per design.md
  const getRiskMeta = (level) => {
    if (level === 'merah') {
      return { dot: 'bg-rose-500', text: 'text-rose-700', label: 'Berisiko' };
    }
    if (level === 'kuning') {
      return { dot: 'bg-amber-500', text: 'text-amber-700', label: 'Perlu teliti' };
    }
    return { dot: 'bg-emerald-500', text: 'text-emerald-700', label: 'Aman' };
  };

  // Score bar color
  const score = doc.overall_score || 0;
  let scoreBarColor = 'bg-emerald-500';
  if (score >= 60) scoreBarColor = 'bg-rose-500';
  else if (score >= 35) scoreBarColor = 'bg-amber-500';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      
      {/* Header Meta & Title */}
      <div className="mb-6">
        <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5 flex-wrap">
          <span className="capitalize">{doc.contract_type?.replace('_', ' ') || 'Perjanjian'}</span>
          <span>·</span>
          <span>{doc.clauses?.length || 0} pasal</span>
          <span>·</span>
          <span>{doc.created_at ? doc.created_at.substring(0, 10) : 'Hari ini'}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mt-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
            {doc.title}
          </h1>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => window.open(`/api/documents/${doc.document_id}/export`, '_blank')}
              className="h-9 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded text-xs font-medium transition-colors cursor-pointer"
            >
              Ekspor PDF
            </button>
            <button
              type="button"
              onClick={onOpenChat}
              className="h-9 px-3 bg-accent hover:bg-accent-hover text-white rounded text-xs font-medium transition-colors cursor-pointer"
            >
              Tanya AI
            </button>
          </div>
        </div>
      </div>

      {/* Score Block */}
      <div className="border-t border-slate-200 pt-6 mb-6">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl sm:text-5xl font-bold text-slate-900 tabular-nums">
            {score}
          </span>
          <span className="text-xl sm:text-2xl text-slate-400 font-normal">/ 100</span>
          <span className="text-base sm:text-lg font-semibold text-slate-700 ml-2">
            {doc.risk_label || (score >= 60 ? 'Rentan Sengketa' : score >= 35 ? 'Perlu Kehati-hatian' : 'Cukup Aman')}
          </span>
        </div>

        {/* Thin 4px Progress Bar */}
        <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden mt-3 mb-4">
          <div
            className={`h-full ${scoreBarColor} transition-all duration-300`}
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>

        {/* AI Summary */}
        <p className="text-sm text-slate-700 leading-relaxed mb-4">
          <strong className="font-semibold text-slate-900">Kesimpulan: </strong>
          {doc.overall_summary}
        </p>

        {/* 3 Counts as Text with Dots */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium pt-1">
          <span className="inline-flex items-center gap-1.5 text-rose-700">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            <span>{doc.counts?.merah || 0} Berisiko</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-amber-700">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            <span>{doc.counts?.kuning || 0} Perlu teliti</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>{doc.counts?.hijau || 0} Aman</span>
          </span>
        </div>
      </div>

      {/* Filter Segmented Control */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg mb-6 overflow-x-auto">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors shrink-0 cursor-pointer ${
            filter === 'all'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Semua ({doc.clauses?.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setFilter('merah')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors shrink-0 cursor-pointer ${
            filter === 'merah'
              ? 'bg-white text-rose-700 shadow-2xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Berisiko ({doc.counts?.merah || 0})
        </button>
        <button
          type="button"
          onClick={() => setFilter('kuning')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors shrink-0 cursor-pointer ${
            filter === 'kuning'
              ? 'bg-white text-amber-700 shadow-2xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Perlu teliti ({doc.counts?.kuning || 0})
        </button>
        <button
          type="button"
          onClick={() => setFilter('hijau')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors shrink-0 cursor-pointer ${
            filter === 'hijau'
              ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Aman ({doc.counts?.hijau || 0})
        </button>
      </div>

      {/* Clause Accordion List */}
      <div className="divide-y divide-slate-200 border-y border-slate-200 mb-10">
        {filteredClauses.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Tidak ada pasal dalam kategori filter ini.
          </div>
        ) : (
          filteredClauses.map((c) => {
            const risk = getRiskMeta(c.level);
            const isOpen = !!openMap[c.nomor_pasal];

            return (
              <div
                key={c.nomor_pasal}
                id={`clause-card-${c.nomor_pasal}`}
                className="py-3.5 transition-colors"
              >
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleAccordion(c.nomor_pasal)}
                  className="w-full flex items-center justify-between gap-3 text-left focus:outline-none cursor-pointer py-1 group"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full ${risk.dot} shrink-0`} />
                    <span className={`text-xs font-semibold ${risk.text} shrink-0`}>
                      {risk.label}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-sm font-semibold text-slate-900 truncate group-hover:text-accent transition-colors">
                      Pasal {c.nomor_pasal} {c.judul ? `· ${c.judul}` : ''}
                    </span>
                  </div>

                  <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-slate-700 shrink-0">
                    {isOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {/* Accordion Body (Stacked Vertically) */}
                {isOpen && (
                  <div className="mt-3 pl-4 sm:pl-5 space-y-4 text-sm text-slate-800">
                    
                    {/* 1. Teks Asli Pasal (Gaya Legal) */}
                    <div>
                      <div className="text-xs font-medium text-slate-500 mb-1">Teks asli pasal:</div>
                      <div className="text-[15px] leading-[26px] text-slate-800 bg-slate-50 border border-slate-200 rounded p-3 font-normal whitespace-pre-line">
                        {c.isi}
                      </div>
                    </div>

                    {/* 2. Kenapa Berisiko */}
                    {c.alasan && (
                      <div>
                        <div className="text-xs font-semibold text-slate-900 mb-0.5">Kenapa berisiko:</div>
                        <p className="text-sm text-slate-700 leading-relaxed">{c.alasan}</p>
                      </div>
                    )}

                    {/* 3. Artinya dalam Bahasa Sehari-hari */}
                    {c.penjelasan_awam && (
                      <div>
                        <div className="text-xs font-semibold text-slate-900 mb-0.5">Artinya dalam bahasa sehari-hari:</div>
                        <p className="text-sm text-slate-700 leading-relaxed">{c.penjelasan_awam}</p>
                      </div>
                    )}

                    {/* 4. Usulan Revisi (Kotak bg-subtle + Tombol Salin) */}
                    {c.saran_revisi && (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-xs font-semibold text-slate-900">Usulan revisi</span>
                          <button
                            type="button"
                            onClick={() => onCopy(c.saran_revisi)}
                            className="text-xs font-medium text-accent hover:underline cursor-pointer"
                          >
                            Salin
                          </button>
                        </div>
                        <p className="text-sm text-slate-800 leading-relaxed italic">
                          "{c.saran_revisi}"
                        </p>
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pertanyaan Negosiasi: Bagian di Bawah Daftar */}
      {doc.recommended_questions && doc.recommended_questions.length > 0 && (
        <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 mb-8">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Pertanyaan negosiasi yang disarankan
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ajukan poin-poin ini kepada pihak kedua sebelum menyepakati kontrak.
            </p>
          </div>

          <div className="space-y-2">
            {doc.recommended_questions.map((q, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded p-3 flex items-start justify-between gap-3"
              >
                <div className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                  <span className="font-semibold text-slate-500 mr-2">{idx + 1}.</span>
                  {q}
                </div>
                <button
                  type="button"
                  onClick={() => onCopy(q)}
                  className="text-xs text-accent hover:underline font-medium shrink-0 cursor-pointer pt-0.5"
                >
                  Salin
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Action: Analisis Kontrak Lain */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onNewAnalysis}
          className="text-xs text-slate-500 hover:text-slate-900 underline cursor-pointer"
        >
          ← Analisis kontrak lain
        </button>
      </div>

    </div>
  );
}
