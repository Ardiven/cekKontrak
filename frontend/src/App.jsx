import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import UnggahView from './components/UnggahView';
import DashboardView from './components/DashboardView';
import TanyaView from './components/TanyaView';
import RiwayatView from './components/RiwayatView';
import Toast from './components/Toast';

export default function App() {
  const [view, setView] = useState('unggah'); // 'unggah', 'analisis', 'tanya', 'riwayat'
  const [currentDoc, setCurrentDoc] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [sampleContracts, setSampleContracts] = useState({});

  useEffect(() => {
    fetch('/api/samples')
      .then((res) => res.json())
      .then((data) => setSampleContracts(data))
      .catch((err) => console.warn('Could not load samples:', err));
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleCopy = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showToast('Disalin');
      })
      .catch(() => {
        prompt('Salin teks berikut:', text);
      });
  };

  const handleLoadSample = (key) => {
    const sample = sampleContracts[key];
    if (!sample) return;
    handleAnalyze({
      type: 'text',
      text: sample.text,
      title: sample.title,
      contractType: sample.contract_type,
    });
  };

  const handleAnalyze = async ({ type, file, text, title, contractType }) => {
    setIsLoading(true);
    try {
      let res;
      if (type === 'pdf') {
        const formData = new FormData();
        formData.append('file', file);
        if (title) formData.append('title', title);
        if (contractType) formData.append('contract_type', contractType);

        res = await fetch('/api/analyze', {
          method: 'POST',
          body: formData,
        });
      } else {
        const payload = {
          text: text,
          title: title || 'Kontrak Input Teks',
          contract_type: contractType || 'lainnya',
        };

        res = await fetch('/api/analyze/json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Gagal memproses analisis kontrak.');
      }

      const docData = await res.json();
      setCurrentDoc(docData);
      setView('analisis');
    } catch (error) {
      alert(`Terjadi kesalahan: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistoryDoc = async (docId) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/documents/${docId}`);
      if (!res.ok) throw new Error('Gagal mengambil dokumen riwayat.');
      const docData = await res.json();
      setCurrentDoc(docData);
      setView('analisis');
    } catch (err) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHighlightClause = (clauseNum) => {
    setView('analisis');
    setTimeout(() => {
      const el = document.getElementById(`clause-card-${clauseNum}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  // Safe navigation handler
  const handleSetView = (newView) => {
    if ((newView === 'analisis' || newView === 'tanya') && !currentDoc) {
      setView('unggah');
      return;
    }
    setView(newView);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900">
      
      {/* Top Fixed Navbar (56px) */}
      <Navbar currentView={view} setView={handleSetView} />

      {/* Main Page Content (with top padding for fixed navbar) */}
      <main className="flex-1 w-full pt-14">
        {view === 'unggah' && (
          <UnggahView
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
            onLoadSample={handleLoadSample}
          />
        )}

        {view === 'analisis' && currentDoc && (
          <DashboardView
            doc={currentDoc}
            onOpenChat={() => setView('tanya')}
            onNewAnalysis={() => setView('unggah')}
            onCopy={handleCopy}
          />
        )}

        {view === 'tanya' && currentDoc && (
          <TanyaView
            doc={currentDoc}
            onBackToDashboard={() => setView('analisis')}
            onHighlightClause={handleHighlightClause}
          />
        )}

        {view === 'riwayat' && (
          <RiwayatView
            onSelectDoc={handleSelectHistoryDoc}
            onGoToUpload={() => setView('unggah')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 mt-auto text-center text-xs text-slate-500">
        CekKontrak membantu memahami kontrak, bukan pengganti nasihat hukum.
      </footer>

      {/* Minimal Toast Notification */}
      <Toast message={toast} />

    </div>
  );
}
