import React from 'react';

export default function DisclaimerBanner() {
  return (
    <div class="bg-[#FFF1F2] border border-[#FECDD3] rounded-xl p-space-sm px-space-md flex items-center gap-space-sm mb-space-md text-[#9F1239] text-body-sm shadow-sm">
      <span class="material-symbols-outlined text-error text-[20px] shrink-0">info</span>
      <div>
        <strong>PENTING (DISCLAIMER):</strong> Analisis CekKontrak bersifat <strong>edukatif</strong> dan <strong>bukan nasihat hukum formal</strong>. Selalu konsultasikan dokumen penting bernilai tinggi dengan ahli hukum atau advokat.
      </div>
    </div>
  );
}
