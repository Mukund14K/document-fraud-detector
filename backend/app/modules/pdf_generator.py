"""
pdf_generator.py
Generates high-quality, professional PDF Forensic Reports for document fraud investigations.
"""

import os
import datetime
from typing import Dict, Any, Optional
from PIL import Image as PILImage

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image as RLImage,
    KeepTogether,
    HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPORTS_DIR = os.path.join(BASE_DIR, "static", "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)


def _get_proportional_dims(img_path: str, max_w: float, max_h: float):
    """Calculates image dimensions maintaining aspect ratio."""
    try:
        with PILImage.open(img_path) as im:
            w, h = im.size
            aspect = w / h
            if w > h:
                new_w = min(w, max_w)
                new_h = new_w / aspect
                if new_h > max_h:
                    new_h = max_h
                    new_w = new_h * aspect
            else:
                new_h = min(h, max_h)
                new_w = new_h * aspect
                if new_w > max_w:
                    new_w = max_w
                    new_h = new_w / aspect
            return new_w, new_h
    except Exception:
        return max_w, max_h


def generate_forensic_report(
    document_filename: str,
    document_image_path: str,
    verdict: str,
    risk_score: float,
    checks: list,
    case_id: Optional[str] = None,
    output_pdf_path: Optional[str] = None,
) -> str:
    """
    Generates a PDF forensic analysis report and saves it to disk.

    Returns the relative web URL path (e.g. '/static/reports/filename_report.pdf')
    """
    safe_name = os.path.splitext(os.path.basename(document_filename))[0]
    if not output_pdf_path:
        pdf_filename = f"{safe_name}_forensic_report.pdf"
        output_pdf_path = os.path.join(REPORTS_DIR, pdf_filename)
    else:
        pdf_filename = os.path.basename(output_pdf_path)

    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f172a"),
    )
    subtitle_style = ParagraphStyle(
        "DocSubTitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#64748b"),
    )
    section_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "ReportBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#334155"),
    )
    bold_body = ParagraphStyle(
        "BoldReportBody",
        parent=body_style,
        fontName="Helvetica-Bold",
    )

    story = []

    # 1. Header Banner
    story.append(Paragraph("DOCUMENT FRAUD FORENSIC REPORT", title_style))
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cid = case_id or safe_name
    story.append(Paragraph(f"Case Reference: <b>{cid}</b> &nbsp;|&nbsp; Generated: <b>{now_str}</b> &nbsp;|&nbsp; Source File: <b>{document_filename}</b>", subtitle_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#cbd5e1"), spaceAfter=12))

    # 2. Verdict Card
    verdict_upper = verdict.upper()
    if verdict_upper == "GENUINE":
        v_bg = colors.HexColor("#ecfdf5")
        v_border = colors.HexColor("#10b981")
        v_text_color = colors.HexColor("#065f46")
    elif verdict_upper == "SUSPICIOUS":
        v_bg = colors.HexColor("#fffbeb")
        v_border = colors.HexColor("#f59e0b")
        v_text_color = colors.HexColor("#92400e")
    else:  # FAKE
        v_bg = colors.HexColor("#fef2f2")
        v_border = colors.HexColor("#ef4444")
        v_text_color = colors.HexColor("#991b1b")

    verdict_html = f"<font color='{v_text_color.hexval()}'><b>VERDICT: {verdict_upper}</b> (Risk Score: {risk_score:.2f} / 1.00)</font>"
    verdict_sub = f"<font size='9' color='#475569'>Confidence Evaluation: MRZ (50%), Error Level Analysis (25%), Field Cross-Verification (25%)</font>"
    
    verdict_table = Table(
        [[Paragraph(verdict_html, ParagraphStyle("VText", fontName="Helvetica-Bold", fontSize=14, leading=18)),
          Paragraph(verdict_sub, ParagraphStyle("VSub", fontName="Helvetica", fontSize=9, leading=12, alignment=2))]],
        colWidths=[320, 220],
    )
    verdict_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), v_bg),
        ("BOX", (0, 0), (-1, -1), 1.5, v_border),
        ("PADDING", (0, 0), (-1, -1), 10),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(verdict_table)
    story.append(Spacer(1, 14))

    # 3. Visual Evidence Side-by-Side (Original Image vs ELA Heatmap)
    story.append(Paragraph("Visual Evidence & Heatmap Comparison", section_style))

    # Look for heatmap path in checks
    heatmap_disk_path = None
    for c in checks:
        hm = c.get("heatmap_path") if isinstance(c, dict) else getattr(c, "heatmap_path", None)
        if hm:
            if hm.startswith("/static/"):
                potential = os.path.join(BASE_DIR, hm.lstrip("/"))
                if os.path.exists(potential):
                    heatmap_disk_path = potential
            elif os.path.exists(hm):
                heatmap_disk_path = hm
            break

    img_max_w = 260
    img_max_h = 160

    img_cells = []
    # Original Document
    if os.path.exists(document_image_path):
        ow, oh = _get_proportional_dims(document_image_path, img_max_w, img_max_h)
        orig_img_flow = RLImage(document_image_path, width=ow, height=oh)
        img_cells.append([orig_img_flow, Paragraph("<b>Original Uploaded Document</b>", body_style)])
    else:
        img_cells.append([Paragraph("<i>Original document not accessible</i>", body_style), Paragraph("Original Document", body_style)])

    # ELA Heatmap
    if heatmap_disk_path and os.path.exists(heatmap_disk_path):
        hw, hh = _get_proportional_dims(heatmap_disk_path, img_max_w, img_max_h)
        heat_img_flow = RLImage(heatmap_disk_path, width=hw, height=hh)
        img_cells.append([heat_img_flow, Paragraph("<b>ELA Compression Heatmap (Tamper Overlay)</b>", body_style)])
    else:
        img_cells.append([Paragraph("<i>Heatmap not available</i>", body_style), Paragraph("ELA Heatmap", body_style)])

    vis_table = Table(
        [
            [img_cells[0][0], img_cells[1][0]],
            [img_cells[0][1], img_cells[1][1]],
        ],
        colWidths=[270, 270],
    )
    vis_table.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 4),
        ("TOPPADDING", (0, 1), (-1, 1), 4),
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
    ]))
    story.append(vis_table)
    story.append(Spacer(1, 14))

    # 4. Detailed Module Findings Table
    story.append(Paragraph("Forensic Check Breakdown", section_style))

    check_table_data = [
        [
            Paragraph("<b>Security Check</b>", bold_body),
            Paragraph("<b>Status</b>", bold_body),
            Paragraph("<b>Forensic Evidence & Details</b>", bold_body),
        ]
    ]

    for check in checks:
        c_name = check.get("name", "Unknown Check") if isinstance(check, dict) else getattr(check, "name", "")
        c_passed = check.get("passed") if isinstance(check, dict) else getattr(check, "passed", None)
        c_detail = check.get("detail") if isinstance(check, dict) else getattr(check, "detail", "")

        if c_passed is True:
            status_p = Paragraph("<font color='#059669'><b>PASSED</b></font>", bold_body)
        elif c_passed is False:
            status_p = Paragraph("<font color='#dc2626'><b>FAILED</b></font>", bold_body)
        else:
            status_p = Paragraph("<font color='#64748b'><b>SKIPPED</b></font>", bold_body)

        # Format details cleanly
        if isinstance(c_detail, dict):
            detail_lines = []
            for k, v in c_detail.items():
                if isinstance(v, dict):
                    m_str = "MATCH" if v.get("match") else "MISMATCH"
                    detail_lines.append(f"• <b>{k.replace('_', ' ').title()}</b>: Value <code>{v.get('value')}</code> (Exp: {v.get('expected')}, Comp: {v.get('computed')}) -> <b>{m_str}</b>")
                else:
                    detail_lines.append(f"• <b>{k}</b>: {v}")
            detail_p = Paragraph("<br/>".join(detail_lines), body_style)
        else:
            detail_p = Paragraph(str(c_detail), body_style)

        check_table_data.append([
            Paragraph(f"<b>{c_name}</b>", body_style),
            status_p,
            detail_p,
        ])

    breakdown_table = Table(check_table_data, colWidths=[150, 70, 320])
    breakdown_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(breakdown_table)
    story.append(Spacer(1, 16))

    # 5. Officer Review & Sign-Off Section
    officer_table_data = [
        [
            Paragraph("<b>Officer Review & Determination</b>", bold_body),
            Paragraph("<b>Official Sign-Off</b>", bold_body),
        ],
        [
            Paragraph("Action Taken: [ &nbsp; ] Cleared &nbsp;&nbsp; [ &nbsp; ] Secondary Inspection &nbsp;&nbsp; [ &nbsp; ] Seized / Fraud Confirmed<br/><br/>Notes: ___________________________________________________________", body_style),
            Paragraph("Investigating Officer: __________________________<br/><br/>Badge / ID: ______________ &nbsp;&nbsp; Date: _______________", body_style),
        ],
    ]
    officer_table = Table(officer_table_data, colWidths=[310, 230])
    officer_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f8fafc")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))

    story.append(KeepTogether([officer_table]))

    # Build document
    doc.build(story)

    # Return web-friendly relative path
    return f"/static/reports/{pdf_filename}"
