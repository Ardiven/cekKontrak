import React, { useState } from 'react';

export default function Navbar({ currentView, setView, onOpenHistory, hasDocument }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { key: 'beranda', label: 'Beranda', icon: 'home' },
    { key: 'unggah', label: 'Unggah', icon: 'upload_file' },
    ...(hasDocument ? [
      { key: 'dashboard', label: 'Analisis', icon: 'analytics' },
      { key: 'tanya', label: 'Tanya AI', icon: 'smart_toy' },
    ] : []),
  ];

  const handleNav = (key) => {
    setView(key);
    setMobileOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">

        {/* Brand Logo & Name */}
        <button
          type="button"
          onClick={() => handleNav('beranda')}
          className="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-on-secondary shadow-sm group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[20px]">gavel</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-md text-base text-on-surface tracking-tight font-bold leading-tight">CekKontrak</span>
            <span className="font-label-sm text-[10px] text-secondary font-semibold leading-none">AI Risk Analyzer</span>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-0.5 ml-6">
          {navLinks.map(link => (
            <button
              key={link.key}
              type="button"
              onClick={() => handleNav(link.key)}
              className={`px-3 py-2 transition-all font-label-md text-sm rounded-lg cursor-pointer flex items-center gap-1.5 ${
                currentView === link.key
                  ? 'bg-slate-100 text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {link.key === 'tanya' && (
                <span className="material-symbols-outlined text-[16px] text-secondary">smart_toy</span>
              )}
              {link.key === 'dashboard' && (
                <span className="material-symbols-outlined text-[16px]">analytics</span>
              )}
              <span>{link.label}</span>
            </button>
          ))}

          <button
            type="button"
            onClick={onOpenHistory}
            className="px-3 py-2 font-label-md text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">folder_open</span>
            <span>Riwayat</span>
          </button>
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-2 ml-auto">
          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 font-label-md text-xs text-slate-600 hover:text-secondary hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
          >
            <span className="material-symbols-outlined text-[15px]">api</span>
            <span>API</span>
          </a>

          <button
            type="button"
            onClick={() => handleNav('unggah')}
            className="px-4 py-2 bg-secondary hover:bg-on-secondary-fixed-variant text-on-secondary font-label-md text-sm rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">document_scanner</span>
            <span>Analisis</span>
          </button>
        </div>

        {/* Mobile: Riwayat + Hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={onOpenHistory}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Riwayat"
          >
            <span className="material-symbols-outlined text-[22px]">folder_open</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(prev => !prev)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Menu"
          >
            <span className="material-symbols-outlined text-[22px]">
              {mobileOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 shadow-lg">
          <nav className="flex flex-col p-3 gap-1">
            {navLinks.map(link => (
              <button
                key={link.key}
                type="button"
                onClick={() => handleNav(link.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer text-left ${
                  currentView === link.key
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] text-secondary">{link.icon}</span>
                <span>{link.label}</span>
                {currentView === link.key && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-secondary"></span>
                )}
              </button>
            ))}

            <div className="mt-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleNav('unggah')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-secondary hover:bg-on-secondary-fixed-variant text-on-secondary rounded-xl text-sm font-semibold transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">document_scanner</span>
                <span>Mulai Analisis Kontrak</span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
