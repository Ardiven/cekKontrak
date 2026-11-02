from typing import List, Dict, Tuple
from backend.app.models.schemas import ClauseAnalysis, RiskLevel, QuestionItem


class RiskScorer:
    @staticmethod
    def calculate_score(clauses: List[ClauseAnalysis]) -> Tuple[int, str, str, Dict[str, int]]:
        """
        Calculates overall risk score (0-100), risk grade, summary text, and counts.
        """
        if not clauses:
            return 0, "Rendah", "Dokumen tidak memiliki pasal yang dapat dinilai.", {"merah": 0, "kuning": 0, "hijau": 0}

        counts = {"merah": 0, "kuning": 0, "hijau": 0}
        for c in clauses:
            if c.level == RiskLevel.MERAH:
                counts["merah"] += 1
            elif c.level == RiskLevel.KUNING:
                counts["kuning"] += 1
            else:
                counts["hijau"] += 1

        total = len(clauses)
        red_cnt = counts["merah"]
        yellow_cnt = counts["kuning"]
        green_cnt = counts["hijau"]

        # Base calculation:
        # High impact for red clauses (each red heavily affects overall score)
        raw_score = (red_cnt * 25) + (yellow_cnt * 10) + (green_cnt * 2)
        # Normalize relative to document length but ensure red clauses have strong weight
        normalized = int((raw_score / (total * 25)) * 100)
        
        # Override rules to match real-world legal risk perception:
        if red_cnt >= 2:
            score = max(75, normalized)
        elif red_cnt == 1:
            score = max(55, normalized)
        elif yellow_cnt >= 2:
            score = max(40, normalized)
        else:
            score = min(25, normalized)

        score = max(5, min(100, score))

        if score >= 65:
            risk_label = "Tinggi (Berisiko)"
            summary = (
                f"Terdapat {red_cnt} pasal berisiko tinggi yang berpotensi sangat merugikan posisi Anda "
                "(seperti denda tidak wajar, hak sepihak, atau penahanan dana). "
                "Sangat disarankan untuk tidak menandatangani sebelum melakukan negosiasi atau meminta revisi."
            )
        elif score >= 35:
            risk_label = "Sedang (Perlu Perhatian)"
            parts = []
            if red_cnt:
                parts.append(f"{red_cnt} pasal berisiko tinggi")
            if yellow_cnt:
                parts.append(f"{yellow_cnt} pasal yang ambigu atau perlu klarifikasi")
            summary = (
                f"Ditemukan {' dan '.join(parts) or 'beberapa pasal yang perlu diperhatikan'}. "
                "Pastikan Anda mengajukan pertanyaan dan meminta batasan yang jelas sebelum sepakat."
            )
        else:
            risk_label = "Rendah (Aman & Wajar)"
            summary = (
                "Sebagian besar pasal dalam dokumen ini tergolong standar dan seimbang bagi kedua pihak. "
                "Tetap baca secara teliti poin-poin hak dan kewajiban umum."
            )

        return score, risk_label, summary, counts


class QuestionGenerator:
    @staticmethod
    def generate_questions(clauses: List[ClauseAnalysis]) -> List[QuestionItem]:
        """
        Derives critical questions to ask before signing from red and yellow clauses.
        """
        questions: List[QuestionItem] = []
        q_idx = 1

        for c in clauses:
            if c.level == RiskLevel.MERAH:
                text_lower = (c.isi + " " + c.alasan).lower()
                if "denda" in text_lower or "ganti rugi" in text_lower or "keluar" in text_lower:
                    questions.append(QuestionItem(
                        id=f"q_{q_idx}",
                        nomor_pasal=c.nomor_pasal,
                        pertanyaan="Bagaimana jika terjadi keadaan darurat (force majeure atau sakit) sebelum kontrak selesai, apakah denda penalti dapat diringankan atau dihapuskan?",
                        tujuan="Mencegah kewajiban membayar denda penuh saat terjadi hal di luar kendali.",
                        target_pihak="Pemilik / Pihak Pertama"
                    ))
                    q_idx += 1
                elif "deposit" in text_lower or "jaminan" in text_lower:
                    questions.append(QuestionItem(
                        id=f"q_{q_idx}",
                        nomor_pasal=c.nomor_pasal,
                        pertanyaan="Apa saja kriteria spesifik dan bukti tertulis yang digunakan untuk memotong deposit, dan berapa hari kerja pengembalian sisa deposit setelah kontrak berakhir?",
                        tujuan="Menghindari uang deposit ditahan secara sepihak tanpa alasan objektif.",
                        target_pihak="Pengelola / Pemilik"
                    ))
                    q_idx += 1
                elif "sepihak" in text_lower or "mengubah" in text_lower:
                    questions.append(QuestionItem(
                        id=f"q_{q_idx}",
                        nomor_pasal=c.nomor_pasal,
                        pertanyaan="Apakah setiap perubahan syarat, tata tertib, atau biaya di kemudian hari memerlukan persetujuan tertulis dari kedua belah pihak?",
                        tujuan="Menghilangkan risiko perubahan aturan sepihak di tengah jalan.",
                        target_pihak="Pemberi Kontrak"
                    ))
                    q_idx += 1
                else:
                    questions.append(QuestionItem(
                        id=f"q_{q_idx}",
                        nomor_pasal=c.nomor_pasal,
                        pertanyaan=f"Terkait ketentuan Pasal {c.nomor_pasal}, apakah redaksional kalimat dapat disesuaikan agar memberikan perlindungan yang seimbang bagi kedua pihak?",
                        tujuan="Membuka ruang negosiasi klausul berisiko sebelum penandatanganan.",
                        target_pihak="Pihak Pertama"
                    ))
                    q_idx += 1

            elif c.level == RiskLevel.KUNING:
                text_lower = (c.isi + " " + c.alasan).lower()
                if "perbaikan" in text_lower or "biaya" in text_lower or "kerusakan" in text_lower:
                    questions.append(QuestionItem(
                        id=f"q_{q_idx}",
                        nomor_pasal=c.nomor_pasal,
                        pertanyaan="Siapa yang menanggung biaya kerusakan fasilitas akibat usia pemakaian wajar (wear and tear), dan siapa yang menanggung akibat kelalaian?",
                        tujuan="Memperjelas batas tanggung jawab perbaikan fasilitas.",
                        target_pihak="Pengelola / Pemilik"
                    ))
                    q_idx += 1
                elif "perpanjangan" in text_lower or "otomatis" in text_lower:
                    questions.append(QuestionItem(
                        id=f"q_{q_idx}",
                        nomor_pasal=c.nomor_pasal,
                        pertanyaan="Berapa hari sebelum kontrak berakhir pihak pengelola akan memberikan pemberitahuan resmi untuk konfirmasi perpanjangan atau pengakhiran?",
                        tujuan="Mencegah auto-renewal tanpa kesadaran penyewa/pekerja.",
                        target_pihak="Pemberi Kontrak"
                    ))
                    q_idx += 1

        # Fallback question if none generated
        if not questions:
            questions.append(QuestionItem(
                id="q_default",
                nomor_pasal=None,
                pertanyaan="Apakah ada tata tertib tambahan atau lampiran teknis yang belum tercantum dalam naskah perjanjian ini?",
                tujuan="Memastikan tidak ada biaya tersembunyi atau kewajiban susulan.",
                target_pihak="Pihak Pertama"
            ))

        return questions
