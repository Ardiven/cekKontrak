import React, { useState, useRef, useEffect } from 'react';

export default function TanyaView({ doc, onBackToDashboard, onHighlightClause }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Halo! Saya asisten CekKontrak. Tanyakan apa saja tentang naskah "${doc?.title || 'kontrak Anda'}". Saya hanya akan menjawab berdasarkan klausul yang ada dan selalu menyebutkan nomor pasalnya.`,
      cited_clauses: []
    }
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedCitationClause, setSelectedCitationClause] = useState(null);
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

      if (!res.ok) throw new Error('Gagal menghubungi layanan RAG Chatbot.');
      const data = await res.json();

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          cited_clauses: data.cited_clauses || []
        }
      ]);

      if (data.cited_clauses && data.cited_clauses.length > 0) {
        const found = doc.clauses.find(c => c.nomor_pasal === data.cited_clauses[0]);
        if (found) setSelectedCitationClause(found);
      }

    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Maaf, terjadi kendala: ${err.message}`,
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

  return (
    <div class="flex flex-col w-full">
      {/* Top Header Bar */}
      <div class="px-space-lg py-space-md bg-surface-container-lowest shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div class="flex flex-col gap-space-xs">
          <div class="flex items-center gap-space-xs">
            <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/10 text-secondary">
              <span class="material-symbols-outlined text-[20px]">smart_toy</span>
            </span>
            <h1 class="font-headline-md text-headline-md text-on-surface font-bold">Tanya Kontrak AI (RAG)</h1>
            <span class="font-label-sm text-label-sm px-space-xs py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container font-semibold">
              Grounded Strict
            </span>
          </div>
          <div class="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
            <span class="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span>Menganalisis:</span>
            <span class="font-medium text-on-surface">{doc?.title}</span>
            <span class="text-outline-variant">•</span>
            <span>{doc?.clauses ? doc.clauses.length : 0} Pasal Terindeks</span>
          </div>
        </div>

        <div class="flex items-center gap-space-sm self-start md:self-auto">
          <button
            type="button"
            onClick={onBackToDashboard}
            class="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors font-label-md text-label-md shadow-sm"
          >
            <span class="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Kembali ke Analisis Klausul</span>
          </button>
        </div>
      </div>

      {/* Main Chat Layout: Chat Area Left, Source Clause Right */}
      <div class="p-space-lg grid grid-cols-1 xl:grid-cols-12 gap-space-lg">
        
        {/* Left Column: Chat Messages Stream & Input */}
        <div class="xl:col-span-8 flex flex-col h-[calc(100vh-14rem)] bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
          
          {/* Messages Stream */}
          <div class="flex-1 overflow-y-auto p-space-lg space-y-space-md custom-scrollbar">
            <div class="flex items-center justify-center">
              <div class="px-space-md py-space-xs rounded-full bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm flex items-center gap-space-xs">
                <span class="material-symbols-outlined text-[16px] text-secondary">verified</span>
                <span>Jawaban divalidasi langsung terhadap isi naskah kontrak</span>
              </div>
            </div>

            {messages.map((m, idx) => (
              <div key={idx} class={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'user' ? (
                  <div class="max-w-2xl bg-on-background text-inverse-on-surface rounded-2xl rounded-br-sm p-space-md shadow-sm">
                    <p class="font-body-default text-body-default leading-relaxed text-inverse-on-surface">
                      {m.content}
                    </p>
                  </div>
                ) : (
                  <div class="max-w-2xl bg-surface-container-low text-on-surface rounded-2xl rounded-bl-sm p-space-md shadow-sm space-y-space-sm">
                    <div class="flex items-center justify-between gap-space-md">
                      <div class="flex items-center gap-space-xs text-secondary font-label-md text-label-md font-semibold">
                        <span class="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-on-secondary">
                          <span class="material-symbols-outlined text-[13px]">neurology</span>
                        </span>
                        <span>CekKontrak Assistant</span>
                      </div>

                      {/* Citation Pills */}
                      {m.cited_clauses && m.cited_clauses.length > 0 && (
                        <div class="flex items-center gap-1">
                          {m.cited_clauses.map(num => (
                            <button
                              key={num}
                              onClick={() => {
                                const found = doc.clauses.find(c => c.nomor_pasal === num);
                                if (found) setSelectedCitationClause(found);
                                onHighlightClause(num);
                              }}
                              class="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary hover:text-on-secondary-fixed-variant transition-colors bg-secondary-container/30 px-2 py-0.5 rounded font-semibold"
                            >
                              <span class="material-symbols-outlined text-[13px]">link</span>
                              <span class="underline underline-offset-2">[Pasal {num}]</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div class="font-body-default text-body-default leading-relaxed text-on-surface whitespace-pre-wrap">
                      {m.content}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isSending && (
              <div class="flex justify-start">
                <div class="max-w-2xl bg-surface-container-low text-on-surface-variant rounded-2xl rounded-bl-sm p-space-md shadow-sm flex items-center gap-space-xs">
                  <span class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  <span>Mencari pasal relevan & menyusun jawaban grounded...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div class="px-space-md py-2 bg-surface-container-low/70 border-t border-outline-variant/30 flex items-center gap-2 overflow-x-auto custom-scrollbar">
            <span class="font-label-sm text-label-sm text-on-surface-variant shrink-0">Contoh Cepat:</span>
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(prompt)}
                class="px-3 py-1 rounded-full bg-surface-container-lowest text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-label-sm text-label-sm shrink-0 border border-outline-variant/30 transition-colors"
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
            class="p-space-md bg-surface-container-lowest border-t border-outline-variant/30 flex items-center gap-space-sm"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanyakan hal spesifik tentang isi kontrak..."
              class="flex-1 px-space-md py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-default text-body-default focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              class="w-10 h-10 rounded-xl bg-secondary hover:bg-on-secondary-fixed-variant text-on-secondary flex items-center justify-center transition-all disabled:opacity-50 shrink-0 shadow-sm"
            >
              <span class="material-symbols-outlined text-[20px]">send</span>
            </button>
          </form>

        </div>

        {/* Right Column: Source Clause Inspector */}
        <div class="xl:col-span-4 flex flex-col h-[calc(100vh-14rem)] bg-surface-container-lowest rounded-xl shadow-sm p-space-lg space-y-space-md overflow-hidden">
          <div class="flex items-center justify-between pb-space-xs border-b border-outline-variant/30">
            <h3 class="font-title-sm text-title-sm text-on-surface font-bold flex items-center gap-1.5">
              <span class="material-symbols-outlined text-secondary text-[20px]">menu_book</span>
              Klausul yang Dirujuk AI
            </h3>
            {selectedCitationClause && (
              <span class="font-label-sm text-label-sm px-2 py-0.5 rounded bg-secondary-container/40 text-on-secondary-container font-semibold">
                Pasal {selectedCitationClause.nomor_pasal}
              </span>
            )}
          </div>

          {selectedCitationClause ? (
            <div class="flex-1 overflow-y-auto space-y-space-md custom-scrollbar pr-1">
              <div class="space-y-1">
                <span class="font-label-md text-label-md text-on-surface font-bold">
                  Pasal {selectedCitationClause.nomor_pasal} {selectedCitationClause.judul ? `— ${selectedCitationClause.judul}` : ''}
                </span>
                <span class={`inline-block px-2 py-0.5 rounded font-label-sm text-label-sm font-semibold ${
                  selectedCitationClause.level === 'merah' ? 'bg-error-container text-on-error-container' : selectedCitationClause.level === 'kuning' ? 'bg-[#FFFBEB] text-[#92400E]' : 'bg-[#ECFDF5] text-[#065F46]'
                }`}>
                  Tingkat: {selectedCitationClause.level?.toUpperCase()}
                </span>
              </div>

              <div class="p-space-md rounded-lg bg-surface-container-low font-body-legal text-body-sm text-on-surface-variant italic border-l-4 border-secondary">
                "{selectedCitationClause.isi}"
              </div>

              <div class="space-y-1">
                <span class="font-label-sm text-label-sm text-secondary font-semibold uppercase">Maksud Bahasa Awam:</span>
                <p class="font-body-sm text-body-sm text-on-surface leading-relaxed">
                  {selectedCitationClause.penjelasan_awam}
                </p>
              </div>

              {selectedCitationClause.saran_revisi && (
                <div class="p-space-sm rounded-lg bg-secondary-container/20 border border-secondary/20 space-y-1">
                  <span class="font-label-sm text-label-sm text-on-secondary-container font-semibold">Usulan Revisi Lebih Adil:</span>
                  <p class="font-body-sm text-body-sm text-on-surface italic">
                    "{selectedCitationClause.saran_revisi}"
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div class="flex-1 flex flex-col items-center justify-center text-center p-space-lg text-on-surface-variant">
              <span class="material-symbols-outlined text-[40px] text-outline-variant mb-2">find_in_page</span>
              <p class="font-body-sm text-body-sm">
                Saat Anda bertanya ke Chatbot, pasal yang dirujuk akan otomatis ditampilkan di sini untuk verifikasi naskah aslinya.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
