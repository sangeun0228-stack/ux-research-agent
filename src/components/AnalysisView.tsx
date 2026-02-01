"use client";

import { useState } from "react";
import { useMounted } from "@/hooks/useMounted";

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

/** 유형·세부서비스별 추천 키워드 (클릭 시 입력창에 반영) */
export const SUGGESTED_KEYWORDS: Record<ResearchType, readonly string[]> = {
  "대국민/B2C": [
    "통신사 멤버십 메인 화면 UI",
    "공공포털 접근성 개선",
    "이커머스 결제 플로우",
    "앱 온보딩 사용성",
  ],
  "업무용/Admin": [
    "전사 자원 관리 대시보드",
    "ERP 테이블·필터 UX",
    "CRM 영업 단계별 화면",
    "보고서 위젯 배치",
  ],
  "인프라/DX": [
    "클라우드 리소스 모니터링 UI",
    "알림·이벤트 대시보드",
    "API 문서·설정 화면",
    "파이프라인 실행 뷰",
  ],
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

export interface AnalysisResult {
  [key: string]: string;
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
  researchType: ResearchType | null
): string | null {
  if (!researchType) return null;
  return RESEARCH_TYPE_SYSTEM_PROMPTS[researchType] ?? null;
}

/** 데모: 유형별 시스템 프롬프트를 반영한 목업 분석 (API 연동 시 systemPrompt를 AI에 전달) */
function fetchMockAnalysis(input: AnalysisInput): Promise<AnalysisResult> {
  const context = buildAnalysisContext(input);
  const { researchType, device, topic } = input;
  const topicLabel = topic.trim() || "주제";
  const systemPrompt = researchType
    ? getSystemPromptForResearchType(researchType)
    : null;

  const typeContext = systemPrompt
    ? ` (분석 시 다음 지침 적용: ${systemPrompt.slice(0, 80)}…)`
    : "";

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        "시장 현황": `[${context}]${typeContext}\n\n"${topicLabel}" 관련 국내·해외 시장 규모와 성장률, 주요 플레이어 현황을 정리했습니다. ${researchType ? `${researchType} 환경에 맞춰 ` : ""}${device} 기준 시장 조사 자료를 반영했으며, 해당 유형 서비스의 규제·표준(예: 대국민/B2C 시 공공 웹 접근성 준수 여부, 업무용 시 도메인 표준 등)을 고려한 차별화 포인트를 제시했습니다.`,
        "UI/UX 패턴 분석": `[${context}]${typeContext}\n\n"${topicLabel}" 도메인에서 자주 쓰이는 UI/UX 패턴을 ${device} 중심으로 정리했습니다. ${researchType ? `선택하신 유형(${researchType})의 특수성(접근성·효율성·구조 가시성 등)을 반영한 ` : ""}업계 표준 패턴과 트렌드 사례를 분석했습니다.`,
        "장단점 비교": `[${context}]${typeContext}\n\n주요 경쟁/참고 서비스별 장점·단점을 비교했습니다. ${device} 환경을 기준으로 ${researchType ? `${researchType} 관점(사용자 접근성·업무 효율·시스템 가시성 등)에 맞춰 ` : ""}개선 포인트를 도출했습니다.`,
        "인사이트 도출": `[${context}]${typeContext}\n\n시장·패턴·비교 분석을 바탕으로 "${topicLabel}" 개선을 위한 핵심 인사이트와 추천 액션을 정리했습니다. ${researchType ? `선택 유형(${researchType})의 환경 특수성을 반영한 ` : ""}우선순위별 로드맵 제안을 포함합니다.`,
      });
    }, 1500);
  });
}

export interface AnalysisViewProps {
  /** 히스토리에서 선택했을 때 보여줄 결과 (부모가 관리) */
  displayedResult?: AnalysisResult | null;
  /** 분석 완료 시 호출: 주제, 결과, 리서치 유형을 넘겨 히스토리 저장 등에 사용 */
  onAnalysisComplete?: (
    topic: string,
    result: AnalysisResult,
    researchType: ResearchType | null
  ) => void;
}

export default function AnalysisView({
  displayedResult = null,
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
  const suggestedKeywords =
    researchType != null ? SUGGESTED_KEYWORDS[researchType] : DEFAULT_KEYWORDS;
  const subServices = researchType != null ? SUB_SERVICES_BY_TYPE[researchType] : [];

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
      const data = await fetchMockAnalysis(input);
      setLocalResult(data);
      onAnalysisComplete?.(trimmed, data, researchType);
    } catch {
      setError("분석 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!mounted) {
    return (
      <main className="flex-1 flex flex-col min-w-0 bg-surface-50">
        <div className="shrink-0 p-6 border-b border-surface-200 bg-white animate-pulse">
          <div className="max-w-3xl mx-auto flex gap-3">
            <div className="flex-1 h-14 bg-surface-200 rounded-xl" />
            <div className="w-28 h-14 bg-surface-200 rounded-xl" />
          </div>
        </div>
        <div className="flex-1 p-6" />
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-surface-50">
      {/* 입력 영역: 리서치 유형 + 디바이스 + 주제 + 분석 시작 */}
      <div className="shrink-0 p-6 border-b border-surface-200 bg-white">
        <form
          onSubmit={handleStartAnalysis}
          className="max-w-3xl mx-auto flex flex-col gap-4"
        >
          {/* 1단: 리서치 유형(버튼 3개) + 디바이스(드롭다운) */}
          <div className="flex flex-wrap items-end gap-6">
            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium text-surface-700">
                리서치 유형
              </legend>
              <div className="flex gap-2">
                {RESEARCH_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleResearchTypeChange(type)}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      researchType === type
                        ? "bg-accent text-white"
                        : "bg-surface-100 text-surface-700 hover:bg-surface-200"
                    }`}
                    aria-pressed={researchType === type}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="flex flex-col gap-2">
              <label htmlFor="device-select" className="text-sm font-medium text-surface-700">
                디바이스
              </label>
              <select
                id="device-select"
                value={device}
                onChange={(e) => setDevice(e.target.value as Device)}
                className="min-w-[120px] px-3 py-2.5 rounded-lg text-sm border border-surface-200 bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
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
              <legend className="text-sm font-medium text-surface-700">
                세부 서비스
              </legend>
              <div className="flex flex-wrap gap-2">
                {subServices.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setSubService((prev) => (prev === label ? null : label))}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                      subService === label
                        ? "bg-accent-muted text-accent-hover border-accent/40"
                        : "bg-white border-surface-200 text-surface-700 hover:border-surface-300"
                    }`}
                    aria-pressed={subService === label}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {/* 3행: 주제 입력 + 분석 시작 버튼 */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex flex-col gap-2">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={placeholder}
                className="w-full min-h-[52px] px-5 py-3 text-base border border-surface-200 rounded-xl bg-surface-50 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                disabled={isAnalyzing}
                aria-label="분석할 UX 주제"
              />
              {/* 추천 키워드: 클릭 시 입력창에 반영 */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-surface-500 shrink-0">
                  추천 키워드
                </span>
                {suggestedKeywords.map((keyword) => (
                  <button
                    key={keyword}
                    type="button"
                    onClick={() => setTopic(keyword)}
                    className="text-xs px-2.5 py-1.5 rounded-md bg-surface-100 text-surface-600 hover:bg-surface-200 hover:text-surface-800 transition-colors"
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={!topic.trim() || isAnalyzing}
              className="shrink-0 px-6 py-3 min-h-[52px] rounded-xl bg-accent text-white font-medium hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-start sm:self-auto"
            >
              {isAnalyzing ? "분석 중…" : "분석 시작"}
            </button>
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
          <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-16 gap-4">
            <span className="inline-flex gap-1">
              <span className="w-2 h-2 rounded-full bg-accent animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 rounded-full bg-accent animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 rounded-full bg-accent animate-bounce" />
            </span>
            <p className="text-sm text-surface-500">UX 주제를 분석하고 있습니다.</p>
          </div>
        )}

        {result && !isAnalyzing && (
          <div className="max-w-4xl mx-auto">
            <h2 className="sr-only">분석 결과</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ANALYSIS_SECTIONS.map((sectionTitle) => (
                <article
                  key={sectionTitle}
                  className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm"
                >
                  <h3 className="text-sm font-semibold text-surface-800 uppercase tracking-wider mb-3 pb-2 border-b border-surface-100">
                    {sectionTitle}
                  </h3>
                  <div className="text-sm text-surface-700 leading-relaxed whitespace-pre-wrap">
                    {result[sectionTitle] || "—"}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {!result && !isAnalyzing && (
          <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-16 text-center">
            <p className="text-surface-500 text-sm">
              분석할 UX 주제를 입력한 뒤 「분석 시작」을 눌러 주세요.
            </p>
            <p className="text-surface-400 text-xs mt-1">
              시장 현황, UI/UX 패턴, 장단점 비교, 인사이트가 카드 형태로 나타납니다.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
