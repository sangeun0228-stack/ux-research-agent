export interface ResearchSession {
  id: string;
  title: string;
  summary?: string;
  createdAt: string;
  messageCount: number;
}

/** 리서치 유형 (KT DS 업무 환경 기준, 히스토리 아이콘 표시용. 레거시 값은 미표시) */
export type ResearchTypeLabel =
  | "대국민/B2C"
  | "업무용/Admin"
  | "인프라/DX";

/** localStorage에 저장되는 리서치 히스토리 한 건 (4단계 분석 결과 포함) */
export interface ResearchHistoryItem {
  id: string;
  topic: string;
  createdAt: string;
  result: Record<string, string>;
  /** 선택했던 리서치 유형 (아이콘 표시용, 이전 데이터 호환을 위해 선택) */
  researchType?: ResearchTypeLabel | null;
}

const STORAGE_KEY = "ux-research-history";

export function getResearchHistory(): ResearchHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveResearchHistory(items: ResearchHistoryItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}
