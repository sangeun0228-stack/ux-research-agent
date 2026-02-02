import { jsPDF } from "jspdf";
import {
  type AnalysisResult,
  ANALYSIS_SECTIONS,
  SECTION_ICONS,
  parseSectionWithReferences,
} from "@/components/AnalysisView";

/** 마크다운 간단 제거 (볼드 등) */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^[-*]\s+/gm, "• ")
    .trim();
}

const A4_W = 210;
const A4_H = 297;
const MARGIN = 20;
const MAX_WIDTH = A4_W - MARGIN * 2;
const LINE_HEIGHT = 5.5;
const TITLE_FONT = 18;
const SUBTITLE_FONT = 11;
const SECTION_FONT = 12;
const BODY_FONT = 10;
const REF_FONT = 8;

export function downloadResultPdf(
  result: AnalysisResult,
  topic: string,
  date: Date | string
): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  const dateStr =
    typeof date === "string"
      ? new Date(date).toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : date.toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

  doc.setFontSize(TITLE_FONT);
  doc.setFont("helvetica", "bold");
  doc.text("kt ds UX Insight Agent 분석 결과", MARGIN, y);
  y += LINE_HEIGHT * 2;

  doc.setFontSize(SUBTITLE_FONT);
  doc.setFont("helvetica", "normal");
  doc.text(`리서치 주제: ${topic}`, MARGIN, y);
  y += LINE_HEIGHT;
  doc.text(`날짜: ${dateStr}`, MARGIN, y);
  y += LINE_HEIGHT * 1.5;

  doc.setDrawColor(200, 200, 200);
  doc.line(MARGIN, y, A4_W - MARGIN, y);
  y += LINE_HEIGHT * 1.5;

  for (const sectionTitle of ANALYSIS_SECTIONS) {
    const raw = result[sectionTitle] ?? "";
    const { body, references } = parseSectionWithReferences(raw);
    const icon = SECTION_ICONS[sectionTitle] ?? "";
    const sectionLabel = `${icon} ${sectionTitle}`;

    if (y > A4_H - 40) {
      doc.addPage();
      y = MARGIN;
    }

    doc.setFontSize(SECTION_FONT);
    doc.setFont("helvetica", "bold");
    doc.text(sectionLabel, MARGIN, y);
    y += LINE_HEIGHT * 1.2;

    doc.setFontSize(BODY_FONT);
    doc.setFont("helvetica", "normal");
    const bodyPlain = stripMarkdown(body);
    const bodyLines = doc.splitTextToSize(bodyPlain, MAX_WIDTH);
    for (const line of bodyLines) {
      if (y > A4_H - 30) {
        doc.addPage();
        y = MARGIN;
      }
      doc.text(line, MARGIN, y);
      y += LINE_HEIGHT;
    }
    y += LINE_HEIGHT * 0.5;

    if (references.length > 0) {
      if (y > A4_H - 25) {
        doc.addPage();
        y = MARGIN;
      }
      doc.setFontSize(REF_FONT);
      doc.setTextColor(100, 100, 100);
      doc.text("참고 문헌 및 출처", MARGIN, y);
      y += LINE_HEIGHT * 0.8;
      for (let i = 0; i < references.length; i++) {
        if (y > A4_H - 15) {
          doc.addPage();
          y = MARGIN;
        }
        const refLines = doc.splitTextToSize(`#출처${i + 1} ${references[i]}`, MAX_WIDTH - 10);
        for (const line of refLines) {
          doc.text(line, MARGIN + 3, y);
          y += LINE_HEIGHT * 0.8;
        }
      }
      doc.setTextColor(0, 0, 0);
      y += LINE_HEIGHT;
    }

    y += LINE_HEIGHT * 0.5;
  }

  doc.save(`kt-ds-UX-Insight-${topic.slice(0, 20).replace(/[/\\?%*|"<>]/g, "")}-${Date.now()}.pdf`);
}
