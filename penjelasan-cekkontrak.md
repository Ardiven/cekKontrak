# CekKontrak: AI-Powered Contract Risk Analyzer & Plain-Language Explainer

**Anggota kelompok**

| No | Nama | NRP |
|----|------|-----|
| 1 | Steven Bastian J | C14230203 |
| 2 | Victor Thimothi B | C14230245 |

---

## 1. Ringkasan Proyek

**CekKontrak** adalah aplikasi web publik yang membantu masyarakat awam, terutama mahasiswa dan pekerja muda, memahami dokumen perjanjian sebelum menandatanganinya. Pengguna mengunggah PDF atau menempelkan teks kontrak, lalu sistem menandai tingkat risiko tiap pasal dan menjelaskannya dalam bahasa sehari-hari.

Jenis dokumen yang menjadi fokus:

- Kontrak sewa kos
- Kontrak kerja magang atau freelance
- Perjanjian pinjaman
- Syarat dan ketentuan (S&K) aplikasi

---

## 2. Latar Belakang dan Masalah

Bahasa hukum yang kaku dan berbelit membuat banyak orang menandatangani kontrak tanpa membaca atau memahaminya. Akibatnya, mereka sering tidak sadar ada pasal yang merugikan, misalnya:

| Jenis pasal bermasalah | Contoh dampak |
|------------------------|---------------|
| Denda yang tidak wajar | Denda keterlambatan atau pemutusan kontrak yang sangat besar |
| Deposit tidak dikembalikan | Uang jaminan kos hangus tanpa alasan jelas |
| Larangan bekerja di tempat lain | Freelancer atau magang tidak boleh menerima proyek lain |
| Pasal sepihak | Salah satu pihak dapat mengubah syarat tanpa persetujuan |

Konsultasi dengan ahli hukum membutuhkan biaya dan waktu, sehingga tidak realistis bagi mahasiswa dan pekerja muda. CekKontrak hadir sebagai pendamping awal yang cepat, murah, dan mudah dipahami.

---

## 3. Tujuan Proyek

1. Memudahkan orang awam memahami isi kontrak dalam bahasa sehari-hari.
2. Mengidentifikasi pasal berisiko secara otomatis dengan penanda visual yang jelas.
3. Membekali pengguna dengan pertanyaan dan usulan revisi untuk bernegosiasi sebelum tanda tangan.
4. Menyediakan tanya-jawab yang **terpercaya** (berbasis isi kontrak, bukan karangan AI) dengan rujukan nomor pasal.

---

## 4. Target Pengguna

- Mahasiswa yang menyewa kos atau mengambil magang.
- Pekerja muda dan freelancer yang menerima kontrak kerja.
- Masyarakat umum yang akan menandatangani perjanjian pinjaman atau menyetujui S&K aplikasi.

---

## 5. Cara Kerja Sistem

### 5.1 Alur Pengguna

1. Pengguna mengunggah **PDF** atau menempelkan **teks** kontrak.
2. Sistem mengekstrak teks dan memecah dokumen **per pasal**.
3. Setiap pasal dianalisis oleh LLM.
4. Hasil ditampilkan dengan penanda warna, alasan, dan penjelasan awam.
5. Pengguna dapat membuka daftar pertanyaan, draf revisi, atau bertanya lewat chatbot.

### 5.2 Penanda Tingkat Risiko

| Warna | Arti | Maksud |
|-------|------|--------|
| 🔴 Merah | Berisiko | Pasal berpotensi merugikan, sebaiknya dinegosiasikan atau ditolak |
| 🟡 Kuning | Perlu diperhatikan | Pasal perlu dibaca teliti atau diklarifikasi |
| 🟢 Hijau | Aman | Pasal wajar dan umum |

Sistem juga menampilkan **skor risiko keseluruhan** kontrak sebagai ringkasan cepat.

---

## 6. Fitur Utama

### 6.1 Analisis dan Highlight Risiko per Pasal
Setiap pasal diberi level risiko, alasan mengapa dinilai demikian, dan penjelasan dalam bahasa awam.

### 6.2 Daftar Pertanyaan Sebelum Tanda Tangan
Daftar pertanyaan siap pakai yang sebaiknya diajukan kepada pihak lain (pemilik kos, perusahaan, pemberi pinjaman) agar pengguna lebih siap bernegosiasi.

### 6.3 Draf Revisi Pasal yang Lebih Adil
Rekomendasi kalimat pengganti untuk pasal bermasalah sehingga pengguna punya dasar konkret saat meminta perubahan.

### 6.4 Chatbot Tanya Kontrak (RAG)
Chatbot menjawab pertanyaan seperti *"Kalau saya keluar di bulan ke-3, kena denda berapa?"*. Ciri utamanya:

- Menjawab **hanya** berdasarkan isi kontrak yang diunggah.
- **Selalu menyebut nomor pasal** rujukan.
- Mengurangi risiko jawaban "dikarang" (halusinasi) oleh AI.

### 6.5 Ekspor dan Salin
Draf revisi dan daftar pertanyaan dapat langsung disalin atau diekspor ke PDF.

### 6.6 Mode Tanpa Login dan Dengan Login
- **Tanpa login:** analisis kontrak tetap bisa dicoba.
- **Dengan login:** riwayat dokumen tersimpan dan dapat dibuka kembali.

---

## 7. Arsitektur Sistem

Sistem memakai arsitektur **client–server** dengan **pipeline AI dua tahap**.

```
┌──────────────┐     HTTPS      ┌────────────────────┐
│   Frontend   │ ─────────────▶ │  Backend (FastAPI) │
│ Next.js/React│ ◀───────────── │                    │
└──────────────┘                └─────────┬──────────┘
                                          │
          ┌───────────────────────────────┼──────────────────────────┐
          ▼                               ▼                          ▼
 ┌─────────────────┐          ┌───────────────────┐      ┌─────────────────────┐
 │ Pemrosesan PDF  │          │   Pipeline AI     │      │  Supabase           │
 │ PyMuPDF +       │          │ Gemini (utama)    │      │  PostgreSQL+pgvector│
 │ segmentasi pasal│          │ Groq (fallback)   │      │  Auth, Storage      │
 └─────────────────┘          └───────────────────┘      └─────────────────────┘
```

### 7.1 Tahap 1: Analisis Terstruktur
- Tiap pasal dianalisis LLM.
- Keluaran berupa **JSON** terstruktur berisi: level risiko, alasan, penjelasan awam, dan saran revisi.
- Format terstruktur memudahkan frontend menampilkan hasil secara konsisten.

### 7.2 Tahap 2: RAG Chat
1. Potongan pasal diubah menjadi **embedding** dan disimpan di database vektor.
2. Saat pengguna bertanya, pertanyaan di-embed dan dicari **pasal paling relevan** (semantic search).
3. Pasal tersebut dikirim ke LLM sebagai konteks untuk menyusun jawaban.
4. Jawaban wajib mencantumkan nomor pasal rujukan.

### 7.3 Caching Berbasis Hash Dokumen
Hasil analisis disimpan berdasarkan **hash dokumen**. Jika dokumen yang sama diunggah lagi, sistem memakai hasil yang tersimpan tanpa memanggil LLM ulang. Manfaatnya:

- Menghemat kuota API.
- Respons lebih cepat.
- Hasil untuk dokumen yang sama konsisten.

### 7.4 Mekanisme Fallback LLM
Jika Gemini mengalami error atau kuota habis, sistem otomatis beralih ke Groq sehingga layanan tetap berjalan.

---

## 8. Tech Stack

| Lapisan | Teknologi | Keterangan |
|---------|-----------|------------|
| Frontend | Next.js (React) + Tailwind CSS | Masih bisa berubah |
| Backend | Python 3 + FastAPI | Menyediakan REST API dan dokumentasi Swagger |
| Pemrosesan dokumen | PyMuPDF | Ekstraksi teks PDF, lalu segmentasi per pasal |
| LLM utama | Gemini API (`gemini-3.8-flash`) | Structured output (JSON) untuk analisis risiko |
| LLM fallback | Groq (`openai/gpt-oss-120b`) | Aktif otomatis saat Gemini error atau kuota habis |
| Embedding | `gemini-embedding-001` | Untuk semantic search pada RAG |
| Vector DB | PostgreSQL + pgvector (Supabase) | Menyimpan embedding pasal |
| Auth dan storage | Supabase Auth dan Supabase Storage | Login pengguna dan penyimpanan file PDF |
| Hosting | Vercel (frontend), Render/Railway (backend) | Masih bisa berubah |

### Prompt Engineering
- Persona: **"pendamping hukum awam"**.
- Aturan *grounding* wajib: jawaban harus berdasar isi kontrak dan menyebut nomor pasal.
- Disclaimer ditampilkan bahwa hasil bersifat edukatif.

---

## 9. Output Proyek

| No | Output | Deskripsi |
|----|--------|-----------|
| 1 | **Aplikasi Web CekKontrak (live & publik)** | Sudah di-hosting dan dapat diakses publik. Analisis bisa dicoba tanpa login; login untuk menyimpan riwayat |
| 2 | **Analisis dan highlight risiko per pasal** | Pasal ditandai merah/kuning/hijau dengan alasan, penjelasan awam, dan skor risiko keseluruhan |
| 3 | **Chatbot Tanya Kontrak (RAG)** | Menjawab pertanyaan dari isi kontrak dengan rujukan nomor pasal |
| 4 | **Draf revisi pasal dan daftar pertanyaan** | Dapat disalin atau diekspor ke PDF |
| 5 | **Dokumentasi dan laporan pengujian** | Repository GitHub, dokumentasi API (Swagger), dan laporan pengujian |

---

## 10. Rencana Pengujian

1. **Akurasi deteksi pasal berisiko:** membandingkan hasil sistem dengan anotasi manual pada sekitar **10 kontrak**.
2. **Waktu respons:** mengukur kecepatan analisis dan chatbot, termasuk efek caching.
3. **Kepuasan pengguna:** kuesioner kepada calon pengguna.

---

## 11. Batasan Sistem

- Hasil analisis **bersifat edukatif dan bukan nasihat hukum**; disclaimer selalu ditampilkan.
- Hanya mendukung dokumen **berbahasa Indonesia**.
- Hanya mendukung dokumen **berbasis teks**, bukan hasil scan atau foto (tidak ada OCR).
- Pengujian difokuskan pada **empat jenis kontrak**: sewa kos, kerja magang/freelance, pinjaman, dan S&K aplikasi.

---

## 12. Nilai dan Keunggulan

- **Mudah dipahami:** bahasa awam, bukan bahasa hukum.
- **Visual dan cepat:** kode warna langsung menunjukkan bagian yang perlu diwaspadai.
- **Dapat ditindaklanjuti:** pengguna mendapat pertanyaan dan draf revisi, bukan sekadar peringatan.
- **Dapat dipercaya:** chatbot RAG berbasis isi kontrak dengan rujukan pasal.
- **Efisien dan tangguh:** caching hash dokumen dan fallback LLM menjaga biaya, kecepatan, dan ketersediaan layanan.
- **Mudah diakses:** dapat dicoba tanpa login.
