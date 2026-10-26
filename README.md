# CekKontrak: AI-Powered Contract Risk Analyzer & Plain-Language Explainer

Aplikasi web publik yang membantu masyarakat awam (terutama mahasiswa, pekerja muda, dan freelancer) memahami dokumen perjanjian sebelum menandatanganinya.

## Fitur Utama

1. **Analisis Risiko per Pasal (Visual)**:
   - 🔴 **Merah (Risiko Tinggi)**: Denda tidak wajar, deposit hangus sepihak, larangan non-compete berlebihan.
   - 🟡 **Kuning (Perlu Diperhatikan)**: Klausul ambigu, perpanjangan otomatis, tanggung jawab perbaikan tidak jelas.
   - 🟢 **Hijau (Aman & Wajar)**: Ketentuan standar dan umum.
2. **Penjelasan Bahasa Awam & Usulan Draf Revisi**:
   - Menjelaskan arti hukum dalam bahasa sehari-hari.
   - Rekomendasi redaksional yang lebih adil dan seimbang dilengkapi tombol **1-Click Salin Revisi**.
3. **Bekal Pertanyaan Sebelum Tanda Tangan**:
   - Daftar pertanyaan taktis yang siap diajukan kepada pihak pemilik/perusahaan saat negosiasi.
4. **Chatbot Tanya Kontrak (RAG Terpercaya)**:
   - Menjawab **hanya** berdasarkan pasal yang ada di dalam kontrak (grounded).
   - **Wajib menyebut nomor pasal rujukan** (misal `[Pasal 3]`).
   - Tombol rujukan dapat diklik untuk menyorot pasal terkait pada dokumen.
   - Jika hal yang ditanyakan tidak diatur, AI menyatakan secara jujur tanpa halusinasi.
5. **Ekspor Laporan Resmi ke PDF**:
   - Menghasilkan berkas PDF siap cetak berisi ringkasan skor risiko, daftar pertanyaan negosiasi, dan draf revisi.
6. **Caching Berbasis Hash Dokumen (`doc_hash`)**:
   - Menganalisis dokumen identik secara instan tanpa mengonsumsi kuota API berulang.
7. **Ketahanan Multi-LLM**:
   - **Primary**: Google Gemini API (`gemini-2.5-flash`).
   - **Fallback**: Groq API (`llama-3.3-70b-versatile`).
   - **Heuristic Fallback**: Sistem cerdas yang dapat berjalan offline secara instan.

---

## Tech Stack & Desain Stitch

- **Frontend**: **React.js** (Vite SPA) dengan desain 100% mengikuti proyek Stitch **CekKontrak** (`projects/6382358767940897912`):
  - Tailwind CSS dengan token desain resmi Stitch (Surface, Secondary, Error, Bento-Grid, typography Inter & Google Material Symbols).
  - Dual Mode: Beranda, Unggah Dokumen, Dashboard Analisis, dan Tanya Kontrak AI Copilot.
- **Backend**: **Python 3.12 + FastAPI**.
- **PDF Parser & Segmenter**: **PyMuPDF (`fitz`)** + Regex segmentation per pasal bahasa Indonesia.
- **Ekspor PDF**: **ReportLab**.
- **Vector Search / RAG**: Normalized cosine similarity index.
- **Database & Cache**: SQLite persistent store (siap integrasi Supabase Auth & Storage).

---

## Cara Menjalankan Proyek

### 1. Menjalankan Backend (FastAPI)
Buka terminal di direktori proyek:
```powershell
# Aktifkan virtual environment dan jalankan server
.venv\Scripts\uvicorn.exe backend.app.main:app --reload --port 8000
```
- API Base: `http://localhost:8000`
- Swagger UI Interaktif: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### 2. Menjalankan Frontend (React Vite)
Buka terminal lain:
```powershell
cd frontend
npm run dev
```
Buka browser di: `http://localhost:5173`

*(Catatan: Anda juga dapat langsung membuka `http://localhost:8000` karena backend FastAPI sudah otomatis menyajikan bundle production React `frontend/dist`)*

---

## Menjalankan Unit & Integration Tests

Semua modul (segmenter, hash parser, risk scorer, heuristic fallback, RAG grounder, API caching) sudah teruji secara komprehensif:
```powershell
.venv\Scripts\pytest.exe -o pythonpath=. backend\tests\test_backend.py
```
Hasil: **8 passed** (100% lulus).

---

## Tim Pengembang
- Steven Bastian J (C14230203)
- Victor Thimothi B (C14230245)
