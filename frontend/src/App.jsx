import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DisclaimerBanner from './components/DisclaimerBanner';
import BerandaView from './components/BerandaView';
import UnggahView from './components/UnggahView';
import DashboardView from './components/DashboardView';
import TanyaView from './components/TanyaView';
import HistoryModal from './components/HistoryModal';
import Toast from './components/Toast';

export default function App() {
  const [view, setView] = useState('beranda'); // 'beranda', 'unggah', 'dashboard', 'tanya'
  const [currentDoc, setCurrentDoc] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [sampleContracts, setSampleContracts] = useState({});

  useEffect(() => {
    fetch('/api/samples')
      .then(res => res.json())
      .then(data => setSampleContracts(data))
      .catch(err => console.warn('Could not load samples:', err));
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Teks berhasil disalin ke clipboard! ✓');
    }).catch(() => {
      prompt('Salin teks berikut:', text);
    });
  };

  const handleLoadSample = (key) => {
    const sample = sampleContracts[key];
    if (!sample) return;
    setView('unggah');
    // Pre-analyze directly or populate form
    handleAnalyze({
      type: 'text',
      text: sample.text,
      title: sample.title,
      contractType: sample.contract_type
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
          body: formData
        });
      } else {
        const payload = {
          text: text,
          title: title || 'Kontrak Input Teks',
          contract_type: contractType || 'lainnya'
        };

        res = await fetch('/api/analyze/json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Gagal memproses analisis kontrak.');
      }

      const docData = await res.json();
      setCurrentDoc(docData);
      setView('dashboard');

      if (docData.from_cache) {
        showToast('Hasil langsung dimuat dari Cache Hash! ⚡');
      } else {
        showToast('Analisis kontrak selesai berhasil!');
      }

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
      setIsHistoryOpen(false);
      setView('dashboard');
      showToast(`Dokumen "${docData.title}" berhasil dibuka.`);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHighlightClause = (clauseNum) => {
    setView('dashboard');
    setTimeout(() => {
      const el = document.getElementById(`clause-card-${clauseNum}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-4', 'ring-secondary', 'scale-[1.01]');
        setTimeout(() => {
          el.classList.remove('ring-4', 'ring-secondary', 'scale-[1.01]');
        }, 3000);
      }
    }, 150);
  };

  return (
    <div class="min-h-screen bg-surface flex flex-col font-body-default text-on-surface">
      
      {/* Top Navbar */}
      <Navbar
        currentView={view}
        setView={setView}
        onOpenHistory={() => setIsHistoryOpen(true)}
        hasDocument={!!currentDoc}
      />

      {/* Main Container */}
      <main class="flex-1 w-full pt-20 pb-16">
        <div class="max-w-7xl mx-auto px-gutter lg:px-margin">
          <DisclaimerBanner />

          {view === 'beranda' && (
            <BerandaView
              onStartUpload={() => setView('unggah')}
              onLoadSample={handleLoadSample}
            />
          )}

          {view === 'unggah' && (
            <UnggahView
              onAnalyze={handleAnalyze}
              isLoading={isLoading}
              onLoadSample={(key) => {
                const sample = sampleContracts[key];
                if (sample) {
                  handleAnalyze({
                    type: 'text',
                    text: sample.text,
                    title: sample.title,
                    contractType: sample.contract_type
                  });
                }
              }}
            />
          )}

          {view === 'dashboard' && currentDoc && (
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
              onBackToDashboard={() => setView('dashboard')}
              onHighlightClause={handleHighlightClause}
            />
          )}
        </div>
      </main>

      {/* History Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectDoc={handleSelectHistoryDoc}
      />

      {/* Toast Feedback */}
      <Toast message={toast} />

    </div>
  );
}
