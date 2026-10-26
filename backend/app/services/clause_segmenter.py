import re
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

    @classmethod
    def segment(cls, text: str) -> Tuple[List[RawClause], bool]:
        """
        Segments contract text into individual clauses.
        Returns: (list_of_clauses, is_fallback_used)
        """
        cleaned_text = text.replace("\r\n", "\n").replace("\r", "\n")
        
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
