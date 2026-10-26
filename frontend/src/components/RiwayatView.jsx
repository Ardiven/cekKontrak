import React, { useEffect, useState } from 'react';

export default function RiwayatView({ onSelectDoc, onGoToUpload }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (docId, e) => {
    e.stopPropagation();
    if (!confirm('Hapus dokumen ini dari riwayat?')) return;
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchHistory();
      }
    } catch (err) {
      alert('Gagal menghapus dokumen.');
    }
  };

  const getRiskColor = (score) => {
    if (score >= 60) return { dot: 'bg-rose-500', text: 'text-rose-700', label: 'Berisiko' };
    if (score >= 35) return { dot: 'bg-amber-500', text: 'text-amber-700', label: 'Perlu teliti' };
    return { dot: 'bg-emerald-500', text: 'text-emerald-700', label: 'Aman' };
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Riwayat Dokumen</h1>
        <p className="text-sm text-slate-500 mt-1">Daftar kontrak yang pernah dianalisis pada perangkat ini.</p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500 text-sm">
          <span className="material-symbols-outlined animate-spin text-[24px] text-accent mb-2">progress_activity</span>
          <p>Memuat riwayat...</p>
        </div>
      ) : docs.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-200 rounded-xl p-8">
          <p className="text-sm text-slate-500 mb-4">Belum ada riwayat dokumen yang tersimpan.</p>
          <button
            type="button"
            onClick={onGoToUpload}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded text-sm font-medium transition-colors cursor-pointer"
          >
            Unggah kontrak
          </button>
        </div>
      ) : (
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {docs.map((d) => {
            const risk = getRiskColor(d.overall_score || 0);
            return (
              <div
                key={d.document_id}
                onClick={() => onSelectDoc(d.document_id)}
                className="py-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer group px-2 rounded"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${risk.dot} shrink-0`} />
                    <span className={`text-xs font-medium ${risk.text}`}>{risk.label} ({d.overall_score}/100)</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-500 capitalize">{d.contract_type?.replace('_', ' ') || 'Perjanjian'}</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 group-hover:text-accent transition-colors truncate">
                    {d.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {d.created_at?.substring(0, 10)} · {d.total_clauses} pasal
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-medium text-accent hover:underline hidden sm:inline">
                    Buka hasil →
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(d.document_id, e)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    title="Hapus dari riwayat"
                    aria-label="Hapus"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
