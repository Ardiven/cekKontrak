import React, { useState } from 'react';

export default function Navbar({ currentView, setView }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { key: 'analisis', label: 'Analisis' },
    { key: 'tanya', label: 'Tanya AI' },
    { key: 'riwayat', label: 'Riwayat' },
  ];

  const handleNav = (key) => {
    setView(key);
    setMobileOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white border-b border-slate-200">
      <div className="max-w-5xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
        
        {/* Brand / Logo: klik logo = beranda (unggah) */}
        <button
          type="button"
          onClick={() => handleNav('unggah')}
          className="flex items-center gap-2 text-left cursor-pointer focus:outline-none"
          aria-label="CekKontrak Beranda"
        >
          <span className="material-symbols-outlined text-[20px] text-accent">gavel</span>
          <span className="font-bold text-base text-slate-900 tracking-tight">CekKontrak</span>
        </button>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center gap-6 h-full">
          {navLinks.map((link) => {
            const isActive = currentView === link.key;
            return (
              <button
                key={link.key}
                type="button"
                onClick={() => handleNav(link.key)}
                className={`h-full flex items-center text-sm transition-colors cursor-pointer border-b-2 ${
                  isActive
                    ? 'text-slate-900 font-semibold border-accent'
                    : 'text-slate-500 hover:text-slate-900 border-transparent'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center">
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="p-1.5 text-slate-600 hover:text-slate-900 focus:outline-none"
            aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
          >
            <span className="material-symbols-outlined text-[22px]">
              {mobileOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Vertical Dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 shadow-xs">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => {
              const isActive = currentView === link.key;
              return (
                <button
                  key={link.key}
                  type="button"
                  onClick={() => handleNav(link.key)}
                  className={`py-2 text-left text-sm transition-colors cursor-pointer ${
                    isActive
                      ? 'text-slate-900 font-semibold text-accent'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
