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
      class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        class="bg-surface-container-lowest rounded-2xl max-w-xl w-full max-h-[80vh] flex flex-col p-space-lg shadow-xl border border-outline-variant/30 animate-fadeIn"
      >
        <div class="flex items-center justify-between pb-space-sm border-b border-outline-variant/30">
          <div>
            <h3 class="font-headline-md text-headline-md text-on-surface font-bold">Riwayat Dokumen Teranalisis</h3>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Tersimpan dalam cache hash untuk akses cepat tanpa biaya API</p>
          </div>
          <button onClick={onClose} class="text-on-surface-variant hover:text-on-surface p-1">
            <span class="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto py-space-md space-y-2 custom-scrollbar">
          {loading ? (
            <div class="text-center py-8 text-on-surface-variant">
              <span class="material-symbols-outlined animate-spin text-[28px]">progress_activity</span>
              <p class="text-sm mt-2">Memuat riwayat...</p>
            </div>
          ) : docs.length === 0 ? (
            <p class="text-center py-8 text-on-surface-variant text-sm">Belum ada riwayat dokumen yang dianalisis.</p>
          ) : (
            docs.map((d) => (
              <div
                key={d.document_id}
                onClick={() => onSelectDoc(d.document_id)}
                class="p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors flex items-center justify-between gap-space-md cursor-pointer border border-outline-variant/20"
              >
                <div class="min-w-0">
                  <h4 class="font-title-sm text-title-sm text-on-surface font-semibold truncate">{d.title}</h4>
                  <div class="flex items-center gap-space-xs font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                    <span class="font-semibold text-secondary">Skor: {d.overall_score}/100</span>
                    <span>•</span>
                    <span>{d.created_at?.substring(0, 10)}</span>
                    <span>•</span>
                    <span>{d.total_clauses} Pasal</span>
                  </div>
                </div>

                <div class="flex items-center gap-space-xs shrink-0">
                  <button
                    onClick={() => onSelectDoc(d.document_id)}
                    class="px-3 py-1.5 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md shadow-sm"
                  >
                    Buka
                  </button>
                  <button
                    onClick={(e) => handleDelete(d.document_id, e)}
                    class="p-1.5 text-error hover:bg-error-container/40 rounded-lg transition-colors"
                  >
                    <span class="material-symbols-outlined text-[20px]">delete</span>
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
