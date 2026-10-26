import React, { useState, useRef, useEffect } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

export default function TanyaView({ doc, onBackToDashboard, onHighlightClause }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Halo! Saya asisten CekKontrak. Tanyakan apa saja tentang naskah "${doc?.title || 'kontrak Anda'}". Saya hanya akan menjawab berdasarkan klausul yang ada dan selalu menyertakan nomor pasal rujukannya.`,
      cited_clauses: []
    }
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedCitationClause, setSelectedCitationClause] = useState(null);
  const [showClausePanel, setShowClausePanel] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (queryText) => {
    const text = queryText || input.trim();
    if (!text || isSending || !doc) return;

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInput('');
    setIsSending(true);

    try {
      const res = await fetch(`/api/documents/${doc.document_id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      if (!res.ok) throw new Error('Gagal memproses pertanyaan RAG.');
      const data = await res.json();

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          cited_clauses: data.cited_clauses || [],
          model_used: data.model_used || 'heuristic'
        }
      ]);

      if (data.cited_clauses && data.cited_clauses.length > 0) {
        const found = doc.clauses.find(c => c.nomor_pasal === data.cited_clauses[0]);
        if (found) {
          setSelectedCitationClause(found);
          setShowClausePanel(true);
        }
      }

    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Terjadi kendala: ${err.message}`,
          cited_clauses: []
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const quickPrompts = [
    'Berapa denda jika saya berhenti sewa lebih awal?',
    'Bagaimana ketentuan pengembalian uang deposit?',
    'Siapa yang menanggung biaya kerusakan fasilitas?',
    'Apakah ada ketentuan perpanjangan otomatis?'
  ];

  // Returns display config for model badge based on model_used string
  const getModelBadge = (modelUsed) => {
    if (!modelUsed || modelUsed === 'heuristic') {
      return {
        label: 'Heuristic',
        icon: '⚙️',
        className: 'bg-slate-100 text-slate-600 border border-slate-200',
      };
    }
    if (modelUsed.startsWith('gemini')) {
      const modelName = modelUsed.split('/')[1] || 'Gemini';
      // Shorten display name: gemini-2.5-flash → Gemini 2.5 Flash
      const display = modelName
        .replace('gemini-', 'Gemini ')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
      return {
        label: display,
        icon: '✦',
        className: 'bg-blue-50 text-blue-700 border border-blue-200',
      };
    }
    if (modelUsed.startsWith('groq')) {
      const modelName = modelUsed.split('/')[1] || '';
      // Shorten: llama-3.3-70b-versatile → Llama 3.3 70B
      const display = modelName
        .replace('llama-', 'Llama ')
        .replace(/-versatile|-instruct|-preview/gi, '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .trim();
      return {
        label: `${display} (Groq)`,
        icon: '⚡',
        className: 'bg-orange-50 text-orange-700 border border-orange-200',
      };
    }
    return {
      label: modelUsed,
      icon: '🤖',
      className: 'bg-slate-100 text-slate-600 border border-slate-200',
    };
  };

  return (
    <div className="flex flex-col w-full gap-4">
      {/* Top Header Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-teal-50 text-secondary shrink-0">
                <span className="material-symbols-outlined text-[20px]">smart_toy</span>
              </span>
              <h1 className="font-headline-md text-lg sm:text-2xl text-slate-900 font-extrabold">Tanya Kontrak AI</h1>
              <span className="font-label-sm text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 font-bold border border-teal-200/60">
                RAG Grounded
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 font-body-sm text-xs ml-10 sm:ml-0">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse shrink-0"></span>
              <span className="font-bold text-slate-800 truncate max-w-[180px] sm:max-w-none">{doc?.title}</span>
              <span className="text-slate-300">•</span>
              <span>{doc?.clauses ? doc.clauses.length : 0} Pasal</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedCitationClause && (
              <button
                type="button"
                onClick={() => setShowClausePanel(prev => !prev)}
                className="xl:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-label-md text-xs font-semibold transition-all border border-teal-200 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">menu_book</span>
                <span>Pasal {selectedCitationClause.nomor_pasal}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-label-md text-xs sm:text-sm font-semibold transition-all border border-slate-200 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">arrow_back</span>
              <span className="hidden sm:inline">Kembali ke Analisis</span>
              <span className="sm:hidden">Kembali</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">

        {/* Chat Column */}
        <div className="xl:col-span-8 flex flex-col bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden"
          style={{ height: 'calc(100vh - 18rem)', minHeight: '400px' }}>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
            <div className="flex items-center justify-center">
              <div className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-600 font-label-sm text-xs flex items-center gap-1.5 border border-slate-200/60">
                <span className="material-symbols-outlined text-[15px] text-secondary">verified</span>
                <span>Jawaban divalidasi langsung terhadap pasal kontrak</span>
              </div>
            </div>

            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'user' ? (
                  <div className="max-w-[85%] sm:max-w-xl bg-slate-900 text-white rounded-2xl rounded-br-sm p-3.5 sm:p-4 shadow-xs">
                    <p className="font-body-default text-sm leading-relaxed text-slate-100">
                      {m.content}
                    </p>
                  </div>
                ) : (
                  <div className="max-w-[90%] sm:max-w-xl bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl rounded-bl-sm p-3.5 sm:p-4 shadow-xs space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-200/60">
                      <div className="flex items-center gap-1.5 text-secondary font-label-md text-xs font-bold">
                        <span className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-white">
                          <span className="material-symbols-outlined text-[12px]">neurology</span>
                        </span>
                        <span>CekKontrak AI</span>
                      </div>

                      {/* Model Identity Badge */}
                      {(() => {
                        const badge = getModelBadge(m.model_used);
                        return (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-label-sm text-[11px] font-bold ${badge.className}`}>
                            <span className="text-[10px] leading-none">{badge.icon}</span>
                            <span>{badge.label}</span>
                          </span>
                        );
                      })()}

                      {/* Citation Pills */}
                      {m.cited_clauses && m.cited_clauses.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1">
                          {m.cited_clauses.map(num => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => {
                                const found = doc.clauses.find(c => c.nomor_pasal === num);
                                if (found) {
                                  setSelectedCitationClause(found);
                                  setShowClausePanel(true);
                                }
                              }}
                              className="inline-flex items-center gap-1 font-label-sm text-xs text-secondary hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-0.5 rounded-md font-bold transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[13px]">link</span>
                              <span>[Pasal {num}]</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <MarkdownRenderer
                      content={m.content}
                      className="font-body-default text-xs sm:text-sm text-slate-800"
                    />
                  </div>
                )}
              </div>
            ))}

            {isSending && (
              <div className="flex justify-start">
                <div className="max-w-xl bg-slate-50 border border-slate-200 text-slate-600 rounded-2xl rounded-bl-sm p-3.5 shadow-xs flex items-center gap-2 text-xs">
                  <span className="material-symbols-outlined animate-spin text-[18px] text-secondary">progress_activity</span>
                  <span>Membaca pasal terkait & menyusun jawaban grounded...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0">
            <span className="font-label-sm text-xs text-slate-500 font-semibold shrink-0">Contoh:</span>
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(prompt)}
                className="px-3 py-1.5 rounded-full bg-white hover:bg-slate-100 text-slate-700 font-label-sm text-xs shrink-0 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanyakan hal spesifik tentang isi kontrak..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-body-default text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 min-w-0"
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              className="w-10 h-10 rounded-xl bg-secondary hover:bg-on-secondary-fixed-variant text-white flex items-center justify-center transition-all disabled:opacity-40 shrink-0 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </form>
        </div>

        {/* Right Column: Source Clause Inspector (hidden on mobile unless toggled) */}
        <div className={`xl:col-span-4 flex flex-col bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 gap-4 overflow-hidden ${
          showClausePanel ? 'flex' : 'hidden xl:flex'
        }`}
          style={{ height: 'calc(100vh - 18rem)', minHeight: '400px' }}>

          <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
            <h3 className="font-title-sm text-sm text-slate-900 font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-[20px]">menu_book</span>
              Klausul yang Dirujuk
            </h3>
            <div className="flex items-center gap-2">
              {selectedCitationClause && (
                <span className="font-label-sm text-xs px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-bold border border-teal-200/60">
                  Pasal {selectedCitationClause.nomor_pasal}
                </span>
              )}
              {/* Close button on mobile */}
              <button
                type="button"
                onClick={() => setShowClausePanel(false)}
                className="xl:hidden w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>

          {selectedCitationClause ? (
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-0.5">
              <div className="space-y-1">
                <span className="font-label-md text-sm text-slate-900 font-bold block">
                  Pasal {selectedCitationClause.nomor_pasal} {selectedCitationClause.judul ? `— ${selectedCitationClause.judul}` : ''}
                </span>
                <span className={`inline-block px-2 py-0.5 rounded font-label-sm text-xs font-bold ${
                  selectedCitationClause.level === 'merah'
                    ? 'bg-rose-100 text-rose-800'
                    : selectedCitationClause.level === 'kuning'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                }`}>
                  Tingkat: {selectedCitationClause.level?.toUpperCase()}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 font-body-legal text-xs text-slate-700 italic border-l-4 border-secondary leading-relaxed">
                "{selectedCitationClause.isi}"
              </div>

              <div className="space-y-1">
                <span className="font-label-sm text-xs text-secondary font-bold uppercase tracking-wider block">Maksud Bahasa Awam:</span>
                <p className="font-body-sm text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                  {selectedCitationClause.penjelasan_awam}
                </p>
              </div>

              {selectedCitationClause.saran_revisi && (
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 space-y-1">
                  <span className="font-label-sm text-xs text-amber-900 font-bold block">Usulan Revisi Lebih Adil:</span>
                  <p className="font-body-sm text-xs text-slate-800 italic leading-relaxed">
                    "{selectedCitationClause.saran_revisi}"
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => onHighlightClause(selectedCitationClause.nomor_pasal)}
                className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                <span>Lihat di Dashboard Dokumen</span>
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <span className="material-symbols-outlined text-[44px] text-slate-300">find_in_page</span>
              <p className="font-body-sm text-xs text-slate-500 max-w-xs leading-relaxed">
                Saat Anda bertanya ke Chatbot, pasal yang dirujuk akan otomatis ditampilkan di sini untuk verifikasi naskah aslinya.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
