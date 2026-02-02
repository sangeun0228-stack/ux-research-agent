import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  getSystemPromptForResearchType,
  buildUserMessage,
  type ApiAnalysisInput,
  type ResearchType,
  type Device,
} from "@/lib/analysisPrompt";

const RESEARCH_TYPES: ResearchType[] = ["대국민/B2C", "업무용/Admin", "인프라/DX"];
const DEVICES: Device[] = ["모바일", "웹"];

function parseBody(body: unknown): ApiAnalysisInput | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const topic = typeof o.topic === "string" ? o.topic.trim() : "";
  if (!topic) return null;
  const researchType =
    typeof o.researchType === "string" && RESEARCH_TYPES.includes(o.researchType as ResearchType)
      ? (o.researchType as ResearchType)
      : null;
  const device =
    typeof o.device === "string" && DEVICES.includes(o.device as Device)
      ? (o.device as Device)
      : "모바일";
  const subService =
    o.subService != null && o.subService !== "" ? String(o.subService) : null;
  return { researchType, subService, device, topic };
}

function getApiKey(): string | null {
  const key =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    process.env.GEMINI_API_KEY?.trim() ||
    "";
  return key || null;
}

export async function POST(request: Request) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "API 키가 설정되지 않았습니다. 프로젝트 루트의 .env.local에 GOOGLE_GENERATIVE_AI_API_KEY=발급받은키 를 추가한 뒤 개발 서버를 재시작해주세요.",
      },
      { status: 500 }
    );
  }

  let input: ApiAnalysisInput;
  try {
    const body = await request.json();
    input = parseBody(body) ?? ({} as ApiAnalysisInput);
    if (!input.topic) {
      return NextResponse.json(
        { error: "topic is required" },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const systemInstruction =
    getSystemPromptForResearchType(input.researchType, {
      includeReferencesPrompt: true,
      device: input.device,
    }) ?? undefined;
  const userMessage = buildUserMessage(input);

  const modelName = "gemini-2.0-flash";
  const fallbackModel = "gemini-1.5-flash";
  let lastError: unknown = null;

  for (const name of [modelName, fallbackModel]) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: name,
        systemInstruction,
      });
      const result = await model.generateContentStream(userMessage);
      let text = "";
      for await (const chunk of result.stream) {
        const part = chunk.text();
        if (part) text += part;
      }
      if (!text) continue;
      return NextResponse.json({ text });
    } catch (err) {
      lastError = err;
      if (err instanceof Error && /404|not found|invalid model/i.test(err.message)) {
        continue;
      }
      break;
    }
  }

  try {
    throw lastError;
  } catch (err) {
    console.error("Gemini API error:", err);
    const message =
      err instanceof Error ? err.message : "Unknown error";
    const isAuthError =
      message.includes("API_KEY") ||
      message.includes("403") ||
      message.includes("401") ||
      message.includes("invalid");
    const userMessage = isAuthError
      ? "API 키가 유효하지 않거나 만료되었습니다. Google AI Studio에서 새 키를 발급받아 .env.local을 수정한 뒤 서버를 재시작해주세요."
      : `Gemini API 오류: ${message}. 네트워크와 API 키를 확인해주세요.`;
    return NextResponse.json({ error: userMessage }, { status: 502 });
  }
}
