# CekKontrak — AI-Powered Contract Risk Analyzer

> **Jangan tanda tangan sebelum kamu paham kontraknya.**

Aplikasi web publik yang membantu masyarakat awam — terutama mahasiswa, pekerja muda, dan freelancer — memahami dokumen perjanjian hukum sebelum menandatanganinya. CekKontrak menggunakan AI (Gemini / Groq) untuk membedah setiap pasal kontrak, menjelaskannya dalam bahasa Indonesia yang mudah dipahami, dan menyiapkan bekal negosiasi yang konkret.

---

## Daftar Isi

1. [Fitur Utama](#fitur-utama)
2. [Tech Stack](#tech-stack)
3. [Arsitektur Sistem](#arsitektur-sistem)
4. [Struktur Direktori](#struktur-direktori)
5. [Persyaratan Sistem](#persyaratan-sistem)
6. [Cara Instalasi & Menjalankan (dari Awal)](#cara-instalasi--menjalankan-dari-awal)
7. [Konfigurasi Environment Variables](#konfigurasi-environment-variables)
8. [Menjalankan Tests](#menjalankan-tests)
9. [Endpoint API](#endpoint-api)
10. [Tim Pengembang](#tim-pengembang)

---

## Fitur Utama

| # | Fitur | Deskripsi |
|---|-------|-----------|
| 1 | **Analisis Risiko per Pasal** | Setiap pasal dikategorikan 🔴 Merah (Berisiko), 🟡 Kuning (Perlu Teliti), atau 🟢 Hijau (Aman) |
| 2 | **Penjelasan Bahasa Awam** | Arti hukum diterjemahkan ke bahasa sehari-hari yang mudah dipahami |
| 3 | **Usulan Draf Revisi** | Kalimat alternatif yang lebih adil + tombol **1-Click Salin Revisi** |
| 4 | **Bekal Pertanyaan Negosiasi** | Daftar pertanyaan taktis siap pakai untuk bernegosiasi |
| 5 | **Chatbot RAG Terpercaya** | AI hanya menjawab dari isi kontrak, selalu sebut nomor pasal, no hallucination |
| 6 | **Ekspor Laporan PDF** | Ringkasan skor risiko + daftar pertanyaan + draf revisi dalam PDF siap cetak |
| 7 | **Hash Caching** | Dokumen identik dianalisis instan tanpa konsumsi API quota ulang |
| 8 | **Multi-LLM Resilience** | Gemini → Gemini Flash-Lite → Groq → Heuristic fallback, tanpa downtime |
| 9 | **Badge Model AI** | Setiap jawaban chatbot menampilkan model yang digunakan (Gemini / Groq / Heuristic) |
| 10 | **4 Contoh Kontrak Nyata** | Sewa Kos, Kerja Magang, Pinjaman Dana, S&K Aplikasi — langsung coba 1 klik |

---

## Tech Stack

### Backend
| Komponen | Teknologi |
|----------|-----------|
| Framework API | **FastAPI** (Python 3.12) |
| ASGI Server | **Uvicorn** |
| PDF Parser | **PyMuPDF (`fitz`)** |
| Clause Segmentation | **Regex** (pola Pasal bahasa Indonesia) |
| LLM Primary | **Google Gemini API** (`gemini-3.8-flash`) |
| LLM Fallback | **Groq API** (`openai/gpt-oss-120b`) |
| Embedding | **Gemini `gemini-embedding-001`** |
| Vector Search / RAG | Normalized cosine similarity (NumPy) |
| Ekspor PDF | **ReportLab** |
| Database & Cache | **SQLite** (persistent, siap migrasi Supabase) |
| Validasi Data | **Pydantic v2** |

### Frontend
| Komponen | Teknologi |
|----------|-----------|
| Framework | **React 19** (Vite SPA) |
| Styling | **Tailwind CSS** (via CDN, custom design tokens) |
| Icon | **Google Material Symbols** |
| Font | **Inter** (Google Fonts) |
| Markdown Renderer | **react-markdown** |
| Build Tool | **Vite 8** |

---

## Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER (React SPA)                   │
│  BerandaView → UnggahView → DashboardView → TanyaView   │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP / JSON
┌────────────────────────▼────────────────────────────────┐
│              FastAPI Backend (:8000)                     │
│                                                          │
│  POST /api/analyze        → AnalyzeEndpoint             │
│  POST /api/analyze/json   → AnalyzeEndpoint (text)      │
│  POST /api/documents/{id}/chat  → ChatEndpoint (RAG)    │
│  GET  /api/documents/{id} → DocumentsEndpoint           │
│  GET  /api/documents/{id}/export → ExportEndpoint (PDF) │
│  GET  /api/samples        → SampleEndpoint              │
└──────┬──────────────┬────────────┬──────────────────────┘
       │              │            │
  ┌────▼────┐   ┌─────▼────┐  ┌───▼────────────────┐
  │ PDF     │   │ Clause   │  │  LLM Service        │
  │ Parser  │   │ Segmenter│  │  Gemini (primary)   │
  │(PyMuPDF)│   │ (Regex)  │  │  Groq   (fallback)  │
  └────┬────┘   └─────┬────┘  │  Heuristic (offline)│
       └──────┬────────┘       └───────────┬─────────┘
         ┌────▼────────────────────────────▼─────┐
         │         SQLite Database                │
         │  documents | clauses | questions | cache│
         └───────────────────────────────────────┘
```

**Alur Analisis Kontrak:**
1. User upload PDF / paste teks → Backend ekstrak teks (`pdf_parser.py`)
2. Teks dipecah per pasal (`clause_segmenter.py`)
3. Hash dokumen diperiksa — jika ada di cache, langsung return hasil
4. Setiap pasal dianalisis oleh LLM Service (Gemini → Groq → Heuristic)
5. Risk Scorer menghitung skor keseluruhan (`risk_scorer.py`)
6. Hasil disimpan ke SQLite, RAG Service mengindeks pasal untuk chatbot
7. Frontend menampilkan Dashboard + Chatbot grounded

---

## Struktur Direktori

```
cekKontrak/
├── .env                          # Konfigurasi API keys (JANGAN di-commit)
├── .gitignore
├── README.md
├── cekkontrak.db                 # SQLite database (auto-generated)
├── PRD-CekKontrak.md             # Product Requirements Document
├── penjelasan-cekkontrak.md      # Penjelasan teknis proyek
│
├── backend/
│   ├── __init__.py
│   ├── requirements.txt          # Dependensi Python
│   ├── sample_contracts/         # File PDF contoh kontrak
│   ├── tests/
│   │   └── test_backend.py       # Unit & integration tests
│   └── app/
│       ├── main.py               # Entry point FastAPI + static file serving
│       ├── core/
│       │   ├── config.py         # Settings & environment variables (Pydantic)
│       │   └── prompts.py        # System prompt LLM (analyze & RAG chat)
│       ├── models/
│       │   └── schemas.py        # Pydantic schemas (request/response models)
│       ├── db/
│       │   └── storage.py        # SQLite setup, CRUD operations, hash cache
│       ├── api/
│       │   ├── router.py         # API router aggregator
│       │   └── endpoints/
│       │       ├── analyze.py    # POST /analyze, /analyze/json
│       │       ├── chat.py       # POST /documents/{id}/chat (RAG)
│       │       ├── documents.py  # GET /documents/{id}
│       │       ├── export.py     # GET /documents/{id}/export (PDF)
│       │       └── sample.py     # GET /samples
│       └── services/
│           ├── pdf_parser.py     # Ekstraksi teks dari PDF (PyMuPDF)
│           ├── clause_segmenter.py # Pemecahan teks per pasal (Regex)
│           ├── llm_service.py    # Analisis pasal via Gemini/Groq/Heuristic
│           ├── rag_service.py    # RAG chatbot + embedding + cosine similarity
│           ├── risk_scorer.py    # Kalkulasi skor risiko dokumen keseluruhan
│           ├── pdf_exporter.py   # Generate laporan PDF (ReportLab)
│           └── sample_contracts.py # Data 4 contoh kontrak bawaan
│
├── frontend/
│   ├── index.html                # Entry HTML + Tailwind CDN + font imports
│   ├── vite.config.js            # Vite config + proxy /api → :8000
│   ├── package.json
│   └── src/
│       ├── main.jsx              # React root render
│       ├── App.jsx               # State management utama + routing antar view
│       ├── index.css             # Base styles, scrollbar, animations
│       └── components/
│           ├── Navbar.jsx        # Navigasi + hamburger menu mobile
│           ├── BerandaView.jsx   # Landing page + hero + cara kerja
│           ├── UnggahView.jsx    # Form upload PDF / paste teks
│           ├── DashboardView.jsx # Hasil analisis risiko per pasal
│           ├── TanyaView.jsx     # Chatbot RAG + panel klausul rujukan
│           ├── HistoryModal.jsx  # Modal riwayat dokumen dari SQLite
│           ├── MarkdownRenderer.jsx # Render markdown di chat bubble
│           ├── DisclaimerBanner.jsx # Banner disclaimer hukum
│           └── Toast.jsx         # Notifikasi feedback (copy, cache, dll)
│
└── .venv/                        # Python virtual environment (auto-generated)
```

---

## Persyaratan Sistem

Pastikan hal berikut sudah terinstal di komputer Anda:

| Kebutuhan | Versi Minimum | Cek dengan |
|-----------|---------------|------------|
| **Python** | 3.10+ | `python --version` atau `py --version` |
| **Node.js** | 18+ | `node --version` |
| **npm** | 9+ | `npm --version` |
| **Git** | (opsional) | `git --version` |

> **Windows**: Pastikan Python bisa diakses via `py` (Python Launcher). Jika belum, download dari [python.org](https://www.python.org/downloads/) dan centang **"Add Python to PATH"** saat instalasi.

---

## Cara Instalasi & Menjalankan (dari Awal)

### Langkah 1 — Clone / Download Proyek

```powershell
# Jika menggunakan Git:
git clone <url-repo> cekKontrak
cd cekKontrak

# Atau ekstrak ZIP, lalu buka terminal di folder cekKontrak
```

---

### Langkah 2 — Buat Python Virtual Environment

```powershell
# Di folder root cekKontrak/
py -m venv .venv
```

Jika perintah `py` tidak ditemukan, coba:
```powershell
python -m venv .venv
# atau
python3 -m venv .venv
```

---

### Langkah 3 — Install Dependensi Backend

```powershell
# Aktifkan virtual environment (Windows PowerShell)
.venv\Scripts\Activate.ps1

# Install semua package Python
pip install -r backend\requirements.txt
```

> **Jika muncul error "Execution Policy"** saat aktivasi venv di PowerShell:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```
> Lalu coba aktifkan ulang.

---

### Langkah 4 — Konfigurasi Environment Variables

Buat file `.env` di folder root (atau edit yang sudah ada):

```powershell
# Salin template
copy .env.example .env    # jika ada
# atau buat manual
notepad .env
```

Isi file `.env` dengan:

```env
# LLM Providers (minimal isi salah satu)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
GEMINI_FALLBACK_MODEL=gemini-3.5-flash-lite

GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b

# Database
DATABASE_PATH=cekkontrak.db

# Batasan file
MAX_FILE_SIZE_MB=10
MAX_PAGES=25
```

**Cara dapat API Key:**
- **Gemini**: [aistudio.google.com](https://aistudio.google.com/) → "Get API Key" (gratis)
- **Groq**: [console.groq.com](https://console.groq.com/) → "API Keys" (gratis, cepat)

> **Catatan**: Jika tidak ada API key sama sekali, sistem tetap berjalan menggunakan **Heuristic Fallback** yang dapat berjalan 100% offline — tanpa koneksi internet.

---

### Langkah 5 — Install Dependensi Frontend

```powershell
# Buka terminal baru (atau navigasi ke folder frontend)
cd frontend
npm install
cd ..
```

---

### Langkah 6 — Build Frontend (Production Bundle)

```powershell
cd frontend
npm run build
cd ..
```

Ini menghasilkan folder `frontend/dist/` yang akan disajikan langsung oleh FastAPI.

---

### Langkah 7 — Jalankan Backend

```powershell
# Di folder root cekKontrak/ (pastikan .venv aktif)
.venv\Scripts\uvicorn.exe backend.app.main:app --reload --port 8000
```

Buka browser di:
- **Aplikasi**: [http://localhost:8000](http://localhost:8000)
- **Swagger API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

### (Opsional) Langkah 7b — Mode Development Frontend

Jika ingin hot-reload saat edit frontend, jalankan Vite dev server di terminal terpisah:

```powershell
cd frontend
npm run dev
```

Buka browser di [http://localhost:5173](http://localhost:5173).

> Proxy `/api` sudah dikonfigurasi di `vite.config.js` untuk forward ke `http://localhost:8000`.

---

### Ringkasan Urutan Perintah (Cepat)

```powershell
# === SETUP PERTAMA KALI (jalankan sekali) ===
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
cd frontend && npm install && npm run build && cd ..

# === JALANKAN SETIAP KALI (hanya ini) ===
.venv\Scripts\uvicorn.exe backend.app.main:app --reload --port 8000
# Buka: http://localhost:8000
```

---

## Konfigurasi Environment Variables

| Variable | Wajib | Default | Keterangan |
|----------|-------|---------|------------|
| `GEMINI_API_KEY` | Opsional* | - | API key Google Gemini (primary LLM) |
| `GEMINI_MODEL` | Tidak | `gemini-3.8-flash` | Nama model Gemini |
| `GEMINI_EMBEDDING_MODEL` | Tidak | `gemini-embedding-001` | Model embedding untuk RAG chatbot |
| `GEMINI_FALLBACK_MODEL` | Tidak | `gemini-3.5-flash-lite` | Model Gemini cadangan saat model utama sibuk/kena limit |
| `LLM_BATCH_SIZE` | Tidak | `15` | Jumlah pasal per 1 request AI (hemat kuota gratis) |
| `GROQ_API_KEY` | Opsional* | - | API key Groq (fallback LLM) |
| `GROQ_MODEL` | Tidak | `openai/gpt-oss-120b` | Nama model Groq |
| `DATABASE_PATH` | Tidak | `cekkontrak.db` | Path file SQLite |
| `MAX_FILE_SIZE_MB` | Tidak | `10` | Batas ukuran PDF (MB) |
| `MAX_PAGES` | Tidak | `25` | Batas halaman PDF |

> \* Minimal isi salah satu. Jika keduanya kosong, sistem otomatis menggunakan Heuristic Fallback.

---

## Menjalankan Tests

Semua modul sudah dilengkapi unit & integration tests:

```powershell
# Dari folder root cekKontrak/
.venv\Scripts\pytest.exe -o pythonpath=. backend\tests\test_backend.py -v
```

Hasil yang diharapkan: **8 passed** ✅

Modul yang ditest:
- `clause_segmenter` — parsing pasal
- `pdf_parser` — ekstraksi teks PDF
- `risk_scorer` — kalkulasi skor risiko
- `llm_service` heuristic fallback
- `rag_service` grounded answer & citation extractor
- API caching (hash deduplication)

---

## Endpoint API

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/analyze` | Upload PDF kontrak untuk dianalisis |
| `POST` | `/api/analyze/json` | Analisis kontrak via teks JSON |
| `GET` | `/api/documents/{doc_id}` | Ambil detail hasil analisis |
| `POST` | `/api/documents/{doc_id}/chat` | Tanya chatbot RAG tentang kontrak |
| `GET` | `/api/documents/{doc_id}/export` | Download laporan PDF |
| `GET` | `/api/samples` | Ambil daftar & teks contoh kontrak bawaan |
| `GET` | `/api/health` | Health check backend |
| `GET` | `/docs` | Swagger UI interaktif (auto-generated) |

---

## Tim Pengembang

| Nama | NIM |
|------|-----|
| Steven Bastian J | C14230203 |
| Victor Thimothi B | C14230245 |

---

> **Disclaimer**: CekKontrak adalah alat bantu pemahaman dokumen berbasis AI dan **bukan merupakan nasihat hukum profesional**. Selalu konsultasikan kontrak penting dengan advokat atau konsultan hukum yang berkualifikasi.
