import React, { useEffect, useState } from 'react';

export default function HistoryModal({ isOpen, onClose, onSelectDoc }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 transition-all"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-xl w-full max-h-[82vh] flex flex-col p-6 shadow-2xl border border-slate-200 animate-fadeIn"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-headline-md text-lg sm:text-xl text-slate-900 font-extrabold">Riwayat Dokumen Teranalisis</h3>
            <p className="font-body-sm text-xs text-slate-500">Tersimpan dalam cache hash lokal untuk akses cepat tanpa biaya API</p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-2.5 custom-scrollbar">
          {loading ? (
            <div className="text-center py-10 text-slate-500">
              <span className="material-symbols-outlined animate-spin text-[28px] text-secondary">progress_activity</span>
              <p className="text-xs mt-2">Memuat riwayat dokumen...</p>
            </div>
          ) : docs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <span className="material-symbols-outlined text-[40px] text-slate-300">folder_open</span>
              <p className="text-xs text-slate-500">Belum ada riwayat dokumen yang tersimpan.</p>
            </div>
          ) : (
            docs.map((d) => (
              <div
                key={d.document_id}
                onClick={() => onSelectDoc(d.document_id)}
                className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-all flex items-center justify-between gap-3 cursor-pointer border border-slate-200/80 shadow-2xs"
              >
                <div className="min-w-0">
                  <h4 className="font-title-sm text-sm text-slate-900 font-bold truncate">{d.title}</h4>
                  <div className="flex items-center gap-2 font-label-sm text-xs text-slate-500 mt-0.5">
                    <span className="font-semibold text-secondary">Skor: {d.overall_score}/100</span>
                    <span className="text-slate-300">•</span>
                    <span>{d.created_at?.substring(0, 10)}</span>
                    <span className="text-slate-300">•</span>
                    <span>{d.total_clauses} Pasal</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectDoc(d.document_id)}
                    className="px-3.5 py-1.5 rounded-lg bg-secondary text-white font-label-md text-xs font-semibold shadow-xs hover:bg-teal-700 transition-colors cursor-pointer"
                  >
                    Buka
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(d.document_id, e)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[19px]">delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
