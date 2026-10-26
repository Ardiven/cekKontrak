import React from 'react';

export default function DisclaimerBanner() {
  return (
    <div className="bg-[#FFF1F2] border border-[#FECDD3] rounded-xl p-3 px-4 flex items-center gap-3 mb-6 text-[#9F1239] text-sm shadow-sm transition-all">
      <span className="material-symbols-outlined text-error text-[20px] shrink-0">info</span>
      <div className="leading-snug">
        <strong>PENTING (DISCLAIMER):</strong> Analisis CekKontrak bersifat <strong>edukatif</strong> dan <strong>bukan nasihat hukum formal</strong>. Selalu konsultasikan dokumen penting bernilai tinggi dengan ahli hukum atau advokat berwenang.
      </div>
    </div>
  );
}
