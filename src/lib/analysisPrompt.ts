/**
 * API 라우트에서 Gemini 호출 시 사용하는 시스템/유저 프롬프트 생성
 * (클라이언트 AnalysisView와 동일한 지침 적용)
 */

export type ResearchType = "대국민/B2C" | "업무용/Admin" | "인프라/DX";
export type Device = "모바일" | "웹";

export interface ApiAnalysisInput {
  researchType: ResearchType | null;
  subService?: string | null;
  device: Device;
  topic: string;
}

const RESEARCH_TYPE_SYSTEM_PROMPTS: Record<ResearchType, string> = {
  "대국민/B2C": `[대국민/B2C] 불특정 다수가 사용하는 서비스입니다. 다음 관점을 반드시 반영해 분석하세요: 접근성(공공기관 웹 접근성 준수 여부, WCAG·KWCAG 등), 쉬운 사용성(비전문가도 이해하기 쉬운 UI·용어·플로우), 인클루시브 디자인. 공공·민간 대국민 서비스 사례를 참고하세요.`,
  "업무용/Admin": `[업무용/Admin] 전문가가 사용하는 대형 시스템입니다. 다음 관점을 반드시 반영해 분석하세요: 업무 효율성(단축키·대량 처리·워크플로 최적화), 데이터 가독성(테이블·차트·필터·정렬), 역할별 권한·감사 로그. ERP·관리자 콘솔·내부 업무 시스템 사례를 참고하세요.`,
  "인프라/DX": `[인프라/DX] 클라우드·기술 플랫폼·DX 솔루션입니다. 다음 관점을 반드시 반영해 분석하세요: 논리적 정보 구조(IA·네임스페이스·리소스 계층), 시스템 가시성(모니터링·대시보드·알림), API·설정·통합 UX. DevOps·클라우드 콘솔·플랫폼 관리자 UX 사례를 참고하세요.`,
};

const DEVICE_SYSTEM_PROMPTS: Record<Device, string> = {
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

const REFERENCES_SYSTEM_PROMPT = `[참고 문헌 및 출처] 각 섹션 분석을 마칠 때, 해당 분석의 근거가 된 참고 문헌 및 출처를 답변 마지막에 반드시 포함하세요.
- 본문에서 인용할 때는 #출처1, #출처2, #출처3와 같이 구분자로 표기하세요.
- [참고 문헌 및 출처] 제목 아래에 각 출처를 한 줄씩 나열하세요. 형식: #출처1: 서비스명 또는 출처명, URL(선택)
- 실제 존재하는 웹사이트 URL이나 서비스·문서 명칭을 사용하세요. 예: Nielsen Norman Group, Toss UX 리포트, 정부24 웹 접근성 가이드라인, WCAG 2.1, Material Design Guidelines 등.`;

export function buildAnalysisContext(input: ApiAnalysisInput): string {
  const parts: string[] = [];
  if (input.researchType) parts.push(`리서치 유형: ${input.researchType}`);
  if (input.subService) parts.push(`세부 서비스: ${input.subService}`);
  parts.push(`디바이스: ${input.device}`);
  parts.push(`주제: ${input.topic.trim()}`);
  return parts.join(", ");
}

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

/** Gemini에 보낼 사용자 메시지 본문 생성 */
export function buildUserMessage(input: ApiAnalysisInput): string {
  const context = buildAnalysisContext(input);
  return `다음 조건으로 UX 리서치 분석을 해주세요.

${context}

응답은 반드시 다음 4개 섹션을 #시장현황, #패턴분석, #장단점, #인사이트 로 구분해서 작성해주세요. 각 섹션 제목 다음에 본문을 작성하고, 각 섹션 끝에 [참고 문헌 및 출처]를 포함해주세요.`;
}
