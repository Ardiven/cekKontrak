import React from 'react';

export default function Navbar({ currentView, setView, onOpenHistory, hasDocument }) {
  return (
    <header class="fixed top-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div class="h-16 w-full px-margin flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div class="flex items-center gap-space-lg">
          <button 
            onClick={() => setView('beranda')} 
            class="flex items-center gap-space-sm text-left focus:outline-none"
          >
            <div class="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-on-secondary shadow-sm">
              <span class="material-symbols-outlined text-[20px]">description</span>
            </div>
            <div class="flex flex-col">
              <span class="font-headline-md text-headline-md text-on-surface tracking-tight font-bold">CekKontrak</span>
              <span class="font-label-sm text-label-sm text-secondary font-semibold">AI Risk Analyzer</span>
            </div>
          </button>

          {/* Navigation Links */}
          <nav class="hidden md:flex items-center gap-space-xs">
            <button
              onClick={() => setView('beranda')}
              class={`px-space-md py-space-sm transition-colors font-label-md text-label-md rounded-lg ${
                currentView === 'beranda' 
                  ? 'bg-surface-container text-on-surface font-semibold' 
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Beranda
            </button>

            <button
              onClick={() => setView('unggah')}
              class={`px-space-md py-space-sm transition-colors font-label-md text-label-md rounded-lg ${
                currentView === 'unggah' 
                  ? 'bg-surface-container text-on-surface font-semibold' 
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Unggah Kontrak
            </button>

            {hasDocument && (
              <>
                <button
                  onClick={() => setView('dashboard')}
                  class={`px-space-md py-space-sm transition-colors font-label-md text-label-md rounded-lg ${
                    currentView === 'dashboard' 
                      ? 'bg-surface-container text-on-surface font-semibold' 
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Dashboard Analisis
                </button>

                <button
                  onClick={() => setView('tanya')}
                  class={`px-space-md py-space-sm transition-colors font-label-md text-label-md rounded-lg ${
                    currentView === 'tanya' 
                      ? 'bg-surface-container text-on-surface font-semibold' 
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Tanya Kontrak AI
                </button>
              </>
            )}

            <button
              onClick={onOpenHistory}
              class="px-space-md py-space-sm font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors rounded-lg flex items-center gap-1"
            >
              <span class="material-symbols-outlined text-[16px]">folder_open</span>
              <span>Riwayat</span>
            </button>
          </nav>
        </div>

        {/* Action Buttons */}
        <div class="flex items-center gap-space-md">
          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            class="hidden sm:inline-flex items-center gap-1 px-space-md py-space-sm font-label-md text-label-md text-on-surface hover:text-secondary transition-colors"
          >
            <span class="material-symbols-outlined text-[16px]">api</span>
            <span>Swagger API</span>
          </a>

          <button
            onClick={() => setView('unggah')}
            class="px-space-lg py-space-sm bg-secondary hover:bg-on-secondary-fixed-variant text-on-secondary font-label-md text-label-md rounded-lg shadow-sm transition-all flex items-center gap-1"
          >
            <span class="material-symbols-outlined text-[18px]">document_scanner</span>
            <span>Analisis Kontrak</span>
          </button>
        </div>

      </div>
    </header>
  );
}
