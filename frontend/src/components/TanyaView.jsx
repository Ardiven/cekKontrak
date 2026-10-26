import React, { useState, useRef, useEffect } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

export default function TanyaView({ doc, onBackToDashboard, onHighlightClause }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Halo. Kamu bisa menanyakan apa saja tentang naskah kontrak "${doc?.title || 'ini'}". Setiap jawaban akan merujuk langsung ke nomor pasal yang relevan.`,
      cited_clauses: [],
      model_used: null,
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedClause, setSelectedClause] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (queryText) => {
    const text = queryText || input.trim();
    if (!text || isSending || !doc) return;

    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');
    setIsSending(true);

    try {
      const res = await fetch(`/api/documents/${doc.document_id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) throw new Error('Gagal memproses pertanyaan.');
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          cited_clauses: data.cited_clauses || [],
          model_used: data.model_used || 'Heuristic',
        },
      ]);

      if (data.cited_clauses && data.cited_clauses.length > 0) {
        const found = doc.clauses.find((c) => c.nomor_pasal === data.cited_clauses[0]);
        if (found) {
          setSelectedClause(found);
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Terjadi kendala: ${err.message}`,
          cited_clauses: [],
          model_used: null,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectClauseNumber = (clauseNum) => {
    const found = doc?.clauses?.find((c) => c.nomor_pasal === clauseNum);
    if (found) {
      setSelectedClause(found);
    }
  };

  // Format model name cleanly: e.g. "gemini/gemini-2.5-flash" -> "Gemini 2.5 Flash"
  const formatModelName = (modelStr) => {
    if (!modelStr) return null;
    if (modelStr.includes('gemini')) return 'Gemini 2.5 Flash';
    if (modelStr.includes('groq') || modelStr.includes('llama')) return 'Llama 3.3 70B (Groq)';
    if (modelStr === 'heuristic') return 'Heuristic';
    return modelStr;
  };

  const sampleQuestions = [
    'Berapa dendanya?',
    'Bisa putus lebih awal?',
    'Ketentuan uang deposit?',
  ];

  const hasChatted = messages.length > 1;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 mb-6">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Tanya AI · <span className="font-normal text-slate-600">{doc.title}</span>
          </h1>
        </div>
        <button
          type="button"
          onClick={onBackToDashboard}
          className="h-8 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded text-xs font-medium transition-colors cursor-pointer"
        >
          ← Analisis
        </button>
      </div>

      {/* Main 2-Column Grid (lg) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Chat Stream (7 cols on lg, or 12 if no clause inspected) */}
        <div className={selectedClause ? 'lg:col-span-7 flex flex-col' : 'lg:col-span-12 max-w-2xl mx-auto w-full flex flex-col'}>
          
          {/* Messages Container */}
          <div
            aria-live="polite"
            className="space-y-4 mb-4 min-h-[360px] max-h-[56vh] overflow-y-auto pr-1 custom-scrollbar"
          >
            {messages.map((m, idx) => (
              <div key={idx} className="flex flex-col">
                {m.role === 'user' ? (
                  <div className="ml-auto max-w-[85%] sm:max-w-prose bg-slate-900 text-white rounded-xl px-4 py-2.5 text-sm">
                    {m.content}
                  </div>
                ) : (
                  <div className="mr-auto max-w-[95%] sm:max-w-prose bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-sm">
                    <MarkdownRenderer content={m.content} />

                    {/* Cited Clauses Chips */}
                    {m.cited_clauses && m.cited_clauses.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs text-slate-500">Rujukan:</span>
                        {m.cited_clauses.map((cNum) => (
                          <button
                            key={cNum}
                            type="button"
                            onClick={() => handleSelectClauseNumber(cNum)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-200 text-accent font-medium text-xs hover:bg-white transition-colors cursor-pointer"
                          >
                            <span>Pasal {cNum}</span>
                            <span className="material-symbols-outlined text-[13px]">visibility</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* AI Model Name: Small text-muted below reply */}
                    {m.model_used && (
                      <div className="text-[11px] text-slate-400 mt-2">
                        {formatModelName(m.model_used)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions (Visible before user's first query) */}
          {!hasChatted && (
            <div className="text-xs text-slate-500 mb-3 flex items-center gap-1.5 flex-wrap">
              <span>Contoh:</span>
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(q)}
                  className="text-accent hover:underline cursor-pointer"
                >
                  {q}
                  {idx < sampleQuestions.length - 1 && <span className="text-slate-300 ml-1.5">·</span>}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 pt-2 border-t border-slate-200"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanyakan sesuatu tentang kontrak ini…"
              disabled={isSending}
              className="flex-1 h-10 px-3 rounded border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              className="h-10 px-4 bg-accent hover:bg-accent-hover text-white rounded text-sm font-medium transition-colors cursor-pointer disabled:opacity-40 shrink-0"
            >
              {isSending ? 'Kirim…' : 'Kirim'}
            </button>
          </form>

        </div>

        {/* Right Column: Panel Rujukan (5 cols on lg) */}
        {selectedClause && (
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 mt-4 lg:mt-0">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <div className="text-xs font-semibold text-slate-900">
                Rujukan: Pasal {selectedClause.nomor_pasal} {selectedClause.judul ? `· ${selectedClause.judul}` : ''}
              </div>
              <button
                type="button"
                onClick={() => setSelectedClause(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
                aria-label="Tutup panel"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <span className="text-xs text-slate-500 block mb-1">Teks pasal:</span>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-800 text-[13px] leading-[22px] max-h-48 overflow-y-auto">
                  {selectedClause.isi}
                </div>
              </div>

              {selectedClause.penjelasan_awam && (
                <div>
                  <span className="text-xs font-semibold text-slate-900 block mb-0.5">Maksud bahasa awam:</span>
                  <p className="text-slate-700 text-xs leading-relaxed">{selectedClause.penjelasan_awam}</p>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onHighlightClause(selectedClause.nomor_pasal)}
                  className="text-accent text-xs font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Buka di halaman Analisis</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
