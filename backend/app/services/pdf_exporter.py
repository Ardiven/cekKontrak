import io
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

from backend.app.models.schemas import DocumentAnalysisResponse, RiskLevel


class PdfExporter:
    @staticmethod
    def generate_pdf(doc: DocumentAnalysisResponse) -> io.BytesIO:
        buffer = io.BytesIO()
        pdf = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=40,
            leftMargin=40,
            topMargin=40,
            bottomMargin=40
        )
        elements = []
        styles = getSampleStyleSheet()

        # Custom Styles
        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Heading1"],
            fontSize=20,
            leading=24,
            textColor=colors.HexColor("#0F172A"),
            spaceAfter=6
        )

        subtitle_style = ParagraphStyle(
            "DocSubtitle",
            parent=styles["Normal"],
            fontSize=10,
            textColor=colors.HexColor("#64748B"),
            spaceAfter=12
        )

        h2_style = ParagraphStyle(
            "Heading2Custom",
            parent=styles["Heading2"],
            fontSize=13,
            leading=16,
            textColor=colors.HexColor("#1E293B"),
            spaceBefore=14,
            spaceAfter=8
        )

        body_style = ParagraphStyle(
            "BodyCustom",
            parent=styles["Normal"],
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#334155")
        )

        disclaimer_style = ParagraphStyle(
            "DisclaimerCustom",
            parent=styles["Italic"],
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#DC2626")
        )

        # Title Section
        elements.append(Paragraph("<b>CekKontrak</b> — Laporan Telaah Kontrak", title_style))
        elements.append(Paragraph(f"Dokumen: <b>{doc.title}</b> | Tanggal: {doc.created_at[:10]}", subtitle_style))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=10))

        # Disclaimer
        disclaimer_text = f"<b>PENTING:</b> {doc.disclaimer}"
        elements.append(Paragraph(disclaimer_text, disclaimer_style))
        elements.append(Spacer(1, 10))

        # Overall Score Box
        score_data = [
            [
                Paragraph(f"<b>Skor Risiko Keseluruhan:</b> {doc.overall_score}/100 ({doc.risk_level})", body_style),
                Paragraph(f"Merah: <b>{doc.counts.get('merah', 0)}</b> | Kuning: <b>{doc.counts.get('kuning', 0)}</b> | Hijau: <b>{doc.counts.get('hijau', 0)}</b>", body_style)
            ],
            [
                Paragraph(f"<b>Ringkasan:</b> {doc.summary}", body_style),
                ""
            ]
        ]
        score_table = Table(score_data, colWidths=[280, 240])
        score_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#E2E8F0")),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('SPAN', (0, 1), (1, 1)),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(score_table)
        elements.append(Spacer(1, 15))

        # Section 1: Daftar Pertanyaan Sebelum Tanda Tangan
        elements.append(Paragraph("1. Daftar Pertanyaan Sebelum Tanda Tangan (Bekal Negosiasi)", h2_style))
        if doc.questions:
            q_table_data = [
                [
                    Paragraph("<b>No</b>", body_style),
                    Paragraph("<b>Pasal</b>", body_style),
                    Paragraph("<b>Pertanyaan Rekomendasi</b>", body_style),
                    Paragraph("<b>Tujuan Pertanyaan</b>", body_style)
                ]
            ]
            for idx, q in enumerate(doc.questions, start=1):
                q_table_data.append([
                    Paragraph(str(idx), body_style),
                    Paragraph(f"Pasal {q.nomor_pasal or '-'}", body_style),
                    Paragraph(q.pertanyaan, body_style),
                    Paragraph(q.tujuan, body_style)
                ])
            q_table = Table(q_table_data, colWidths=[25, 60, 245, 190])
            q_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ]))
            elements.append(q_table)
        else:
            elements.append(Paragraph("Tidak ada pertanyaan kritis khusus.", body_style))

        elements.append(Spacer(1, 15))

        # Section 2: Draf Revisi Klausul yang Lebih Adil
        elements.append(Paragraph("2. Usulan Draf Revisi Pasal Berisiko", h2_style))
        revisions = [c for c in doc.clauses if c.saran_revisi and c.level in [RiskLevel.MERAH, RiskLevel.KUNING]]
        if revisions:
            rev_table_data = [
                [
                    Paragraph("<b>Pasal</b>", body_style),
                    Paragraph("<b>Level</b>", body_style),
                    Paragraph("<b>Teks Asli & Penjelasan Awam</b>", body_style),
                    Paragraph("<b>Usulan Redaksional yang Lebih Adil</b>", body_style)
                ]
            ]
            for r in revisions:
                level_str = "BERISIKO (Merah)" if r.level == RiskLevel.MERAH else "PERLU TELITI (Kuning)"
                left_content = f"<b>Asli:</b> {r.isi[:150]}...<br/><br/><b>Maksud Awam:</b> {r.penjelasan_awam}"
                rev_table_data.append([
                    Paragraph(f"Pasal {r.nomor_pasal}", body_style),
                    Paragraph(f"<b>{level_str}</b>", body_style),
                    Paragraph(left_content, body_style),
                    Paragraph(f"<i>\"{r.saran_revisi}\"</i>", body_style)
                ])
            rev_table = Table(rev_table_data, colWidths=[55, 75, 195, 195])
            rev_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ]))
            elements.append(rev_table)
        else:
            elements.append(Paragraph("Semua pasal relatif aman dan tidak memerlukan usulan revisi khusus.", body_style))

        # Build PDF
        pdf.build(elements)
        buffer.seek(0)
        return buffer
