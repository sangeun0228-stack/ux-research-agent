import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * [샘플 리서치 데이터] — API/네트워크 실패 또는 API 키 미설정 시
 * 인터넷이 안 되는 시연 환경에서도 결과가 나오도록 즉시 JSON으로 반환하는 데이터.
 * kt ds 업무와 관련된 그럴듯한 예시 내용으로 구성.
 */
const SAMPLE_RESEARCH_DATA = {
  text: `# 시장 현황
kt ds가 서비스하는 B2B·공공·인프라 도메인에서 UX 리서치 수요가 연평균 15% 이상 성장하고 있습니다. 특히 통신사 내부 업무 시스템, 공공 포털, 클라우드 콘솔 등에서 사용성 개선과 접근성 준수 요구가 높아지고 있으며, NPS 및 업무 효율성 지표가 예산 편성의 근거로 활용되는 추세입니다.

# 패턴 분석
• **대국민/공공**: 메가메뉴·단계별 안내·WCAG 준수 패턴이 표준화되고 있으며, 키보드만으로 전체 플로우 조작이 가능한 패턴이 권장됩니다.
• **업무용/Admin**: 대시보드 위젯·필터·대용량 테이블 정렬·결재 라인 UI 패턴이 도입 사례별로 정리되어 있고, 단축키와 벌크 액션이 필수 요건으로 다뤄집니다.
• **인프라/DX**: 리소스 트리·모니터링 차트·알림 규칙 설정·API 문서 연동 UI 패턴이 클라우드 벤더 가이드와 내부 디자인 시스템에 반영되고 있습니다.

# 장단점
**장점**: kt ds 영역의 실제 도메인 지식과 접근성·효율성 요구를 반영한 리서치 플랜을 빠르게 도출할 수 있음.  
**단점**: 도메인 전문가 검수와 실제 사용자 테스트 없이 가이드만 적용할 경우 현장 이슈가 누락될 수 있음.  
**적용 포인트**: 시연·제안 단계에서는 본 샘플과 같은 구조화된 포맷으로 제시하고, 실제 프로젝트에서는 타겟 사용자 인터뷰와 휴리스틱 평가를 병행하는 것을 권장합니다.

# 인사이트
• 리서치 목표와 타겟(대국민/업무용/인프라)을 먼저 정의하면, 적합한 방법론(인터뷰, 사용성 테스트, 휴리스틱 평가) 선정이 수월합니다.
• kt ds 업무 맥락에서는 접근성(WCAG)·업무 효율성·시스템 가시성 중 어떤 축을 우선할지에 따라 질문 초안과 플랜이 달라집니다.
• 본 응답은 네트워크 또는 API 연결이 되지 않은 환경에서 표시되는 샘플 데이터입니다.`,
};

const RESEARCH_TYPES = ["대국민/B2C", "업무용/Admin", "인프라/DX"] as const;
const DEVICES = ["모바일", "웹"] as const;

interface ChatBody {
  message: string;
  researchType?: string | null;
  subService?: string | null;
  device?: string | null;
}

function parseBody(body: unknown): ChatBody | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const message =
    (typeof o.message === "string" ? o.message.trim() : "") ||
    (typeof o.input === "string" ? o.input.trim() : "");
  if (!message) return null;
  const researchType =
    typeof o.researchType === "string" && RESEARCH_TYPES.includes(o.researchType as (typeof RESEARCH_TYPES)[number])
      ? o.researchType
      : null;
  const device =
    (typeof o.device === "string" && DEVICES.includes(o.device as (typeof DEVICES)[number])
      ? o.device
      : null) ||
    (typeof o.deviceType === "string" && DEVICES.includes(o.deviceType as (typeof DEVICES)[number])
      ? o.deviceType
      : null);
  const subService =
    o.subService != null && o.subService !== ""
      ? String(o.subService)
      : o.serviceDetail != null && o.serviceDetail !== ""
        ? String(o.serviceDetail)
        : null;
  return { message, researchType, subService, device };
}

function buildChatSystemPrompt(ctx: ChatBody): string {
  const parts: string[] = [
    "당신은 UX 리서치 에이전트입니다. 사용자의 리서치 목표, 타겟 사용자, 방법론 등을 듣고 플랜과 질문 초안을 도와줍니다.",
  ];
  if (ctx.researchType) parts.push(`리서치 유형: ${ctx.researchType}`);
  if (ctx.subService) parts.push(`세부 서비스: ${ctx.subService}`);
  if (ctx.device) parts.push(`디바이스: ${ctx.device}`);
  return parts.join("\n");
}

/** 환경 변수에서 API 키 조회. 없으면 null */
function getApiKey(): string | null {
  try {
    const key =
      process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
      process.env.GEMINI_API_KEY?.trim() ||
      "";
    return key || null;
  } catch {
    return null;
  }
}

/**
 * Gemini API 호출 실패(네트워크·서버 오류 등) 시 에러를 던지지 않고
 * [샘플 리서치 데이터]를 JSON으로 즉시 반환.
 */
function respondWithSampleData() {
  return NextResponse.json(SAMPLE_RESEARCH_DATA, { status: 200 });
}

export async function POST(request: Request) {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return respondWithSampleData();
    }

    let body: ChatBody;
    try {
      const raw = await request.json();
      body = parseBody(raw) ?? ({} as ChatBody);
      if (!body.message) {
        return respondWithSampleData();
      }
    } catch {
      return respondWithSampleData();
    }

    const systemInstruction = buildChatSystemPrompt(body);
    const modelName = "gemini-2.0-flash";

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
      });
      const result = await model.generateContent(body.message);
      const response = result.response;
      const text =
        typeof response?.text === "function" ? response.text() : (response as { text?: string })?.text ?? "";
      if (typeof text !== "string" || !text.trim()) {
        return respondWithSampleData();
      }
      return NextResponse.json({ text });
    } catch {
      return respondWithSampleData();
    }
  } catch {
    return respondWithSampleData();
  }
}
