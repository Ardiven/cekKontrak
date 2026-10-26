import React, { useState } from 'react';

export default function DashboardView({ doc, onOpenChat, onNewAnalysis, onCopy }) {
  const [filter, setFilter] = useState('all'); // 'all', 'merah', 'kuning', 'hijau', 'questions'

  if (!doc) return null;

  const filteredClauses = (doc.clauses || []).filter(c => {
    if (filter === 'all') return true;
    return c.level === filter;
  });

  const isRedScore = doc.overall_score >= 60;
  const isYellowScore = doc.overall_score >= 35 && doc.overall_score < 60;

  return (
    <div class="p-space-lg max-w-[1560px] mx-auto w-full space-y-space-lg">
      
      {/* Top Document Meta Header */}
      <div class="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-space-md">
        <div class="space-y-space-xs">
          <div class="flex flex-wrap items-center gap-space-xs font-label-sm text-label-sm text-on-surface-variant">
            <span class="px-space-xs py-0.5 rounded-full bg-secondary-container/50 text-on-secondary-container font-semibold uppercase tracking-wider">
              {doc.contract_type || 'Perjanjian'}
            </span>
            <span class="text-outline-variant">•</span>
            <span>Dianalisis: {doc.created_at ? doc.created_at.substring(0, 10) : 'Hari ini'}</span>
            <span class="text-outline-variant">•</span>
            <span class="flex items-center gap-0.5">
              <span class="material-symbols-outlined text-[15px]">auto_stories</span>
              {doc.clauses ? doc.clauses.length : 0} Pasal Terdeteksi
            </span>
            {doc.from_cache && (
              <>
                <span class="text-outline-variant">•</span>
                <span class="text-secondary font-semibold">Dilayani dari Cache Hash ⚡</span>
              </>
            )}
          </div>
          <div class="flex items-center gap-space-sm">
            <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
              {doc.title}
            </h1>
          </div>
        </div>

        {/* Action Group */}
        <div class="flex flex-wrap items-center gap-space-xs">
          <button
            type="button"
            onClick={() => window.open(`/api/documents/${doc.document_id}/export`, '_blank')}
            class="inline-flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors"
          >
            <span class="material-symbols-outlined text-[18px]">download</span>
            <span>Ekspor Ringkasan (PDF)</span>
          </button>

          <button
            type="button"
            onClick={onOpenChat}
            class="inline-flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-primary-container text-on-primary-fixed hover:bg-inverse-surface font-label-md text-label-md transition-colors shadow-sm"
          >
            <span class="material-symbols-outlined text-[18px] text-secondary-container">forum</span>
            <span>Tanya AI Kontrak</span>
          </button>

          <button
            type="button"
            onClick={onNewAnalysis}
            class="inline-flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors"
          >
            <span class="material-symbols-outlined text-[18px]">add</span>
            <span>Analisis Kontrak Lain</span>
          </button>
        </div>
      </div>

      {/* Overall Risk Assessment Banner (Bento Metric Layout) */}
      <div class="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-stretch">
          
          {/* Score & Status Indicator */}
          <div class="lg:col-span-4 bg-surface-container-low rounded-xl p-space-lg flex flex-col justify-between relative overflow-hidden">
            <div class="flex items-start justify-between">
              <div class="space-y-1">
                <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Tingkat Risiko Kontrak</span>
                <p class="font-body-sm text-body-sm text-on-surface-variant">Hasil evaluasi kewajaran perdata</p>
              </div>
              <span class={`inline-flex items-center gap-1 px-space-sm py-1 rounded-full font-label-md text-label-md font-bold ${
                isRedScore ? 'bg-error-container text-on-error-container' : isYellowScore ? 'bg-[#FFFBEB] text-[#92400E]' : 'bg-[#ECFDF5] text-[#065F46]'
              }`}>
                <span class="material-symbols-outlined text-[14px]">report_problem</span>
                <span>{doc.risk_level?.toUpperCase()}</span>
              </span>
            </div>

            <div class="my-space-md flex items-baseline gap-space-xs">
              <span class="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">{doc.overall_score}</span>
              <span class="font-headline-md text-headline-md text-on-surface-variant">/ 100</span>
              <span class={`ml-space-sm font-label-sm text-label-sm px-space-xs py-0.5 rounded font-semibold ${
                isRedScore ? 'text-error bg-error-container/40' : isYellowScore ? 'text-[#D97706] bg-[#FFFBEB]' : 'text-secondary bg-[#ECFDF5]'
              }`}>
                {isRedScore ? 'Rentan Sengketa' : isYellowScore ? 'Perlu Teliti' : 'Klausul Standar'}
              </span>
            </div>

            {/* Gauge Indicator */}
            <div class="space-y-space-xs">
              <div class="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden flex">
                <div class="bg-error h-full" style={{ width: `${Math.min(doc.counts.merah * 25, 45)}%` }}></div>
                <div class="bg-[#d97706] h-full" style={{ width: `${Math.min(doc.counts.kuning * 15, 35)}%` }}></div>
                <div class="bg-secondary h-full" style={{ width: '35%' }}></div>
              </div>
              <div class="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                <span>0 (Kritis)</span>
                <span>Toleransi</span>
                <span>100 (Aman)</span>
              </div>
            </div>
          </div>

          {/* Plain Language Executive Summary */}
          <div class="lg:col-span-8 flex flex-col justify-between space-y-space-md">
            <div class="space-y-space-xs">
              <div class="flex items-center gap-space-xs text-secondary font-label-md text-label-md font-semibold">
                <span class="material-symbols-outlined text-[18px]">psychology</span>
                <span>Kesimpulan Awam dari AI CekKontrak:</span>
              </div>
              <p class="font-body-legal text-body-legal text-on-surface leading-relaxed">
                {doc.summary}
              </p>
            </div>

            {/* 3 Metric Cards */}
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-space-md pt-space-xs">
              
              {/* Card 1: Red */}
              <div class="bg-[#FFF1F2] rounded-xl p-space-md flex items-center justify-between shadow-sm">
                <div class="space-y-0.5">
                  <span class="font-label-sm text-label-sm text-[#9F1239] font-bold">Risiko Tinggi</span>
                  <p class="font-headline-md text-headline-md text-[#9F1239] font-bold">{doc.counts.merah || 0} Pasal</p>
                  <span class="font-label-sm text-label-sm text-[#9F1239]/80">Perlu Negosiasi</span>
                </div>
                <div class="w-10 h-10 rounded-full bg-[#FECDD3] flex items-center justify-center text-[#9F1239]">
                  <span class="material-symbols-outlined text-[22px]">warning</span>
                </div>
              </div>

              {/* Card 2: Yellow */}
              <div class="bg-[#FFFBEB] rounded-xl p-space-md flex items-center justify-between shadow-sm">
                <div class="space-y-0.5">
                  <span class="font-label-sm text-label-sm text-[#92400E] font-bold">Perlu Diperhatikan</span>
                  <p class="font-headline-md text-headline-md text-[#92400E] font-bold">{doc.counts.kuning || 0} Pasal</p>
                  <span class="font-label-sm text-label-sm text-[#92400E]/80">Minta Klarifikasi</span>
                </div>
                <div class="w-10 h-10 rounded-full bg-[#FDE68A] flex items-center justify-center text-[#92400E]">
                  <span class="material-symbols-outlined text-[22px]">info</span>
                </div>
              </div>

              {/* Card 3: Green */}
              <div class="bg-[#ECFDF5] rounded-xl p-space-md flex items-center justify-between shadow-sm">
                <div class="space-y-0.5">
                  <span class="font-label-sm text-label-sm text-[#065F46] font-bold">Aman & Standar</span>
                  <p class="font-headline-md text-headline-md text-[#065F46] font-bold">{doc.counts.hijau || 0} Pasal</p>
                  <span class="font-label-sm text-label-sm text-[#065F46]/80">Hak Wajar</span>
                </div>
                <div class="w-10 h-10 rounded-full bg-[#A7F3D0] flex items-center justify-center text-[#065F46]">
                  <span class="material-symbols-outlined text-[22px]">check_circle</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div class="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs">
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            class={`px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-all ${
              filter === 'all' ? 'bg-secondary text-on-secondary shadow-sm' : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Semua Pasal ({doc.clauses ? doc.clauses.length : 0})
          </button>

          <button
            type="button"
            onClick={() => setFilter('merah')}
            class={`px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-all flex items-center gap-1 ${
              filter === 'merah' ? 'bg-error text-white shadow-sm' : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span>🔴</span> Berisiko ({doc.counts.merah || 0})
          </button>

          <button
            type="button"
            onClick={() => setFilter('kuning')}
            class={`px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-all flex items-center gap-1 ${
              filter === 'kuning' ? 'bg-[#D97706] text-white shadow-sm' : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span>🟡</span> Perlu Teliti ({doc.counts.kuning || 0})
          </button>

          <button
            type="button"
            onClick={() => setFilter('hijau')}
            class={`px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-all flex items-center gap-1 ${
              filter === 'hijau' ? 'bg-secondary text-white shadow-sm' : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span>🟢</span> Aman ({doc.counts.hijau || 0})
          </button>

          <button
            type="button"
            onClick={() => setFilter('questions')}
            class={`px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-all flex items-center gap-1 ${
              filter === 'questions' ? 'bg-primary-container text-on-primary-fixed shadow-sm' : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span class="material-symbols-outlined text-[16px]">quiz</span>
            <span>Bekal Pertanyaan ({doc.questions ? doc.questions.length : 0})</span>
          </button>
        </div>

        <span class="font-label-sm text-label-sm text-on-surface-variant">
          Menampilkan {filter === 'questions' ? doc.questions.length : filteredClauses.length} item
        </span>
      </div>

      {/* Main Content: Clauses List or Questions List */}
      {filter === 'questions' ? (
        <div class="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-space-md">
          <div class="space-y-1">
            <h3 class="font-title-sm text-title-sm text-on-surface font-bold">Daftar Pertanyaan Sebelum Tanda Tangan</h3>
            <p class="font-body-sm text-body-sm text-on-surface-variant">
              Ajukan poin-poin pertanyaan kritis ini kepada pemilik kos, pihak HR, atau pengelola sebelum menandatangani kesepakatan:
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-space-md pt-space-xs">
            {doc.questions && doc.questions.map((q, idx) => (
              <div key={q.id || idx} class="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-space-xs shadow-sm">
                <div class="flex items-center justify-between">
                  <span class="px-2 py-0.5 rounded font-label-sm text-label-sm bg-secondary-container/50 text-on-secondary-container font-semibold">
                    Pertanyaan {idx + 1} {q.nomor_pasal ? `• Pasal ${q.nomor_pasal}` : ''}
                  </span>
                  <button
                    onClick={() => onCopy(q.pertanyaan)}
                    class="text-secondary hover:text-on-secondary-fixed-variant font-label-sm text-label-sm flex items-center gap-1"
                  >
                    <span class="material-symbols-outlined text-[15px]">content_copy</span>
                    <span>Salin</span>
                  </button>
                </div>
                <p class="font-title-sm text-title-sm text-on-surface font-semibold">{q.pertanyaan}</p>
                <p class="font-body-sm text-body-sm text-on-surface-variant">
                  <strong>Tujuan:</strong> {q.tujuan}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Clauses List */
        <div class="space-y-space-md">
          {filteredClauses.map((c) => {
            const isRed = c.level === 'merah';
            const isYellow = c.level === 'kuning';

            const borderRibbon = isRed ? 'border-l-4 border-error' : isYellow ? 'border-l-4 border-[#d97706]' : 'border-l-4 border-secondary';

            return (
              <div
                key={c.nomor_pasal}
                id={`clause-card-${c.nomor_pasal}`}
                class={`bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-space-md ${borderRibbon} transition-all duration-300`}
              >
                <div class="flex flex-wrap items-center justify-between gap-space-xs">
                  <div class="flex items-center gap-space-sm">
                    <span class="font-headline-md text-headline-md text-on-surface font-bold">Pasal {c.nomor_pasal}</span>
                    {c.judul && <span class="font-title-sm text-title-sm text-on-surface-variant font-medium">• {c.judul}</span>}
                    <span class={`px-2 py-0.5 rounded font-label-sm text-label-sm font-semibold ${
                      isRed ? 'bg-error-container text-on-error-container' : isYellow ? 'bg-[#FFFBEB] text-[#92400E]' : 'bg-[#ECFDF5] text-[#065F46]'
                    }`}>
                      {isRed ? 'Risiko Tinggi' : isYellow ? 'Perlu Teliti' : 'Aman & Wajar'}
                    </span>
                  </div>

                  <span class={`font-label-sm text-label-sm font-bold flex items-center gap-1 ${
                    isRed ? 'text-error' : isYellow ? 'text-[#d97706]' : 'text-secondary'
                  }`}>
                    <span class="material-symbols-outlined text-[16px]">
                      {isRed ? 'warning' : isYellow ? 'info' : 'check_circle'}
                    </span>
                    {isRed ? 'RISIKO MERUGIKAN' : isYellow ? 'PERLU KLARIFIKASI' : 'KETENTUAN STANDAR'}
                  </span>
                </div>

                {/* Source Original Text */}
                <div class="p-space-md rounded-lg bg-surface-container-low font-body-legal text-body-legal text-on-surface-variant italic">
                  "{c.isi}"
                </div>

                {/* 2-Column Explanation: Alasan & Maksud Awam */}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-space-md pt-space-xs">
                  <div class="p-space-md rounded-lg bg-surface-container-low/60 space-y-space-xs">
                    <div class="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm font-semibold uppercase">
                      <span class="material-symbols-outlined text-[16px] text-secondary">visibility</span>
                      <span>Alasan Penilaian Risiko:</span>
                    </div>
                    <p class="font-body-default text-body-default text-on-surface leading-relaxed">{c.alasan}</p>
                  </div>

                  <div class="p-space-md rounded-lg bg-surface-container-low/60 space-y-space-xs">
                    <div class="flex items-center gap-space-xs text-secondary font-label-sm text-label-sm font-semibold uppercase">
                      <span class="material-symbols-outlined text-[16px]">translate</span>
                      <span>Maksud Bahasa Awam:</span>
                    </div>
                    <p class="font-body-default text-body-default text-on-surface leading-relaxed">{c.penjelasan_awam}</p>
                  </div>
                </div>

                {/* Fair Revision Suggestion (If available) */}
                {c.saran_revisi && (
                  <div class="p-space-md rounded-lg bg-secondary-container/20 border border-secondary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
                    <div class="space-y-1">
                      <span class="font-label-md text-label-md text-on-secondary-container font-semibold flex items-center gap-1">
                        <span class="material-symbols-outlined text-[16px]">tips_and_updates</span>
                        Usulan Draf Pengganti yang Lebih Adil:
                      </span>
                      <p class="font-body-sm text-body-sm text-on-surface italic">"{c.saran_revisi}"</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onCopy(c.saran_revisi)}
                      class="px-space-md py-space-xs rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-label-md flex items-center gap-1 shrink-0 self-start sm:self-center shadow-sm"
                    >
                      <span class="material-symbols-outlined text-[16px]">content_copy</span>
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
