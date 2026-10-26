# Product Requirements Document (PRD)

## CekKontrak: AI-Powered Contract Risk Analyzer & Plain-Language Explainer

| Item | Keterangan |
|------|------------|
| Versi dokumen | 1.0 (Draft) |
| Tanggal | 26 Oktober 2026 |
| Tim | Steven Bastian J (C14230203), Victor Thimothi B (C14230245) |
| Status | Draft untuk review |

---

## 1. Ringkasan Produk

CekKontrak adalah aplikasi web publik yang membantu masyarakat awam, terutama mahasiswa dan pekerja muda, memahami dokumen perjanjian sebelum menandatanganinya. Pengguna mengunggah PDF atau menempelkan teks kontrak. Sistem memecah dokumen per pasal, menilai risiko tiap pasal dengan Large Language Model (LLM) dalam tiga level warna, menjelaskan alasannya dengan bahasa sehari-hari, serta menyediakan daftar pertanyaan, draf revisi pasal, dan chatbot tanya-jawab berbasis RAG yang selalu merujuk nomor pasal.

**Pernyataan nilai:** "Pahami kontrakmu dalam beberapa menit, sebelum kamu tanda tangan."

---

## 2. Latar Belakang dan Masalah

Bahasa hukum yang kaku membuat banyak orang menandatangani kontrak tanpa sadar ada pasal yang merugikan. Konsultasi hukum mahal dan lambat, sehingga tidak realistis bagi mahasiswa dan pekerja muda.

**Contoh pasal bermasalah yang sering terlewat:**

- Denda yang tidak wajar (pemutusan kontrak, keterlambatan).
- Deposit yang tidak dikembalikan.
- Larangan bekerja atau menerima proyek di tempat lain.
- Perubahan syarat secara sepihak.

**Masalah yang diselesaikan:**

| # | Masalah pengguna | Dampak |
|---|------------------|--------|
| P1 | Tidak memahami bahasa hukum | Tanda tangan tanpa paham isi |
| P2 | Tidak tahu pasal mana yang berbahaya | Kerugian finansial atau hukum |
| P3 | Tidak tahu apa yang harus ditanyakan atau dinegosiasikan | Posisi tawar lemah |
| P4 | Jawaban AI umum bisa mengarang | Informasi menyesatkan |

---

## 3. Tujuan dan Non-Tujuan

### 3.1 Tujuan (Goals)

| ID | Tujuan |
|----|--------|
| G1 | Pengguna dapat memahami isi kontrak dalam bahasa awam. |
| G2 | Sistem menandai pasal berisiko secara akurat dan konsisten. |
| G3 | Pengguna mendapat bekal negosiasi: pertanyaan dan draf revisi. |
| G4 | Chatbot menjawab hanya berdasarkan isi kontrak dengan rujukan nomor pasal. |
| G5 | Layanan cepat, hemat biaya API, dan tetap tersedia saat satu penyedia LLM gagal. |

### 3.2 Non-Tujuan (Out of Scope)

- Memberikan nasihat hukum atau menggantikan advokat.
- Mendukung dokumen hasil scan atau foto (tanpa OCR).
- Mendukung bahasa selain Indonesia.
- Mendukung jenis kontrak di luar empat jenis fokus (tetap dapat dicoba, tetapi tidak diuji dan tidak dijamin akurasinya).
- Tanda tangan elektronik, pembuatan kontrak dari nol, atau fitur kolaborasi multi-pengguna.
- Aplikasi mobile native.

---

## 4. Target Pengguna

### 4.1 Persona

**Persona 1: Dinda, mahasiswa (21 tahun)**
Akan menyewa kos baru. Tidak paham pasal deposit dan denda keluar lebih awal. Ingin cepat tahu apakah kontrak aman.

**Persona 2: Raka, pekerja muda/freelancer (24 tahun)**
Menerima kontrak magang dan proyek freelance. Khawatir pada klausul larangan bekerja di tempat lain dan pembayaran yang ditahan.

**Persona 3: Bu Sari, masyarakat umum (38 tahun)**
Akan mengambil pinjaman dan ingin tahu bunga, denda, serta konsekuensi gagal bayar tanpa membaca puluhan halaman.

### 4.2 Jenis Dokumen yang Didukung

1. Kontrak sewa kos
2. Kontrak kerja magang atau freelance
3. Perjanjian pinjaman
4. Syarat dan ketentuan (S&K) aplikasi

---

## 5. User Stories

| ID | Sebagai | Saya ingin | Agar | Prioritas |
|----|---------|-----------|------|-----------|
| US1 | Pengguna | mengunggah PDF kontrak | tidak perlu mengetik ulang | Must |
| US2 | Pengguna | menempelkan teks kontrak | bisa menganalisis kontrak dari sumber apa pun | Must |
| US3 | Pengguna | melihat tiap pasal berwarna merah/kuning/hijau | cepat tahu bagian yang berbahaya | Must |
| US4 | Pengguna | membaca alasan risiko dan penjelasan bahasa awam | benar-benar paham | Must |
| US5 | Pengguna | melihat skor risiko keseluruhan | punya gambaran umum kontrak | Must |
| US6 | Pengguna | bertanya ke chatbot tentang kontrak saya | mendapat jawaban spesifik, misalnya denda jika keluar bulan ke-3 | Must |
| US7 | Pengguna | melihat nomor pasal rujukan di jawaban chatbot | bisa memverifikasi sendiri | Must |
| US8 | Pengguna | mendapat daftar pertanyaan sebelum tanda tangan | siap bernegosiasi | Should |
| US9 | Pengguna | mendapat draf revisi pasal yang lebih adil | punya dasar permintaan perubahan | Should |
| US10 | Pengguna | menyalin atau mengekspor pertanyaan dan revisi ke PDF | mudah dibagikan | Should |
| US11 | Pengguna | mencoba analisis tanpa login | langsung mencoba tanpa hambatan | Must |
| US12 | Pengguna terdaftar | menyimpan dan membuka riwayat dokumen | tidak perlu menganalisis ulang | Should |
| US13 | Pengguna | melihat disclaimer bahwa hasil bersifat edukatif | memahami batas penggunaan | Must |

---

## 6. Kebutuhan Fungsional

### 6.1 Input Dokumen

| ID | Kebutuhan |
|----|-----------|
| FR-01 | Sistem menerima unggahan file PDF berbasis teks. |
| FR-02 | Sistem menerima teks kontrak yang ditempel pada kolom input. |
| FR-03 | Sistem memvalidasi file (tipe PDF, batas ukuran, batas jumlah halaman/karakter) dan menampilkan pesan error yang jelas. |
| FR-04 | Jika PDF tidak mengandung teks yang dapat diekstrak (kemungkinan hasil scan), sistem menampilkan pesan bahwa dokumen belum didukung. |
| FR-05 | Sistem menghitung hash dokumen dari isi teks untuk keperluan caching. |

### 6.2 Pemrosesan dan Segmentasi

| ID | Kebutuhan |
|----|-----------|
| FR-06 | Sistem mengekstrak teks PDF dengan PyMuPDF. |
| FR-07 | Sistem memecah teks menjadi pasal berdasarkan pola penomoran (misalnya "Pasal 1", "Pasal 2"). |
| FR-08 | Jika pola pasal tidak ditemukan, sistem memakai segmentasi cadangan (berdasarkan paragraf atau nomor butir) dan memberi tahu pengguna. |
| FR-09 | Setiap pasal menyimpan nomor, judul (jika ada), dan isi. |

### 6.3 Analisis Risiko per Pasal

| ID | Kebutuhan |
|----|-----------|
| FR-10 | Setiap pasal dianalisis LLM dan menghasilkan JSON terstruktur: `level` (merah/kuning/hijau), `alasan`, `penjelasan_awam`, `saran_revisi`. |
| FR-11 | Keluaran LLM divalidasi terhadap skema JSON; jika tidak valid, sistem mencoba ulang (retry) sebelum menandai pasal gagal dianalisis. |
| FR-12 | Sistem menghitung skor risiko keseluruhan dari hasil seluruh pasal. |
| FR-13 | Hasil ditampilkan dengan kode warna, alasan, dan penjelasan awam untuk tiap pasal. |
| FR-14 | Pengguna dapat memfilter pasal berdasarkan level risiko. |
| FR-15 | Disclaimer "edukatif, bukan nasihat hukum" tampil di halaman hasil dan chatbot. |

### 6.4 Daftar Pertanyaan dan Draf Revisi

| ID | Kebutuhan |
|----|-----------|
| FR-16 | Sistem menghasilkan daftar pertanyaan yang sebaiknya diajukan sebelum tanda tangan, berdasarkan pasal berisiko. |
| FR-17 | Sistem menampilkan draf revisi yang lebih adil untuk pasal berlevel merah/kuning. |
| FR-18 | Pengguna dapat menyalin teks dengan satu klik. |
| FR-19 | Pengguna dapat mengekspor daftar pertanyaan dan draf revisi ke PDF. |

### 6.5 Chatbot RAG

| ID | Kebutuhan |
|----|-----------|
| FR-20 | Setiap pasal dipecah menjadi chunk dan diubah menjadi embedding (`gemini-embedding-001`), disimpan di pgvector. |
| FR-21 | Saat pengguna bertanya, sistem mengambil top-k pasal paling relevan lewat semantic search yang dibatasi pada dokumen pengguna. |
| FR-22 | LLM menjawab hanya berdasarkan pasal yang diambil. |
| FR-23 | Setiap jawaban wajib menyertakan nomor pasal rujukan. |
| FR-24 | Jika informasi tidak ada di kontrak, chatbot menyatakan bahwa kontrak tidak mengatur hal tersebut dan tidak mengarang. |
| FR-25 | Rujukan pasal pada jawaban dapat diklik untuk menyorot pasal terkait. |
| FR-26 | Chatbot menolak atau mengarahkan pertanyaan di luar konteks kontrak. |

### 6.6 Akun dan Riwayat

| ID | Kebutuhan |
|----|-----------|
| FR-27 | Pengguna dapat menganalisis kontrak tanpa login. |
| FR-28 | Pengguna dapat mendaftar dan masuk melalui Supabase Auth. |
| FR-29 | Pengguna terdaftar dapat menyimpan hasil analisis, melihat daftar riwayat, membuka kembali, dan menghapus dokumen. |
| FR-30 | File PDF pengguna terdaftar disimpan di Supabase Storage dengan akses terbatas pada pemiliknya. |

### 6.7 Caching dan Ketahanan

| ID | Kebutuhan |
|----|-----------|
| FR-31 | Hasil analisis disimpan berdasarkan hash dokumen; dokumen identik memakai hasil tersimpan tanpa memanggil LLM. |
| FR-32 | Jika Gemini error atau kuota habis, sistem otomatis beralih ke Groq (`openai/gpt-oss-120b`). |
| FR-33 | Sistem menerapkan rate limiting per IP/pengguna untuk melindungi kuota API. |

---

## 7. Kebutuhan Non-Fungsional

| ID | Kategori | Kebutuhan |
|----|----------|-----------|
| NFR-01 | Performa | Analisis kontrak tipikal selesai dalam waktu wajar (target awal: di bawah 60 detik untuk kontrak ±10 halaman); dokumen ter-cache muncul dalam hitungan detik. |
| NFR-02 | Performa | Jawaban chatbot muncul dalam beberapa detik (target awal: di bawah 10 detik). |
| NFR-03 | Akurasi | Kesesuaian deteksi pasal berisiko dengan anotasi manual diukur pada ±10 kontrak (target dan metrik didefinisikan di bagian 11). |
| NFR-04 | Keamanan | Seluruh komunikasi memakai HTTPS; kunci API disimpan di variabel lingkungan backend, tidak pernah di frontend. |
| NFR-05 | Privasi | Dokumen pengguna tidak dibagikan ke pengguna lain; dokumen tamu (tanpa login) tidak disimpan permanen atau dihapus setelah masa tertentu. |
| NFR-06 | Privasi | Pengguna diberi informasi bahwa teks kontrak dikirim ke penyedia LLM pihak ketiga untuk diproses. |
| NFR-07 | Keandalan | Fallback LLM memastikan layanan tetap berjalan saat satu penyedia gagal. |
| NFR-08 | Usability | Antarmuka responsif (desktop dan mobile browser), bahasa Indonesia sederhana. |
| NFR-09 | Aksesibilitas | Level risiko tidak hanya dibedakan warna, tetapi juga label teks/ikon. |
| NFR-10 | Maintainability | Dokumentasi API Swagger otomatis dari FastAPI; kode terdokumentasi di GitHub. |

---

## 8. Alur Pengguna (User Flow)

```
Buka aplikasi
   │
   ├─ Unggah PDF / tempel teks
   │
   ▼
Validasi input ──(gagal)──▶ Pesan error
   │
   ▼
Hitung hash ──(sudah ada)──▶ Ambil hasil dari database
   │
   (baru)
   ▼
Ekstraksi teks → Segmentasi pasal
   │
   ▼
Analisis LLM per pasal (Gemini → fallback Groq)
   │
   ▼
Simpan hasil + embedding
   │
   ▼
Halaman hasil
   ├─ Skor risiko + daftar pasal berwarna
   ├─ Daftar pertanyaan & draf revisi (salin / ekspor PDF)
   └─ Chatbot tanya kontrak (jawaban + rujukan pasal)
```

---

## 9. Spesifikasi AI

### 9.1 Tahap 1: Analisis Terstruktur

**Input:** teks satu pasal (dan konteks jenis kontrak jika diketahui).
**Output (JSON):**

```json
{
  "nomor_pasal": "5",
  "level": "merah",
  "alasan": "Denda keluar lebih awal sama dengan seluruh sisa sewa.",
  "penjelasan_awam": "Kalau kamu pindah sebelum masa sewa habis, kamu harus tetap membayar semua bulan yang tersisa.",
  "saran_revisi": "Denda keluar lebih awal maksimal sebesar satu bulan sewa."
}
```

**Aturan:**

- Output harus lolos validasi skema; jika tidak, retry.
- Level hanya salah satu dari `merah`, `kuning`, `hijau`.
- Penjelasan memakai bahasa sehari-hari tanpa istilah hukum yang tidak dijelaskan.

### 9.2 Tahap 2: RAG Chat

1. Embed pertanyaan dengan `gemini-embedding-001`.
2. Cari top-k chunk pasal terdekat di pgvector (filter per dokumen).
3. Susun prompt: persona + aturan grounding + potongan pasal + pertanyaan.
4. LLM menjawab dengan rujukan nomor pasal.

### 9.3 Prompt Engineering

- **Persona:** "pendamping hukum awam" yang ramah, netral, dan jujur tentang keterbatasan.
- **Aturan grounding wajib:** hanya memakai isi pasal yang diberikan, wajib menyebut nomor pasal, dan menjawab "tidak diatur dalam kontrak" bila tidak ada dasarnya.
- **Keselamatan:** tidak memberi kepastian hukum; selalu mengingatkan sifat edukatif.

### 9.4 Pemilihan Model

| Peran | Model |
|-------|-------|
| LLM utama | Gemini API (`gemini-3.8-flash`) dengan structured output |
| LLM fallback | Groq (`openai/gpt-oss-120b`) |
| Embedding | `gemini-embedding-001` |

---

## 10. Arsitektur dan Model Data

### 10.1 Arsitektur

- **Frontend:** Next.js (React) + Tailwind CSS (masih dapat berubah), dihosting di Vercel.
- **Backend:** FastAPI (Python 3), dihosting di Render/Railway (masih dapat berubah).
- **Pemrosesan dokumen:** PyMuPDF dan modul segmentasi pasal.
- **Database, Auth, Storage:** Supabase (PostgreSQL + pgvector, Auth, Storage).

### 10.2 Usulan Skema Data

| Tabel | Kolom utama |
|-------|-------------|
| `documents` | `id`, `user_id` (nullable), `doc_hash`, `title`, `contract_type`, `file_path`, `overall_score`, `created_at` |
| `clauses` | `id`, `document_id`, `number`, `title`, `content`, `level`, `reason`, `plain_explanation`, `revision_suggestion` |
| `clause_embeddings` | `id`, `clause_id`, `document_id`, `embedding` (vector) |
| `questions` | `id`, `document_id`, `question_text`, `related_clause` |
| `chat_messages` | `id`, `document_id`, `role`, `content`, `cited_clauses`, `created_at` |

Indeks: `doc_hash` (unik untuk caching) dan indeks vektor pada `embedding`.

### 10.3 Usulan Endpoint API

| Method | Endpoint | Fungsi |
|--------|----------|--------|
| POST | `/api/analyze` | Unggah PDF/teks, jalankan analisis (atau ambil dari cache) |
| GET | `/api/documents` | Daftar riwayat dokumen pengguna |
| GET | `/api/documents/{id}` | Detail dokumen, pasal, dan hasil analisis |
| DELETE | `/api/documents/{id}` | Hapus dokumen |
| GET | `/api/documents/{id}/questions` | Daftar pertanyaan sebelum tanda tangan |
| POST | `/api/documents/{id}/chat` | Tanya-jawab RAG |
| GET | `/api/documents/{id}/export` | Ekspor pertanyaan dan revisi ke PDF |
| GET | `/docs` | Dokumentasi Swagger |

---

## 11. Metrik Keberhasilan

| Metrik | Cara ukur | Target (usulan, disepakati tim) |
|--------|-----------|---------------------------------|
| Akurasi deteksi pasal berisiko | Bandingkan dengan anotasi manual pada ±10 kontrak (precision, recall, dan kesesuaian level) | Ditetapkan setelah uji awal |
| Waktu respons analisis | Rata-rata dan persentil ke-95 | Sesuai NFR-01 |
| Waktu respons chatbot | Rata-rata | Sesuai NFR-02 |
| Kepatuhan rujukan pasal | Persentase jawaban chatbot yang memuat nomor pasal valid | Mendekati 100% |
| Cache hit | Persentase analisis yang dilayani dari cache | Dipantau |
| Kepuasan pengguna | Kuesioner (skala Likert) | Ditetapkan sebelum pengujian |

---

## 12. Rencana Pengujian

1. **Pengujian akurasi:** siapkan ±10 kontrak (campuran empat jenis), anotasi manual per pasal, bandingkan dengan keluaran sistem.
2. **Pengujian segmentasi:** variasi format penomoran pasal.
3. **Pengujian chatbot:** daftar pertanyaan uji, termasuk pertanyaan yang jawabannya tidak ada di kontrak, untuk memastikan tidak ada halusinasi.
4. **Pengujian fallback:** simulasi kegagalan Gemini dan pastikan Groq mengambil alih.
5. **Pengujian performa:** ukur waktu respons dengan dan tanpa cache.
6. **Pengujian keamanan dasar:** akses dokumen antar pengguna, validasi file, rate limiting.
7. **Kuesioner pengguna:** kepuasan, kejelasan penjelasan, dan kegunaan fitur.

---

## 13. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| LLM salah menilai risiko | Pengguna salah paham | Disclaimer, penjelasan alasan, pengujian terhadap anotasi manual, penyempurnaan prompt |
| Halusinasi pada chatbot | Informasi menyesatkan | Grounding ketat, wajib rujukan pasal, jawaban "tidak diatur" bila tidak ada dasar |
| Kuota atau error API | Layanan terhenti | Fallback Groq, caching, rate limiting |
| Segmentasi pasal gagal pada format tak standar | Analisis tidak akurat | Segmentasi cadangan dan notifikasi ke pengguna |
| Kebocoran data sensitif dalam kontrak | Isu privasi | Akses terbatas, informasi pemrosesan pihak ketiga, penghapusan dokumen tamu |
| Pengguna menganggap hasil sebagai nasihat hukum | Risiko hukum dan reputasi | Disclaimer menonjol dan konsisten |
| Latensi tinggi untuk kontrak panjang | Pengalaman buruk | Pemrosesan paralel per pasal, indikator progres, batas panjang dokumen |
| Biaya dan batas layanan tier gratis hosting | Layanan lambat atau tidur | Pantau penggunaan; hosting dapat diganti |

---

## 14. Asumsi dan Ketergantungan

- Dokumen berbahasa Indonesia dan berbasis teks.
- Layanan Gemini, Groq, dan Supabase tersedia serta kuotanya cukup untuk pengujian.
- Pengguna memiliki koneksi internet dan browser modern.
- Stack frontend dan hosting masih dapat berubah sesuai evaluasi tim.

---

## 15. Rencana Rilis (Fase)

| Fase | Cakupan |
|------|---------|
| 1. Fondasi | Setup repo, FastAPI, Supabase, ekstraksi PDF, segmentasi pasal |
| 2. Analisis inti | Integrasi Gemini dengan structured output, skor risiko, tampilan hasil berwarna, caching hash |
| 3. RAG chat | Embedding, pgvector, chatbot dengan rujukan pasal |
| 4. Fitur pendukung | Daftar pertanyaan, draf revisi, salin dan ekspor PDF, fallback Groq |
| 5. Akun dan riwayat | Supabase Auth, penyimpanan riwayat, Storage |
| 6. Pengujian dan dokumentasi | Uji akurasi, performa, kuesioner, Swagger, laporan, deploy publik |

---

## 16. Pertanyaan Terbuka

1. Berapa batas maksimum ukuran file dan jumlah halaman per dokumen?
2. Berapa lama dokumen tamu (tanpa login) disimpan sebelum dihapus?
3. Bagaimana rumus skor risiko keseluruhan (rata-rata berbobot atau berdasarkan jumlah pasal merah)?
4. Apakah chatbot menyimpan riwayat percakapan untuk pengguna tamu?
5. Berapa target numerik akurasi dan kepuasan yang disepakati untuk laporan akhir?
6. Apakah stack frontend (Next.js) dan hosting (Render/Railway) jadi dipakai atau diganti?

---

## 17. Disclaimer Produk

> CekKontrak menyediakan analisis yang bersifat **edukatif** dan **bukan nasihat hukum**. Untuk keputusan penting, konsultasikan kontrak Anda dengan ahli hukum atau lembaga bantuan hukum.
