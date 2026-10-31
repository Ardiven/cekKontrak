# Catatan Perbaikan CekKontrak (29 Okt 2026)

Basis: repo https://github.com/Ardiven/cekKontrak commit `0487adf`.
Semua test lulus: **19 passed** (8 test lama + 11 test baru). Frontend `npm run build` berhasil.

## Catatan Windows (Smart App Control)

Jalankan server dengan `python -m uvicorn backend.app.main:app --port 8000` dan test dengan `python -m pytest ...`. Jangan pakai `uvicorn.exe`/`pytest.exe` langsung, karena file `.exe` itu bisa diblokir Windows.

## Cara memasukkan ke repo GitHub

Pilih salah satu:

- **Pakai patch (paling rapi):** di folder hasil `git clone` repo, jalankan
  `git apply perbaikan-cekkontrak.patch`, lalu `git add -A`, `git commit -m "Perbaiki model, embedding, limit request, label heuristik"`, `git push`.
- **Salin file:** salin semua file dari folder ini ke folder clone (timpa), lalu commit dan push.

Setelah itu, perbarui file `.env` masing-masing:

```
GEMINI_MODEL=gemini-3.8-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
GEMINI_FALLBACK_MODEL=gemini-3.5-flash-lite
GROQ_MODEL=openai/gpt-oss-120b
LLM_BATCH_SIZE=15
```

## Apa saja yang diperbaiki

| # | Masalah | Perbaikan | File |
|---|---------|-----------|------|
| 1 | Embedding memakai `text-embedding-004` yang sudah tidak ada di daftar model Gemini. Embedding gagal diam-diam, lalu RAG memakai vektor hash dari `hash()` Python, yang hasilnya berubah setiap server restart. Dimensi vektor juga bisa tercampur (768 vs 256), sehingga skor kemiripan jadi 0. | Memakai `gemini-embedding-001` (bisa diatur lewat `.env`), satu request untuk semua pasal, dengan `task_type` RETRIEVAL_DOCUMENT/QUERY. Vektor cadangan offline sekarang memakai `crc32` (stabil antar restart). Dokumen dan pertanyaan selalu memakai jenis vektor yang sama. | `rag_service.py`, `config.py` |
| 2 | Setiap pertanyaan di chat meng-embed ulang semua pasal (boros kuota dan lambat). | Dokumen yang sudah terindeks tidak di-embed ulang. Proses embedding dijalankan di thread terpisah supaya server tidak macet. | `rag_service.py`, `chat.py`, `analyze.py` |
| 3 | Model default tidak konsisten: `gemini-2.5-flash` di kode dan README, `gemini-3.6-flash` di `.env.example`. | Disamakan ke `gemini-3.8-flash`. | `config.py`, `.env.example`, `README.md` |
| 4 | Setiap pasal = 1 request ke Gemini, padahal kuota gratis `gemini-3.8-flash` hanya **5 request/menit**. Kontrak 8 pasal langsung kena 429 dan jatuh ke heuristik. | Semua pasal dikirim dalam **1 request** (maks. `LLM_BATCH_SIZE`=15 pasal per request). Urutan cadangan: `gemini-3.8-flash` → `gemini-3.5-flash-lite` (kuota terpisah) → Groq → heuristik, hanya untuk pasal yang belum terjawab. Kalau API meminta tunggu ≤20 detik, sistem menunggu dulu; kalau lebih lama, langsung pindah model. Chat juga mencoba Flash-Lite sebelum Groq. | `analyze.py`, `llm_service.py`, `prompts.py`, `rag_service.py`, `config.py` |
| 5 | Pasal yang tidak dikenali heuristik otomatis diberi label 🟢 Aman. | Diganti 🟡 "belum dapat dinilai otomatis, cek manual". | `llm_service.py` |
| 6 | Tidak terlihat apakah sebuah pasal dinilai AI atau heuristik. | Setiap pasal mencatat `model_used`, dan dokumen punya `analysis_mode` (`ai` / `sebagian_heuristik` / `heuristik`). Dashboard menampilkan banner peringatan, label "Kata kunci" pada pasal yang dinilai heuristik, dan baris "Dianalisis oleh: ...". | `schemas.py`, `storage.py`, `analyze.py`, `DashboardView.jsx` |
| 7 | Hasil heuristik ikut tersimpan di cache selamanya. | Kalau cache berisi hasil heuristik dan API key sudah tersedia, dokumen otomatis dianalisis ulang. | `analyze.py` |
| 8 | Ringkasan skor menyebut jumlah pasal kuning padahal ada pasal merah. | Ringkasan sekarang menyebut jumlah pasal merah dan kuning dengan benar. | `risk_scorer.py` |
| 9 | Di laptop Windows dengan Smart App Control, PyMuPDF gagal dimuat (`No module named 'mupdf'`), sehingga server tidak bisa jalan. | Kalau PyMuPDF gagal dimuat, sistem otomatis memakai **pypdf** (murni Python). Jalankan `pip install -r backend\requirements.txt` lagi. | `pdf_parser.py`, `requirements.txt` |
| 10 | Groq selalu error `404 Not Found`, karena model `llama-3.3-70b-versatile` sudah dimatikan Groq sejak 16 Agustus 2026. | Default diganti ke `openai/gpt-oss-120b` (pengganti resmi yang direkomendasikan Groq). Pesan error Groq sekarang ikut ditampilkan di terminal. | `config.py`, `.env.example`, `README.md`, `llm_service.py`, `rag_service.py` |
| 11 | Daftar isi di awal dokumen (mis. S&K Spotify) ikut terbaca sebagai pasal. Muncul 7 pasal "Aman" palsu dan nomor pasal kembar ("Poin 1" dua kali), sehingga skor risiko turun dan kartu yang berbeda ikut terbuka bersamaan. | Entri yang isinya hanya judul dibuang. Nomor pasal dijamin unik, dan `key` di dashboard memakai indeks. | `clause_segmenter.py`, `DashboardView.jsx` |
| 12 | Satu "pasal" bisa berisi ±30.000 karakter dengan banyak topik, tapi hanya diberi satu label. | Pasal yang lebih panjang dari 3.500 karakter dipecah per subjudul (mis. Poin 6.2 *Warranty disclaimers*, 6.3 *Limitation of liability*). S&K Spotify jadi 33 bagian yang dinilai sendiri-sendiri. Kontrak contoh bawaan tidak berubah sama sekali. | `clause_segmenter.py` |
| 13 | Header/footer halaman hasil cetak browser ("9/8/26, 7:17 PM …", URL + nomor halaman) dan menu situs ikut masuk teks pasal. | Header/footer berulang dan deretan menu di akhir dokumen dibuang. Baris kontrak yang kebetulan berulang tetap aman. | `clause_segmenter.py` |
| 14 | AI kadang menyederhanakan angka sampai maknanya berubah ("maksimal $30", padahal "$30 **atau** total bayaran 12 bulan, mana yang lebih besar"), melewatkan perlindungan bagi pengguna (refund prorata), dan menebak motif. | Ditambah aturan akurasi di prompt: kutip angka dan syarat persis, sebut ketentuan yang melindungi pengguna, "merah" hanya jika tidak ada pengimbang, tidak menebak motif, dan menyebut jika kontrak tunduk pada hukum negara lain. Cache lama otomatis tidak dipakai (`ANALYSIS_VERSION = 2`). | `prompts.py`, `analyze.py` |
| 15 | Rujukan chat hanya mengenali "Pasal 3", bukan "Poin 6.3". Angka biasa seperti "Rp 3 juta" juga bisa salah dianggap pasal. | Rujukan dicocokkan dengan nomor pasal yang benar-benar ada. | `rag_service.py` |
| 16 | Judul "Kenapa berisiko:" tampil juga pada pasal 🟢 Aman. | Judul mengikuti level: "Kenapa berisiko" / "Kenapa perlu diteliti" / "Alasan penilaian". | `DashboardView.jsx` |
| 17 | *(Fitur baru)* Penjelasan berbahasa Indonesia tidak menunjukkan kalimat mana di teks asli (mis. bahasa Inggris) yang menjadi sumber risiko. | AI sekarang juga mengembalikan `sorotan`: kutipan persis dari teks pasal + keterangan singkat. Backend mencari posisinya di teks asli (tahan beda spasi, huruf besar-kecil, dan kata terpotong baris seperti "THIRD-\nPARTY"); kutipan yang tidak ada di teks dibuang. Dashboard menandai kalimat itu (merah/kuning, bernomor) dan menampilkan daftar "Bagian yang disorot". Mode heuristik ikut menyorot kalimat yang memuat kata kunci. `ANALYSIS_VERSION = 3`. | `highlighter.py` (baru), `schemas.py`, `prompts.py`, `llm_service.py`, `analyze.py`, `DashboardView.jsx` |
| 18 | Analisis lama: `gemini-3.8-flash` sering membalas 503 "high demand", lalu sistem menunggu dan mencoba ulang dulu; batch dikirim satu per satu; output AI panjang. | 503 → **langsung pindah** ke model cadangan, dan model yang sibuk **dilewati selama 2 menit** (`LLM_BUSY_COOLDOWN`), termasuk untuk chat. Batch dikirim **bersamaan** (`LLM_PARALLEL_BATCHES`=3). Jawaban AI dipersingkat (maks. 2 kalimat per bagian, 1–2 sorotan). | `llm_service.py`, `rag_service.py`, `config.py`, `prompts.py`, `highlighter.py` |

## Belum dikerjakan (saran berikutnya)

- **Hosting** (syarat tugas): belum ada konfigurasi deploy.
- **Database:** SQLite akan hilang setiap server restart di Render versi gratis. Pertimbangkan Supabase (sudah disiapkan di `.env`).
- **Privasi:** belum ada login, jadi `GET /api/documents` menampilkan dan `DELETE` bisa menghapus dokumen semua orang.
- **Rubrik dasar hukum:** kriteria merah, kuning, dan hijau masih hanya di prompt, belum mengutip pasal UU/regulasi.
- Peringatan lint lama di `HistoryModal.jsx` dan `RiwayatView.jsx` (`fetchHistory` dipakai sebelum dideklarasikan). Tidak mengganggu build.
