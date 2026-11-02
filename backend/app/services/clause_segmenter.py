import re
from collections import Counter
from typing import List, Tuple, Optional


class RawClause:
    def __init__(self, number: str, title: Optional[str], content: str, is_fallback: bool = False):
        self.number = number
        self.title = title
        self.content = content.strip()
        self.is_fallback = is_fallback

    def to_dict(self):
        return {
            "number": self.number,
            "title": self.title,
            "content": self.content,
            "is_fallback": self.is_fallback,
        }


class ClauseSegmenter:
    # Primary Indonesian contract regex pattern:
    # Matches: "PASAL 1", "PASAL 1 - IDENTITAS", "Pasal 1 : JANGKA WAKTU", "Pasal 1. Judul"
    PASAL_PATTERN = re.compile(
        r"(?:^|\n)\s*(?:PASAL|Pasal|pasal)\s+([0-9]+|[IVXLCDMivxlcdm]+)"
        r"(?:[\t ]*[:\.\-–][\t ]*|[\t ]+)?([^\n\r\(\)]*)",
        re.MULTILINE
    )

    # Secondary pattern: "BAGIAN 1", "BAB I", "KLAUSUL 1", "ARTICLE 1"
    SECTION_PATTERN = re.compile(
        r"(?:^|\n)\s*(?:BAGIAN|Bagian|BAB|Bab|KLAUSUL|Klausul|ARTICLE|Article)\s+([0-9]+|[IVXLCDMivxlcdm]+)"
        r"(?:[\t ]*[:\.\-–][\t ]*|[\t ]+)?([^\n\r\(\)]*)",
        re.MULTILINE
    )

    # Fallback pattern: Numbered list points at line start, e.g. "1. ", "2. "
    NUMBERED_LIST_PATTERN = re.compile(
        r"(?:^|\n)\s*([0-9]{1,2})[\.\)]\s+([^\n\r]+)",
        re.MULTILINE
    )

    # Pasal lebih panjang dari ini dipecah lagi per subjudul (mis. S&K aplikasi berbahasa Inggris)
    SPLIT_THRESHOLD = 3500
    MIN_SUBSECTION_CHARS = 300

    @classmethod
    def segment(cls, text: str) -> Tuple[List[RawClause], bool]:
        """
        Segments contract text into individual clauses.
        Returns: (list_of_clauses, is_fallback_used)
        """
        clauses, is_fallback = cls._segment_raw(text)
        return cls._postprocess(clauses), is_fallback

    # ------------------------------------------------------------------
    # Pembersihan teks & pasca-proses
    # ------------------------------------------------------------------
    @staticmethod
    def _remove_page_noise(text: str) -> str:
        """
        Buang header/footer halaman yang berulang (mis. tanggal cetak browser, URL + nomor halaman).
        Baris yang muncul >= 3 kali (setelah angka diabaikan) dianggap header/footer.
        """
        lines = text.split("\n")

        def key(line: str) -> str:
            return re.sub(r"\d+", "#", line.strip())

        looks_like_page_marker = re.compile(
            # dicocokkan ke versi baris yang angkanya sudah diganti "#"
            r"https?://|#/#/#|\b(?:page|halaman|hal\.)\s*#", re.IGNORECASE
        )

        counts = Counter(key(l) for l in lines if len(l.strip()) >= 8)
        noisy = {
            k for k, n in counts.items()
            # header/footer yang jelas (URL, tanggal cetak, "Halaman x") cukup muncul 3x;
            # baris biasa harus panjang & muncul >= 5x, agar kalimat kontrak yang kebetulan berulang tidak terbuang
            if (n >= 3 and looks_like_page_marker.search(k)) or (n >= 5 and len(k) >= 25)
        }
        kept = [l for l in lines if not (len(l.strip()) >= 8 and key(l) in noisy)]
        return "\n".join(kept)

    @staticmethod
    def _is_heading_only(content: str) -> bool:
        """Isi pasal hanya berupa judul (mis. baris daftar isi), tanpa kalimat ketentuan."""
        body = content.strip()
        return len(body) < 80 and not re.search(r"[.;:]\s|[.;:]$", body)

    @staticmethod
    def _strip_trailing_menu(content: str) -> str:
        """Buang deretan panjang baris tanpa tanda baca akhir di ujung teks (menu/footer situs web hasil cetak PDF)."""
        lines = content.rstrip().split("\n")
        cut = len(lines)
        run = 0
        for i in range(len(lines) - 1, -1, -1):
            line = lines[i].strip()
            if not line:
                continue  # baris kosong (pemisah halaman) tidak memutus deretan menu
            if len(line) <= 120 and not re.search(r"[.;:!?)\"”]$", line):
                run += 1
                cut = i
            else:
                break
        if run >= 8:
            lines = lines[:cut]
        return "\n".join(lines).strip()

    @staticmethod
    def _is_subheading(lines: List[str], i: int) -> bool:
        line = lines[i].strip()
        words = line.split()
        if not (1 <= len(words) <= 9) or len(line) > 70:
            return False
        if len(words) == 1 and len(line) < 6:
            return False
        if not line[0].isupper() or line.isupper():
            return False
        if re.search(r"[.,;:!?)\"”]$", line):
            return False
        prev = lines[i - 1].strip() if i > 0 else ""
        nxt = lines[i + 1].strip() if i + 1 < len(lines) else ""
        prev_ok = (not prev) or bool(re.search(r"[.;:!?)\"”]$", prev))
        return prev_ok and len(nxt) > 0 and nxt[0].isupper()

    @classmethod
    def _split_long(cls, clause: RawClause) -> List[RawClause]:
        if len(clause.content) <= cls.SPLIT_THRESHOLD:
            return [clause]
        lines = clause.content.split("\n")
        chunks: List[Tuple[Optional[str], List[str]]] = [(clause.title, [])]
        for i, line in enumerate(lines):
            if i > 1 and cls._is_subheading(lines, i):
                chunks.append((line.strip(), [line]))
            else:
                chunks[-1][1].append(line)

        # Gabungkan potongan yang terlalu pendek ke potongan berikutnya
        merged: List[Tuple[Optional[str], str]] = []
        carry_title, carry = None, ""
        for title, body_lines in chunks:
            body = "\n".join(body_lines).strip()
            if carry:
                body = (carry + "\n" + body).strip()
                title = carry_title or title
            if len(body) < cls.MIN_SUBSECTION_CHARS:
                carry_title, carry = title, body
                continue
            merged.append((title, body))
            carry_title, carry = None, ""
        if carry:
            if merged:
                t, b = merged[-1]
                merged[-1] = (t, b + "\n" + carry)
            else:
                merged.append((carry_title, carry))

        if len(merged) <= 1:
            return [clause]
        return [
            RawClause(number=f"{clause.number}.{k}", title=title, content=body, is_fallback=clause.is_fallback)
            for k, (title, body) in enumerate(merged, start=1)
        ]

    @classmethod
    def _postprocess(cls, clauses: List[RawClause]) -> List[RawClause]:
        # 1. Buang entri yang hanya judul (daftar isi), selama masih tersisa >= 2 pasal
        substantive = [c for c in clauses if not cls._is_heading_only(c.content)]
        if len(substantive) >= 2:
            clauses = substantive

        # 2. Bersihkan menu/footer di akhir & pecah pasal yang sangat panjang
        result: List[RawClause] = []
        for c in clauses:
            c.content = cls._strip_trailing_menu(c.content)
            result.extend(cls._split_long(c))

        # 3. Pastikan nomor pasal unik (dipakai sebagai ID di UI & rujukan chat)
        seen: Counter = Counter()
        for c in result:
            seen[c.number] += 1
            if seen[c.number] > 1:
                c.number = f"{c.number} ({seen[c.number]})"
        return result

    @classmethod
    def _segment_raw(cls, text: str) -> Tuple[List[RawClause], bool]:
        cleaned_text = text.replace("\r\n", "\n").replace("\r", "\n")
        cleaned_text = cls._remove_page_noise(cleaned_text)
        
        # 1. Try standard "Pasal" pattern
        clauses = cls._segment_with_pattern(cleaned_text, cls.PASAL_PATTERN)
        if len(clauses) >= 2:
            return clauses, False

        # 2. Try section / bab pattern
        clauses = cls._segment_with_pattern(cleaned_text, cls.SECTION_PATTERN)
        if len(clauses) >= 2:
            return clauses, False

        # 3. Fallback: try numbered list points (FR-08)
        clauses = cls._segment_numbered_list(cleaned_text)
        if len(clauses) >= 2:
            return clauses, True

        # 4. Final Fallback: split by double newlines into logical blocks
        clauses = cls._segment_paragraphs(cleaned_text)
        return clauses, True

    @classmethod
    def _segment_with_pattern(cls, text: str, pattern: re.Pattern) -> List[RawClause]:
        matches = list(pattern.finditer(text))
        if not matches:
            return []

        clauses: List[RawClause] = []

        for i in range(len(matches)):
            match = matches[i]
            num = match.group(1).strip()
            raw_title = match.group(2).strip() if match.group(2) else None
            
            # Clean title
            title = None
            if raw_title:
                cleaned_title = raw_title.lstrip(":-–. ").rstrip(":-–. ")
                if len(cleaned_title) > 0 and len(cleaned_title) < 100:
                    title = cleaned_title

            start_idx = match.end()
            end_idx = matches[i + 1].start() if i + 1 < len(matches) else len(text)

            content = text[start_idx:end_idx].strip()
            
            # Clean leading punctuation from content
            if content.startswith(":") or content.startswith("-"):
                content = content.lstrip(":-–. ").strip()

            clauses.append(RawClause(
                number=f"{num}",
                title=title,
                content=content,
                is_fallback=False
            ))

        return clauses

    @classmethod
    def _segment_numbered_list(cls, text: str) -> List[RawClause]:
        matches = list(cls.NUMBERED_LIST_PATTERN.finditer(text))
        if len(matches) < 2:
            return []

        clauses: List[RawClause] = []
        for i in range(len(matches)):
            match = matches[i]
            num = match.group(1).strip()
            first_line = match.group(2).strip()

            start_idx = match.end()
            end_idx = matches[i + 1].start() if i + 1 < len(matches) else len(text)

            rest_of_clause = text[start_idx:end_idx].strip()
            full_content = f"{first_line}\n{rest_of_clause}".strip()

            clauses.append(RawClause(
                number=f"Poin {num}",
                title=None,
                content=full_content,
                is_fallback=True
            ))

        return clauses

    @classmethod
    def _segment_paragraphs(cls, text: str) -> List[RawClause]:
        paragraphs = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 30]
        if not paragraphs:
            paragraphs = [text.strip()]

        clauses: List[RawClause] = []
        for idx, p in enumerate(paragraphs, start=1):
            clauses.append(RawClause(
                number=f"Bagian {idx}",
                title=None,
                content=p,
                is_fallback=True
            ))
        return clauses
