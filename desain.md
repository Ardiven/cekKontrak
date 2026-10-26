# Desain Sistem UI/UX — CekKontrak

Dokumen ini mendeskripsikan keputusan desain, token, komponen, dan pola interaksi yang digunakan dalam antarmuka web CekKontrak. Tujuannya adalah menjadi referensi tunggal agar desain tetap konsisten saat pengembangan berlanjut.

---

## Daftar Isi

1. [Filosofi Desain](#filosofi-desain)
2. [Design Tokens — Warna](#design-tokens--warna)
3. [Design Tokens — Tipografi](#design-tokens--tipografi)
4. [Design Tokens — Spacing & Border Radius](#design-tokens--spacing--border-radius)
5. [Komponen Global](#komponen-global)
6. [Layout & Responsivitas](#layout--responsivitas)
7. [Halaman & View](#halaman--view)
8. [Pola Interaksi](#pola-interaksi)
9. [Animasi & Micro-interaction](#animasi--micro-interaction)
10. [Aksesibilitas](#aksesibilitas)

---

## Filosofi Desain

CekKontrak adalah alat hukum publik. Desainnya harus menyeimbangkan **keterpercayaan** (legal-tech feel) dengan **keramahan** (tidak intimidatif bagi awam).

| Prinsip | Implementasi |
|---------|-------------|
| **Clarity first** | Hierarki visual jelas — skor risiko besar, penjelasan di bawahnya |
| **Color-coded risk** | Merah / Kuning / Hijau konsisten di seluruh UI — tidak ambigu |
| **Grounded trust** | Setiap jawaban AI selalu menyertakan nomor pasal sebagai anchor |
| **Progressive disclosure** | Info penting tampil dulu, detail tersembunyi di expandable/modal |
| **Mobile-first** | Layout dirancang dari layar 375px, scale up ke desktop |
| **Tidak menakutkan** | Bahasa UI santai, ikon ramah, bukan formal legalistik |

---

## Design Tokens — Warna

Sistem warna mengikuti **Material You 3 color scheme** yang dikustomisasi dengan aksen Legal-Tech. Semua token didefinisikan di [`frontend/index.html`](file:///c:/Users/Victo/PycharmProjects/PythonProject/cekKontrak/frontend/index.html) via Tailwind config.

### Warna Utama (Primary Palette)

| Token | Hex | Penggunaan |
|-------|-----|-----------|
| `secondary` | `#006a61` | Warna aksen utama — CTA button, icon highlight, active state |
| `on-secondary` | `#ffffff` | Teks/icon di atas secondary |
| `on-secondary-fixed-variant` | `#005049` | Hover state button secondary (lebih gelap) |
| `secondary-container` | `#86f2e4` | Background chip/badge teal muda |
| `secondary-fixed` | `#89f5e7` | Background surface teal sangat muda |
| `secondary-fixed-dim` | `#6bd8cb` | Versi lebih redup secondary-fixed |

> **Catatan warna aksen**: Dipilih teal (`#006a61`) karena secara psikologi mewakili kepercayaan dan kehati-hatian — cocok untuk legal-tech. Bukan biru korporat yang terlalu dingin, bukan hijau yang terlalu santai.

### Warna Permukaan (Surface Palette)

| Token | Hex | Penggunaan |
|-------|-----|-----------|
| `surface` / `background` | `#f8f9ff` | Background halaman utama (biru-putih sangat muda) |
| `on-surface` | `#0b1c30` | Warna teks utama (navy gelap, bukan hitam penuh) |
| `surface-container-lowest` | `#ffffff` | Card putih bersih |
| `surface-container-low` | `#eff4ff` | Background section alternatif |
| `surface-container` | `#e5eeff` | Surface medium |
| `surface-container-high` | `#dce9ff` | Surface agak lebih berat |
| `surface-variant` | `#d3e4fe` | Divider, border halus |

### Warna Semantik Risiko

Ini adalah warna paling kritis — konsistensinya wajib dijaga di seluruh UI.

| Level Risiko | Warna | Token Tailwind | Hex |
|---|---|---|---|
| 🔴 **Merah** (Risiko Tinggi) | Rose | `rose-500` / `rose-600` | `#f43f5e` |
| — Background | — | `rose-50` | `#fff1f2` |
| — Border | — | `rose-200` | `#fecdd3` |
| — Teks | — | `rose-700` / `rose-800` | `#be123c` |
| 🟡 **Kuning** (Perlu Teliti) | Amber | `amber-500` / `amber-600` | `#f59e0b` |
| — Background | — | `amber-50` | `#fffbeb` |
| — Border | — | `amber-200` | `#fde68a` |
| — Teks | — | `amber-700` / `amber-800` | `#b45309` |
| 🟢 **Hijau** (Aman & Wajar) | Emerald | `emerald-500` / `emerald-600` | `#10b981` |
| — Background | — | `emerald-50` | `#ecfdf5` |
| — Border | — | `emerald-200` | `#a7f3d0` |
| — Teks | — | `emerald-700` / `emerald-800` | `#047857` |

### Warna Badge Model AI

Digunakan di chat bubble untuk identitas LLM yang menjawab.

| Model | Warna | Class |
|-------|-------|-------|
| Gemini | Biru muda | `bg-blue-50 text-blue-700 border-blue-200` |
| Groq / Llama | Oranye muda | `bg-orange-50 text-orange-700 border-orange-200` |
| Heuristic (offline) | Abu-abu | `bg-slate-100 text-slate-600 border-slate-200` |

### Warna Netral (Slate Palette)

Seluruh border, divider, teks sekunder, dan background card menggunakan skala `slate-*` dari Tailwind:

```
slate-50  (#f8fafc) → Background card
slate-100 (#f1f5f9) → Active nav, hover background
slate-200 (#e2e8f0) → Border card, divider
slate-300 (#cbd5e1) → Border input
slate-400 (#94a3b8) → Teks sangat muted
slate-500 (#64748b) → Teks muted, label
slate-600 (#475569) → Teks sekunder
slate-700 (#334155) → Teks semi-strong
slate-800 (#1e293b) → Teks kuat
slate-900 (#0f172a) → Teks utama gelap, button dark
```

---

## Design Tokens — Tipografi

Seluruh teks menggunakan **Inter** (Google Fonts), weight 400–800. Token tipografi menggunakan format `font-{role}` yang didefinisikan di Tailwind config.

### Type Scale

| Token | Size | Line Height | Letter Spacing | Weight | Penggunaan |
|-------|------|-------------|----------------|--------|-----------|
| `headline-xl` | 36px | 44px | −0.025em | 700 | Heading utama halaman (H1 hero) |
| `headline-xl-mobile` | 28px | 36px | −0.020em | 700 | H1 di mobile |
| `headline-lg` | 28px | 30px | −0.020em | 600 | Section heading (H2) |
| `headline-lg-mobile` | 22px | 30px | −0.015em | 600 | Section H2 di mobile |
| `headline-md` | 20px | 28px | −0.015em | 600 | Card heading, score number |
| `title-sm` | 16px | 24px | −0.010em | 600 | Sub-heading, list item title |
| `body-legal` | 15px | 26px | 0em | 400 | Teks isi pasal kontrak (readability tinggi) |
| `body-default` | 14px | 22px | 0em | 400 | Body teks umum |
| `body-sm` | 13px | 18px | 0em | 400 | Teks penjelasan sekunder |
| `label-md` | 12px | 16px | +0.04em | 600 | Label button, badge, nav link |
| `label-sm` | 11px | 14px | +0.05em | 500 | Micro-label, caption, tag |

> **Kenapa Inter?** Inter dirancang khusus untuk layar digital dengan legibilitas tinggi di ukuran kecil. Angkanya tabular sehingga skor risiko (angka) tampak rapi.

### Penggunaan Teks Khusus

- **Teks pasal kontrak** (`body-legal`, 15px, line-height 26px): Sengaja lebih besar dan longgar dari body biasa karena teks hukum memerlukan kenyamanan membaca lebih tinggi.
- **Skor risiko** (font-extrabold, `headline-xl`): Skor besar dan bold agar langsung "terbaca" tanpa perlu baca dulu.
- **Label uppercase**: Digunakan untuk kategori dan section label dengan `tracking-wider` untuk keterbacaan.

---

## Design Tokens — Spacing & Border Radius

### Spacing Custom

Token spacing tambahan (selain default Tailwind):

| Token | Value | Penggunaan |
|-------|-------|-----------|
| `space-xs` | 4px | Gap sangat kecil |
| `space-sm` | 8px | Gap kecil |
| `space-md` | 16px | Padding/gap standar |
| `space-lg` | 24px | Padding card |
| `space-xl` | 40px | Jarak antar section |
| `gutter` | 24px | Gutter grid desktop |
| `gutter-mobile` | 16px | Gutter grid mobile |
| `margin` | 32px | Margin section desktop |
| `margin-mobile` | 16px | Margin section mobile |

### Border Radius

Semua komponen menggunakan radius yang konsisten:

| Token | Value | Digunakan pada |
|-------|-------|---------------|
| `rounded-full` | 9999px | Chip/badge, avatar, progress indicator |
| `rounded-2xl` | 16px (default Tailwind) | Card utama, panel besar |
| `rounded-xl` | 12px | Sub-card, input, button |
| `rounded-lg` | 8px | Badge kecil, tooltip |
| `rounded-md` | 6px | Inline tag, citation pill |
| `rounded` | 4px | Teks highlight, kode inline |

---

## Komponen Global

### 1. Navbar

**File**: [`Navbar.jsx`](file:///c:/Users/Victo/PycharmProjects/PythonProject/cekKontrak/frontend/src/components/Navbar.jsx)

```
┌─────────────────────────────────────────────────────────┐
│ [⚖ CekKontrak]  Beranda  Unggah  Analisis  Tanya AI    │
│  AI Risk Analyzer                    [API] [Analisis ▶] │
└─────────────────────────────────────────────────────────┘
```

- **Fixed top**, `z-50`, `backdrop-blur-xl` dengan `bg-white/95`
- Border bottom subtle (`border-slate-200/80`) + shadow sangat tipis
- **Desktop**: Logo + nav links + action buttons inline
- **Mobile**: Logo + ikon riwayat + hamburger menu
- Hamburger membuka **dropdown full-width** dengan icon per link
- Active state: `bg-slate-100` + font-semibold (bukan underline)
- Logo menggunakan ikon `gavel` (Material Symbols) dengan background `secondary`

### 2. DisclaimerBanner

**File**: [`DisclaimerBanner.jsx`](file:///c:/Users/Victo/PycharmProjects/PythonProject/cekKontrak/frontend/src/components/DisclaimerBanner.jsx)

Banner tipis di bawah Navbar yang mengingatkan bahwa CekKontrak bukan nasihat hukum resmi. Desain minimalis agar tidak mengganggu konten utama.

### 3. Toast Notification

**File**: [`Toast.jsx`](file:///c:/Users/Victo/PycharmProjects/PythonProject/cekKontrak/frontend/src/components/Toast.jsx)

- Muncul di sudut bawah layar, auto-dismiss setelah 3.2 detik
- Digunakan untuk: copy sukses ✓, analisis selesai, cache loaded ⚡

### 4. HistoryModal

**File**: [`HistoryModal.jsx`](file:///c:/Users/Victo/PycharmProjects/PythonProject/cekKontrak/frontend/src/components/HistoryModal.jsx)

Modal overlay untuk menampilkan daftar dokumen yang pernah dianalisis (dari SQLite). Klik salah satu untuk membuka ulang hasil analisis.

### 5. MarkdownRenderer

**File**: [`MarkdownRenderer.jsx`](file:///c:/Users/Victo/PycharmProjects/PythonProject/cekKontrak/frontend/src/components/MarkdownRenderer.jsx)

Komponen wrapper `react-markdown` dengan custom styling:
- `**bold**` → `font-bold text-slate-900`
- `*italic*` → `italic text-slate-700`
- Bullet list → dot teal `bg-secondary` kecil
- Inline code → `bg-slate-200/80 font-mono text-[11px]`
- Blockquote → `border-l-4 border-secondary italic`

---

## Layout & Responsivitas

### Grid System

Layout menggunakan **CSS Grid Tailwind** dengan breakpoint:

| Breakpoint | Min Width | Alias |
|-----------|-----------|-------|
| Default | 0px | Mobile (≤639px) |
| `sm:` | 640px | Small tablet |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Wide desktop |

### Container

```css
max-w-7xl mx-auto px-3 sm:px-5 lg:px-8
```

Lebar maksimum `1280px`, padding responsif dari 12px (mobile) ke 32px (desktop).

### Layout Per View

| View | Mobile | Tablet (md) | Desktop (lg/xl) |
|------|--------|-------------|-----------------|
| **Beranda** | 1 kolom | 1 kolom | 2 kolom (50/50) |
| **Unggah** | 1 kolom | 1 kolom | 2 kolom (8/4) |
| **Dashboard** | 1 kolom | 1 kolom | 2 kolom (4/8) untuk metric |
| **Tanya AI** | 1 kolom (panel toggle) | 1 kolom | 2 kolom (8/4) |

### Navbar Responsif

```
Desktop (md+):    [Logo] [Nav Links........] [API] [CTA Button]
Mobile (<md):     [Logo] [Riwayat ikon] [Hamburger ☰]
                  ↓ dropdown saat hamburger diklik
                  [Beranda][Unggah][Analisis][Tanya AI][CTA]
```

### Chat Panel TanyaView (Mobile)

Di mobile, panel "Klausul yang Dirujuk" tersembunyi secara default. Saat AI menjawab dengan citation, muncul tombol toggle `[📖 Pasal X]` di header untuk membuka panel tersebut.

---

## Halaman & View

### View 1: Beranda (`BerandaView`)

**Tujuan**: Landing page — meyakinkan user untuk mencoba.

```
┌──────────────────────────────────────────────────────┐
│ [Badge: AI Pendamping Hukum]                         │
│                                                      │
│ H1: Jangan Tanda Tangan...    │  [Preview Card]     │
│ Deskripsi singkat             │  Contoh hasil       │
│                               │  analisis kontrak   │
│ [CTA: Mulai Analisis Gratis]  │  (Risk score 75,    │
│ [Lihat Cara Kerja]            │   distribusi pasal, │
│                               │   klausul berisiko) │
│ [Contoh kontrak 1-klik x4]    │                     │
│ [Badge: ID] [Badge: Cepat] [Badge: Tanpa Login]     │
├──────────────────────────────────────────────────────┤
│              HOW IT WORKS SECTION                    │
│  [Step 1] → [Step 2] → [Step 3]                     │
│  Unggah    Analisis    Tanya AI                      │
└──────────────────────────────────────────────────────┘
```

**Elemen kunci**:
- Hero dengan **asymmetric preview card** di kanan (menampilkan contoh hasil nyata)
- Ambient blur orbs di background (`blur-3xl`, opacity rendah)
- Preview card statis yang mensimulasikan tampilan hasil analisis

---

### View 2: Unggah Kontrak (`UnggahView`)

**Tujuan**: Form input dokumen — PDF atau teks langsung.

```
┌─────────────────────────────┬──────────────────────┐
│  FORM AREA (8/12)           │  QUICK SAMPLES (4/12)│
│                             │                      │
│  [Tab: PDF] [Tab: Teks]     │  🏠 Sewa Kos         │
│                             │  💼 Kerja Magang      │
│  ┌─ Dropzone ─────────────┐ │  💳 Pinjaman Dana    │
│  │  ↑ Drag & Drop PDF     │ │  📱 S&K Aplikasi     │
│  │  atau klik pilih file  │ │                      │
│  └────────────────────────┘ │                      │
│                             │                      │
│  [Input: Judul] [Select: Tipe Kontrak]             │
│                                                    │
│                        [MULAI ANALISIS →]          │
└────────────────────────────────────────────────────┘
```

**Elemen kunci**:
- **Tab switcher** PDF / Teks — pill style dengan background aktif putih
- **Dropzone** dengan hover state (`bg-teal-50/50`, border teal dashed)
- File selected state: card info dengan nama file + tombol "Ganti File"
- Contoh cepat di kanan: direct-load tanpa perlu upload manual

---

### View 3: Dashboard Analisis (`DashboardView`)

**Tujuan**: Hasil analisis lengkap — skor, ringkasan, semua pasal.

```
┌─────────────────────────────────────────────────────┐
│  [Tipe Kontrak] • Dianalisis: 2024-01-01 • 7 Pasal │
│  H1: Judul Kontrak                                  │
│  [Ekspor PDF] [Tanya AI] [Kontrak Lain]             │
├──────────────────┬──────────────────────────────────┤
│  SKOR (4/12)     │  KESIMPULAN AI (8/12)            │
│                  │                                  │
│  75 / 100        │  "Berdasarkan analisis AI,       │
│  ████████░░      │   kontrak ini memiliki..."       │
│  Rentan Sengketa │                                  │
│                  │  [🔴 2 Pasal] [🟡 2 Pasal] [🟢 3 Pasal] │
├──────────────────┴──────────────────────────────────┤
│  FILTER: [Semua] [🔴 Berisiko] [🟡 Perlu Teliti]   │
│          [🟢 Aman] [Pertanyaan Negosiasi]           │
├─────────────────────────────────────────────────────┤
│  CLAUSE CARD (border-left color-coded)              │
│  ┌── Pasal 3 • Uang Jaminan │ [KLAUSUL BERISIKO] ──┐│
│  │  "Teks asli pasal..."                           ││
│  │  [Alasan Risiko] │ [Maksud Bahasa Awam]         ││
│  │  [Usulan Revisi Lebih Adil...] [Salin Revisi]   ││
│  └──────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

**Elemen kunci**:
- **Bento metric layout**: skor di kiri, AI summary + 3 metric card di kanan
- **Left border ribbon** pada clause card (4px solid, warna = level risiko)
- **Filter tabs** bisa scroll horizontal di mobile
- **2-kolom penjelasan**: Alasan risiko | Maksud bahasa awam (side by side di md+)

---

### View 4: Tanya AI (RAG Chatbot) (`TanyaView`)

**Tujuan**: Chat grounded — tanya apapun tentang isi kontrak.

```
┌────────────────────────────────────────────────────┐
│  [🤖 CekKontrak AI] [RAG Grounded] • Judul Kontrak│
│  [Kembali ke Analisis]                             │
├────────────────────────────┬───────────────────────┤
│  CHAT STREAM (8/12)        │  CLAUSE INSPECTOR(4/12)│
│                            │                        │
│  [Validasi grounded badge] │  📖 Klausul Dirujuk   │
│                            │                        │
│  CekKontrak AI             │  Pasal 4               │
│  ✦ Gemini 2.5 Flash        │  [MERAH]               │
│  [Pasal 4]                 │                        │
│  "Berdasarkan Pasal 4..."  │  "Teks asli pasal..."  │
│                            │                        │
│  ─────────────────────     │  Maksud Bahasa Awam:   │
│  User: "Berapa dendanya?"  │  "..."                 │
│                            │                        │
│  [Contoh: Berapa denda?...]│  [Lihat di Dashboard]  │
│ ┌─────────────────────────┐│                        │
│ │ Tanyakan tentang isi... ││                        │
│ └─────────────────────────┘│                        │
└────────────────────────────┴───────────────────────┘
```

**Elemen kunci**:
- **Chat bubble**: user = `bg-slate-900` (dark), AI = `bg-slate-50` (light)
- **Badge model**: `✦ Gemini 2.5 Flash` / `⚡ Llama 3.3 70B (Groq)` / `⚙️ Heuristic`
- **Citation pill**: `[Pasal X]` clickable → highlight ke clause inspector
- **Clause Inspector panel**: panel kanan, tersembunyi di mobile, toggle saat ada citation
- AI message dirender dengan **MarkdownRenderer** (bold, list, italic)
- Quick prompts bar: 4 contoh pertanyaan yang bisa diklik langsung

---

## Pola Interaksi

### State & Navigation

App menggunakan **single-page, view-based routing** di `App.jsx` tanpa React Router. State `view` mengontrol komponen mana yang dirender:

```
'beranda' → BerandaView
'unggah'  → UnggahView
'dashboard' → DashboardView (butuh currentDoc)
'tanya'   → TanyaView (butuh currentDoc)
```

### Loading State

Saat analisis berjalan (`isLoading = true`):
- Tombol submit disabled + spinner `progress_activity` + teks "Menganalisis Pasal..."
- Material Symbol `progress_activity` dengan class `animate-spin`

### Feedback Pattern

| Aksi | Feedback |
|------|---------|
| Salin teks | Toast: "Teks berhasil disalin ke clipboard! ✓" |
| Analisis selesai | Toast: "Analisis kontrak selesai berhasil!" |
| Load dari cache | Toast: "Hasil instan dimuat dari Cache Hash! ⚡" |
| Buka dokumen riwayat | Toast: `Dokumen "${title}" berhasil dibuka.` |

### Risk Level Badge Pattern

Setiap level risiko memiliki pola visual yang **identik dan konsisten** di semua tempat:

```jsx
// Merah
bg-rose-100 text-rose-800     → badge chip
border-l-4 border-rose-500   → clause card ribbon
bg-rose-50/70 border-rose-200 → metric card background

// Kuning
bg-amber-100 text-amber-800
border-l-4 border-amber-500
bg-amber-50/70 border-amber-200

// Hijau
bg-emerald-100 text-emerald-800
border-l-4 border-emerald-500
bg-emerald-50/70 border-emerald-200
```

---

## Animasi & Micro-interaction

### Animasi yang Digunakan

| Animasi | Trigger | Implementasi |
|---------|---------|-------------|
| `animate-pulse` | Dot status aktif (beranda, chat) | Tailwind built-in |
| `animate-spin` | Loading spinner analisis / chat | Tailwind built-in |
| `animate-pulse-glow` | Ikon khusus accent | Custom keyframe di `index.css` |
| Scale hover | Button, card, logo | `hover:scale-105`, `active:scale-[0.98]` |
| Transition color | Nav active, border hover | `transition-all`, `transition-colors` |
| Smooth scroll | Highlight clause card | `scrollIntoView({ behavior: 'smooth' })` |
| Height transition | Progress bar gauge | `transition-all duration-500` |

### Custom Keyframe

```css
/* index.css */
@keyframes pulseGlow {
  0%   { transform: scale(0.95); opacity: 0.8; }
  50%  { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}
.animate-pulse-glow {
  animation: pulseGlow 2s infinite ease-in-out;
}
```

### Hover Pattern Konsisten

```
Button utama (CTA):  shadow-md → shadow-lg + warna lebih gelap
Card list:           border-slate-200 → border-teal-400
Nav link:            transparent → bg-slate-50
Input/select focus:  border-slate-300 → border-secondary + ring-2 ring-secondary/20
```

---

## Aksesibilitas

| Aspek | Implementasi |
|-------|-------------|
| Semantic HTML | `<header>`, `<main>`, `<nav>`, `<form>`, `<button type="button">` |
| Keyboard navigation | Semua elemen interaktif pakai `<button>` atau `<a>`, bukan `<div>` |
| Focus visible | Default browser focus ring (tidak di-reset) |
| ARIA labels | `aria-label` pada icon-only button (hamburger, close) |
| Language | `<html lang="id">` untuk screen reader Indonesia |
| Color contrast | Warna teks utama `#0b1c30` di atas `#f8f9ff` — rasio >7:1 (AAA) |
| Responsive text | Font tidak di-lock px absolut untuk heading — bisa scale |
| Anti-overflow | `overflow-x: hidden` di body, `min-w-0` pada flex children |

---

## Panduan Implementasi Baru

Saat menambahkan komponen atau halaman baru, ikuti checklist berikut:

- [ ] Gunakan warna dari token yang sudah ada (jangan hardcode hex baru)
- [ ] Gunakan `font-{role}` untuk semua teks (bukan class Tailwind `text-sm` langsung untuk heading)
- [ ] Semua border-radius menggunakan `rounded-xl` (card) atau `rounded-lg` (elemen kecil)
- [ ] Warna risiko mengikuti pola merah/kuning/hijau yang sudah ada
- [ ] Responsive: mulai dari layout 1 kolom, tambahkan `md:` / `lg:` grid jika perlu
- [ ] Setiap aksi user berikan feedback (Toast, loading state, disabled state)
- [ ] Teks pasal / legal content gunakan `font-body-legal` (15px, line-height 26px)
- [ ] Button interaktif selalu punya `active:scale-[0.98]` dan `cursor-pointer`
- [ ] Icon menggunakan **Google Material Symbols Outlined** (bukan emoji untuk UI resmi)
