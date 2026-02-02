"use client";

import { useState } from "react";
import { useMounted } from "@/hooks/useMounted";
import MarkdownContent from "@/components/MarkdownContent";
import { downloadResultPdf } from "@/lib/pdfReport";

export const ANALYSIS_SECTIONS = [
  "시장 현황",
  "UI/UX 패턴 분석",
  "장단점 비교",
  "인사이트 도출",
] as const;

/** KT DS 업무 환경 기준 리서치 유형 */
export const RESEARCH_TYPES = ["대국민/B2C", "업무용/Admin", "인프라/DX"] as const;
export const DEVICES = ["모바일", "웹"] as const;

export type SectionKey = (typeof ANALYSIS_SECTIONS)[number];
export type ResearchType = (typeof RESEARCH_TYPES)[number];
export type Device = (typeof DEVICES)[number];

/** 유형별 세부 서비스 (2단 선택용) */
export const SUB_SERVICES_BY_TYPE: Record<ResearchType, readonly string[]> = {
  "대국민/B2C": ["멤버십", "공공포털", "이커머스", "금융·결제"],
  "업무용/Admin": ["ERP", "인사·자원관리", "CRM·영업", "보고서·대시보드"],
  "인프라/DX": ["클라우드 콘솔", "모니터링·알림", "API·설정", "DevOps"],
} as const;

/** 유형별 입력창 Placeholder 예시 */
export const PLACEHOLDER_BY_TYPE: Record<ResearchType, string> = {
  "대국민/B2C": "예) 통신사 멤버십 메인 화면 UI 구성",
  "업무용/Admin": "예) 전사 자원 관리 대시보드 위젯 배치",
  "인프라/DX": "예) 클라우드 리소스 모니터링 그래프 UI",
};

const DEFAULT_PLACEHOLDER = "분석할 UX 주제를 입력하세요";

/**
 * 대분류·소분류별 추천 키워드 (3~4개)
 * 대분류 또는 소분류 변경 시 입력창 하단 칩 목록이 동적으로 교체됨
 */
export const KEYWORDS_BY_TYPE_AND_SUB: Record<
  ResearchType,
  Record<string, readonly string[]>
> = {
  "대국민/B2C": {
    멤버십: ["포인트 조회 UI", "로그인 보안", "멤버십 메인 화면 구성", "혜택 노출 UX"],
    공공포털: ["접근성 준수 여부", "메뉴 구조·정보 탐색", "민원 신청 플로우", "모바일 대응"],
    이커머스: ["결제 플로우 단순화", "장바구니·주문 확인 UX", "상품 상세 정보 구성", "검색·필터 사용성"],
    "금융·결제": ["결제 수단 선택 UI", "본인인증·보안 절차", "이체·송금 플로우", "거래 내역 가독성"],
  },
  "업무용/Admin": {
    ERP: ["대용량 테이블 가독성", "권한 관리 설정", "마스터 데이터 입력 폼", "결재 라인·워크플로"],
    "인사·자원관리": ["조직도·인사 정보 뷰", "휴가·근태 신청 플로우", "자원 배치 대시보드", "예산·실적 테이블"],
    "CRM·영업": ["영업 단계별 파이프라인", "고객 정보·이력 조회", "활동 로그·업무 기록", "리포트·KPI 위젯"],
    "보고서·대시보드": ["위젯 배치·커스터마이징", "차트·그래프 가독성", "필터·기간 설정 UX", "내보내기·공유"],
  },
  "인프라/DX": {
    "클라우드 콘솔": ["장애 모니터링 그래프", "API 연동 가이드", "리소스 목록·상태 뷰", "비용·사용량 대시보드"],
    "모니터링·알림": ["알림 규칙 설정 UI", "이벤트·로그 탐색", "대시보드 위젯 구성", "알림 채널 연동"],
    "API·설정": ["API 문서·스펙 노출", "키·권한 설정 화면", "테스트·호출 도구", "버전·환경 전환"],
    DevOps: ["파이프라인 실행 뷰", "빌드·배포 로그", "환경별 설정 관리", "협업·알림 연동"],
  },
};

const DEFAULT_KEYWORDS = [
  "메인 화면 UI 구성",
  "대시보드 위젯 배치",
  "결제·가입 플로우",
  "접근성·사용성 개선",
] as const;

export interface AnalysisInput {
  researchType: ResearchType | null;
  subService?: string | null;
  device: Device;
  topic: string;
}

/**
 * 유형별 시스템 프롬프트: AI가 해당 환경의 특수성을 고려해 분석하도록 지시
 * (API 연동 시 요청 바디 또는 시스템 메시지로 전달)
 */
export const RESEARCH_TYPE_SYSTEM_PROMPTS: Record<ResearchType, string> = {
  "대국민/B2C": `[대국민/B2C] 불특정 다수가 사용하는 서비스입니다. 다음 관점을 반드시 반영해 분석하세요: 접근성(공공기관 웹 접근성 준수 여부, WCAG·KWCAG 등), 쉬운 사용성(비전문가도 이해하기 쉬운 UI·용어·플로우), 인클루시브 디자인. 공공·민간 대국민 서비스 사례를 참고하세요.`,
  "업무용/Admin": `[업무용/Admin] 전문가가 사용하는 대형 시스템입니다. 다음 관점을 반드시 반영해 분석하세요: 업무 효율성(단축키·대량 처리·워크플로 최적화), 데이터 가독성(테이블·차트·필터·정렬), 역할별 권한·감사 로그. ERP·관리자 콘솔·내부 업무 시스템 사례를 참고하세요.`,
  "인프라/DX": `[인프라/DX] 클라우드·기술 플랫폼·DX 솔루션입니다. 다음 관점을 반드시 반영해 분석하세요: 논리적 정보 구조(IA·네임스페이스·리소스 계층), 시스템 가시성(모니터링·대시보드·알림), API·설정·통합 UX. DevOps·클라우드 콘솔·플랫폼 관리자 UX 사례를 참고하세요.`,
};

/**
 * 디바이스(웹/모바일)별 시스템 프롬프트: 선택된 디바이스의 물리적 제약·특성에 맞춰 분석 관점을 완전히 다르게 적용
 */
export const DEVICE_SYSTEM_PROMPTS: Record<Device, string> = {
  모바일: `[모바일/Mobile] 분석 관점을 모바일 디바이스 기준으로 완전히 가져가세요. 반드시 다음 관점을 포함하고, 모든 분석 결과에서 선택된 디바이스의 물리적 제약과 특성을 언급하세요.
- **한 손 조작성**: 엄지 도달 영역, 단일 손가락 조작 가능 여부, 핫존 배치
- **터치 타겟 크기**: 최소 44×44pt 권장, 터치 간격·오조작 방지
- **하단 탭바 활용**: 주요 기능 하단 고정, 스와이프·제스처와의 조합
- **데이터 절약형 UI**: 이미지·동영상 최적화, 지연 로딩, 오프라인 대응
- **알림(Push) 전략**: 권한 요청 시점, 알림 빈도·내용, 딥링크 연동`,
  웹: `[웹/Web] 분석 관점을 웹 디바이스 기준으로 완전히 가져가세요. 반드시 다음 관점을 포함하고, 모든 분석 결과에서 선택된 디바이스의 물리적 제약과 특성을 언급하세요.
- **넓은 해상도 활용**: 그리드 시스템(12/16컬럼), 반응형 브레이크포인트, 대형 모니터 대응
- **마우스 호버 효과**: 호버 시 피드백, 툴팁·드롭다운, 클릭 영역 명확성
- **복잡한 정보 구조(Navigation)**: 글로벌 내비·메가메뉴·사이드바·브레드크럼, IA 계층
- **멀티태스킹 편의성**: 탭·팝업·새 창, 복사·붙여넣기, 키보드 단축키`,
};

/**
 * Gemini(또는 AI)에게 전달할 참고 문헌·출처 지시
 * 각 섹션 분석 끝에 [참고 문헌 및 출처]를 반드시 포함하고, 본문에서는 #출처1, #출처2 등으로 인용
 */
export const REFERENCES_SYSTEM_PROMPT = `[참고 문헌 및 출처] 각 섹션 분석을 마칠 때, 해당 분석의 근거가 된 참고 문헌 및 출처를 답변 마지막에 반드시 포함하세요.
- 본문에서 인용할 때는 #출처1, #출처2, #출처3와 같이 구분자로 표기하세요.
- [참고 문헌 및 출처] 제목 아래에 각 출처를 한 줄씩 나열하세요. 형식: #출처1: 서비스명 또는 출처명, URL(선택)
- 실제 존재하는 웹사이트 URL이나 서비스·문서 명칭을 사용하세요. 예: Nielsen Norman Group, Toss UX 리포트, 정부24 웹 접근성 가이드라인, WCAG 2.1, Material Design Guidelines 등.`;

export interface AnalysisResult {
  [key: string]: string;
}

/** AI 답변에서 #키워드 기준으로 4개 섹션 텍스트 분할 (API 응답이 한 덩어리일 때 사용) */
const SECTION_HASHTAGS = [
  { tag: "#시장현황", section: "시장 현황" as const },
  { tag: "#패턴분석", section: "UI/UX 패턴 분석" as const },
  { tag: "#장단점", section: "장단점 비교" as const },
  { tag: "#인사이트", section: "인사이트 도출" as const },
] as const;

export function parseResponseByKeywords(fullText: string): AnalysisResult {
  const result: AnalysisResult = {};
  ANALYSIS_SECTIONS.forEach((title) => {
    result[title] = "";
  });
  if (!fullText?.trim()) return result;

  const text = fullText.trim();
  for (let i = 0; i < SECTION_HASHTAGS.length; i++) {
    const { tag, section } = SECTION_HASHTAGS[i];
    const nextTag = SECTION_HASHTAGS[i + 1]?.tag;
    const tagEscaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const nextTagEscaped = nextTag
      ? nextTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      : null;
    const regex = new RegExp(
      `${tagEscaped}\\s*([\\s\\S]*?)(?=${nextTagEscaped ? nextTagEscaped + "|$" : "$"})`,
      "i"
    );
    const match = text.match(regex);
    result[section] = match ? match[1].trim() : "";
  }
  return result;
}

/** 섹션별 아이콘 (리서치 보고서 가독성) */
export const SECTION_ICONS: Record<SectionKey, string> = {
  "시장 현황": "📊",
  "UI/UX 패턴 분석": "📱",
  "장단점 비교": "✅",
  "인사이트 도출": "💡",
};

const REFERENCES_HEADER = "[참고 문헌 및 출처]";

/** 섹션 본문에서 [참고 문헌 및 출처] 블록을 분리하고, #출처1, #출처2 목록 추출 */
export function parseSectionWithReferences(
  content: string
): { body: string; references: string[] } {
  if (!content?.trim()) return { body: "", references: [] };
  const idx = content.indexOf(REFERENCES_HEADER);
  if (idx === -1) return { body: content.trim(), references: [] };
  const body = content.slice(0, idx).trim();
  const block = content.slice(idx + REFERENCES_HEADER.length).trim();
  const lines = block.split(/\n/).filter((line) => line.trim());
  const references: string[] = [];
  for (const line of lines) {
    const match = line.match(/^#?출처\d+\s*[.:]\s*(.+)$/i) || line.match(/^[-*]?\s*(.+)$/);
    if (match) references.push(match[1].trim());
  }
  return { body, references };
}

/** AI 응답 텍스트를 섹션 제목 기준으로 분할 */
function splitResponseBySections(
  fullText: string,
  sectionTitles: readonly string[]
): AnalysisResult {
  const result: AnalysisResult = {};
  let remaining = fullText;

  for (let i = 0; i < sectionTitles.length; i++) {
    const title = sectionTitles[i];
    const nextTitle = sectionTitles[i + 1];
    const titleRegex = new RegExp(
      `(${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\s*[:：]?\\s*([\\s\\S]*?)(?=${nextTitle ? nextTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "$"})`,
      "i"
    );
    const match = remaining.match(titleRegex);
    if (match) {
      result[title] = match[2].trim();
      remaining = remaining.replace(titleRegex, "");
    } else {
      result[title] = "";
    }
  }

  return result;
}

/** AI에 전달할 문맥 문자열 생성 (선택값 + 주제) */
function buildAnalysisContext(input: AnalysisInput): string {
  const parts: string[] = [];
  if (input.researchType) parts.push(`리서치 유형: ${input.researchType}`);
  if (input.subService) parts.push(`세부 서비스: ${input.subService}`);
  parts.push(`디바이스: ${input.device}`);
  parts.push(`주제: ${input.topic.trim()}`);
  return parts.join(", ");
}

/** 선택된 유형에 맞는 시스템 프롬프트 반환 (API 호출 시 시스템 메시지로 전달) */
export function getSystemPromptForResearchType(
  researchType: ResearchType | null,
  options?: { includeReferencesPrompt?: boolean; device?: Device }
): string | null {
  const typePrompt = researchType ? RESEARCH_TYPE_SYSTEM_PROMPTS[researchType] ?? "" : "";
  const devicePrompt = options?.device ? DEVICE_SYSTEM_PROMPTS[options.device] ?? "" : "";
  const refPrompt = options?.includeReferencesPrompt ? REFERENCES_SYSTEM_PROMPT : "";
  const parts = [typePrompt, devicePrompt, refPrompt].filter(Boolean);
  if (parts.length === 0) return null;
  const combined = parts.join("\n\n");
  return combined + "\n\n[공통] 모든 분석 결과는 선택된 디바이스(모바일/웹)의 물리적 제약과 특성을 반드시 언급하세요.";
}

/** 실제 Gemini API 호출 (Next.js API route 경유) */
async function fetchAnalysisFromApi(
  input: AnalysisInput
): Promise<string> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      researchType: input.researchType,
      subService: input.subService ?? null,
      device: input.device,
      topic: input.topic.trim(),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof data?.error === "string"
        ? data.error
        : "서버 연결에 실패했습니다. API 키와 네트워크를 확인해주세요.";
    throw new Error(message);
  }
  if (typeof data?.text !== "string") {
    throw new Error("서버 연결에 실패했습니다. API 키와 네트워크를 확인해주세요.");
  }
  return data.text;
}

export interface AnalysisViewProps {
  /** 히스토리에서 선택했을 때 보여줄 결과 (부모가 관리) */
  displayedResult?: AnalysisResult | null;
  /** PDF 리포트용 주제 (분석 완료 또는 히스토리 선택 시 설정) */
  reportTopic?: string | null;
  /** PDF 리포트용 날짜 (ISO 문자열 또는 null) */
  reportDate?: string | null;
  /** 분석 완료 시 호출: 주제, 결과, 리서치 유형을 넘겨 히스토리 저장 등에 사용 */
  onAnalysisComplete?: (
    topic: string,
    result: AnalysisResult,
    researchType: ResearchType | null
  ) => void;
}

export default function AnalysisView({
  displayedResult = null,
  reportTopic = null,
  reportDate = null,
  onAnalysisComplete,
}: AnalysisViewProps = {}) {
  const [researchType, setResearchType] = useState<ResearchType | null>(null);
  const [subService, setSubService] = useState<string | null>(null);
  const [device, setDevice] = useState<Device>("모바일");
  const [topic, setTopic] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [localResult, setLocalResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mounted = useMounted();

  const result = displayedResult ?? localResult;

  const placeholder =
    researchType != null ? PLACEHOLDER_BY_TYPE[researchType] : DEFAULT_PLACEHOLDER;
  const subServices = researchType != null ? SUB_SERVICES_BY_TYPE[researchType] : [];

  /** 대분류·소분류 변경 시마다 추천 키워드 목록 동적 교체 */
  const suggestedKeywords = (() => {
    if (researchType == null) return [...DEFAULT_KEYWORDS];
    const bySub = KEYWORDS_BY_TYPE_AND_SUB[researchType];
    if (subService && bySub[subService]) return [...bySub[subService]];
    return Object.values(bySub).flat().slice(0, 8);
  })();

  const handleResearchTypeChange = (type: ResearchType) => {
    setResearchType(type);
    setSubService(null);
  };

  const handleStartAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = topic.trim();
    if (!trimmed || isAnalyzing) return;

    setError(null);
    setLocalResult(null);
    setIsAnalyzing(true);

    const input: AnalysisInput = {
      researchType,
      subService: subService || undefined,
      device,
      topic: trimmed,
    };

    try {
      const raw = await fetchAnalysisFromApi(input);
      const normalized = parseResponseByKeywords(raw);
      setLocalResult(normalized);
      onAnalysisComplete?.(trimmed, normalized, researchType);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "서버 연결에 실패했습니다. API 키와 네트워크를 확인해주세요.";
      setError(message);
      if (typeof window !== "undefined") {
        alert(message);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!mounted) {
    return (
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <div className="shrink-0 p-6 border-b border-slate-200 bg-white animate-pulse">
          <div className="max-w-3xl mx-auto flex gap-3">
            <div className="flex-1 h-14 bg-slate-200 rounded-xl" />
            <div className="w-28 h-14 bg-slate-200 rounded-xl" />
          </div>
        </div>
        <div className="flex-1 p-6" />
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
      {/* 입력 영역: 리서치 유형 + 디바이스 + 주제 + 분석 시작 */}
      <div className="shrink-0 p-6 border-b border-slate-200 bg-white shadow-sm">
        <form
          onSubmit={handleStartAnalysis}
          className="max-w-3xl mx-auto flex flex-col gap-4"
        >
          {/* 1단: 리서치 유형(버튼 3개) + 디바이스(드롭다운) */}
          <div className="flex flex-wrap items-end gap-6">
            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium text-slate-700">
                리서치 유형
              </legend>
              <div className="flex gap-2">
                {RESEARCH_TYPES.map((type) => {
                  const isSelected = researchType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleResearchTypeChange(type)}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isSelected
                          ? "hover:opacity-90"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                      style={isSelected ? { backgroundColor: "#1e40af", color: "#ffffff" } : undefined}
                      aria-pressed={isSelected}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <fieldset className="flex flex-col gap-2">
              <label htmlFor="device-select" className="text-sm font-medium text-slate-700">
                디바이스
              </label>
              <select
                id="device-select"
                value={device}
                onChange={(e) => setDevice(e.target.value as Device)}
                className="min-w-[120px] px-3 py-2.5 rounded-lg text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-kt-primary/20 focus:border-kt-primary"
                disabled={isAnalyzing}
                aria-label="디바이스 선택"
              >
                {DEVICES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </fieldset>
          </div>

          {/* 2단: 세부 서비스 (유형 선택 시에만 표시) */}
          {researchType != null && subServices.length > 0 && (
            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium text-slate-700">
                세부 서비스
              </legend>
              <div className="flex flex-wrap gap-2">
                {subServices.map((label) => {
                  const isSelected = subService === label;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setSubService((prev) => (prev === label ? null : label))}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                        isSelected
                          ? "border-[#1e40af]"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                      style={isSelected ? { backgroundColor: "#dbeafe", color: "#1e40af" } : undefined}
                      aria-pressed={isSelected}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {/* 3행: 주제 입력 + 분석 시작 버튼 */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-row gap-3 items-stretch min-h-[52px] flex-wrap">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={placeholder}
                className="flex-1 min-w-[200px] min-h-[52px] px-5 py-3 text-base border border-slate-200 rounded-xl bg-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-kt-primary/20 focus:border-kt-primary"
                disabled={isAnalyzing}
                aria-label="분석할 UX 주제"
              />
              <button
                type="submit"
                disabled={!topic.trim() || isAnalyzing}
                className="shrink-0 min-w-[120px] h-[52px] px-6 py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-[#1e40af] shadow-sm"
                style={{ backgroundColor: "#1e40af", color: "#ffffff" }}
              >
                {isAnalyzing ? "분석 중..." : "분석 시작"}
              </button>
              {result && reportTopic && (
                <button
                  type="button"
                  onClick={() =>
                    downloadResultPdf(
                      result,
                      reportTopic,
                      reportDate ?? new Date().toISOString()
                    )
                  }
                  className="shrink-0 h-[40px] px-3 py-2 rounded-lg text-sm font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  리포트 PDF 다운로드
                </button>
              )}
            </div>
            {/* 추천 키워드 칩: 대분류·소분류 변경 시 목록 동적 교체, 클릭 시 입력창에 반영 */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-500 shrink-0 mr-0.5">
                추천 키워드
              </span>
              {suggestedKeywords.map((keyword) => (
                <button
                  key={`${researchType ?? ""}-${subService ?? ""}-${keyword}`}
                  type="button"
                  onClick={() => setTopic(keyword)}
                  className="text-xs px-2.5 py-1 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-colors"
                >
                  {keyword}
                </button>
              ))}
            </div>
          </div>
        </form>
        {error && (
          <p className="max-w-3xl mx-auto mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>

      {/* 본문: 분석 결과가 있을 때만 4개 섹션 카드 그리드 표시 */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        {isAnalyzing && !result && (
          <div className="max-w-4xl mx-auto">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-white">
                <div className="h-5 w-48 bg-slate-200 rounded animate-skeleton-shimmer" />
                <div className="h-3 w-64 bg-slate-100 rounded mt-2 animate-skeleton-shimmer" />
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {ANALYSIS_SECTIONS.map((sectionTitle) => (
                    <article
                      key={sectionTitle}
                      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col"
                    >
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-slate-100">
                        <span className="h-4 w-4 rounded bg-slate-200 animate-skeleton-shimmer" aria-hidden />
                        <div className="h-4 w-32 bg-slate-200 rounded animate-skeleton-shimmer" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 w-full bg-slate-100 rounded animate-skeleton-shimmer" />
                        <div className="h-3 w-full bg-slate-100 rounded animate-skeleton-shimmer" />
                        <div className="h-3 w-11/12 bg-slate-100 rounded animate-skeleton-shimmer" />
                        <div className="h-3 w-full bg-slate-100 rounded animate-skeleton-shimmer" />
                        <div className="h-3 w-3/4 bg-slate-100 rounded animate-skeleton-shimmer" />
                      </div>
                      <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 p-3">
                        <div className="h-3 w-24 bg-slate-200 rounded animate-skeleton-shimmer mb-2" />
                        <div className="h-3 w-full bg-slate-100 rounded animate-skeleton-shimmer" />
                        <div className="h-3 w-4/5 bg-slate-100 rounded animate-skeleton-shimmer mt-1" />
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {result && !isAnalyzing && (
          <div className="max-w-4xl mx-auto">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-white">
                <h2 className="text-base font-semibold text-slate-800">
                  리서치 분석 결과
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  시장 현황 · 패턴 분석 · 장단점 · 인사이트
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {ANALYSIS_SECTIONS.map((sectionTitle) => {
                    const raw = result[sectionTitle] || "";
                    const { body, references } = parseSectionWithReferences(raw);
                    return (
                      <article
                        key={sectionTitle}
                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col"
                      >
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-kt-primary uppercase tracking-wider mb-3 pb-2 border-b-2 border-kt-primary/20">
                          <span aria-hidden>{SECTION_ICONS[sectionTitle]}</span>
                          {sectionTitle}
                        </h3>
                        <MarkdownContent content={body} />
                        {references.length > 0 && (
                          <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 p-3">
                            <p className="text-xs font-medium text-slate-500 mb-2">
                              참고 문헌 및 출처
                            </p>
                            <ul className="text-xs text-slate-600 space-y-1">
                              {references.map((ref, i) => (
                                <li key={i} className="flex gap-1.5">
                                  <span className="shrink-0 text-slate-400 font-medium">#출처{i + 1}</span>
                                  <span>{ref}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {!result && !isAnalyzing && (
          <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-16 text-center">
            <p className="text-slate-500 text-sm">
              분석할 UX 주제를 입력한 뒤 「분석 시작」을 눌러 주세요.
            </p>
            <p className="text-slate-400 text-xs mt-1">
              시장 현황, UI/UX 패턴, 장단점 비교, 인사이트가 카드 형태로 나타납니다.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
