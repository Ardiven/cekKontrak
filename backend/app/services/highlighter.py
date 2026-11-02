"""
Mencari posisi kutipan berisiko (dari LLM) di dalam teks asli pasal.

LLM diminta menyalin kalimat/frasa PERSIS dari teks pasal, tetapi teks hasil PDF sering
terpotong baris ("THIRD-\nPARTY") atau beda spasi. Karena itu pencocokan dilakukan dengan
mengabaikan spasi/baris baru dan huruf besar-kecil, lalu posisinya dipetakan kembali ke teks asli.
Kutipan yang tidak ditemukan dibuang, sehingga sorotan di UI selalu menunjuk teks yang benar-benar ada.
"""
from typing import Any, Dict, List, Optional, Tuple

MAX_HIGHLIGHTS = 3


def _squash(text: str) -> Tuple[str, List[int]]:
    """Hapus semua whitespace & jadikan huruf kecil; simpan peta indeks ke teks asli."""
    chars: List[str] = []
    index_map: List[int] = []
    for i, ch in enumerate(text):
        if ch.isspace():
            continue
        chars.append(ch.lower())
        index_map.append(i)
    return "".join(chars), index_map


def _normalize_quotes(text: str) -> str:
    return (text.replace("“", '"').replace("”", '"').replace("‘", "'").replace("’", "'"))


def find_span(content: str, quote: str) -> Optional[Tuple[int, int]]:
    if not quote or not quote.strip():
        return None
    quote = quote.strip().strip('"').strip()
    for q in (quote, quote.rstrip(".;,")):
        idx = content.find(q)
        if idx >= 0:
            return idx, idx + len(q)

    hay, index_map = _squash(_normalize_quotes(content))
    needle, _ = _squash(_normalize_quotes(quote.rstrip(".;,")))
    if len(needle) < 8:
        return None  # terlalu pendek, rawan salah tempat
    pos = hay.find(needle)
    if pos < 0:
        return None
    return index_map[pos], index_map[pos + len(needle) - 1] + 1


def locate_highlights(content: str, raw_items: Any, level: str) -> List[Dict[str, Any]]:
    """Ubah daftar {'kutipan', 'keterangan'} dari LLM menjadi sorotan dengan posisi start/end yang valid."""
    if level == "hijau" or not isinstance(raw_items, list):
        return []
    spans: List[Dict[str, Any]] = []
    for item in raw_items:
        if not isinstance(item, dict):
            continue
        span = find_span(content, str(item.get("kutipan") or ""))
        if not span:
            continue
        start, end = span
        if any(start < s["end"] and end > s["start"] for s in spans):
            continue  # buang yang tumpang tindih
        spans.append({
            "start": start,
            "end": end,
            "kutipan": content[start:end],
            "keterangan": str(item.get("keterangan") or "").strip(),
        })
        if len(spans) >= MAX_HIGHLIGHTS:
            break
    spans.sort(key=lambda s: s["start"])
    return spans
