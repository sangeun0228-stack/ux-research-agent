"use client";

import { useState, useRef, useEffect } from "react";
import { useMounted } from "@/hooks/useMounted";

/** API 실패 시 시연용으로 보여줄 미리 준비된 샘플 데이터 */
const SAMPLE_DATA =
  "【샘플 응답】\n\n선택하신 조건을 반영한 UX 리서치 방향을 정리했습니다.\n\n• **리서치 목표**: 사용자 입력 내용을 바탕으로 플랜 초안 제안\n• **추천 방법론**: 인터뷰, 사용성 테스트, 휴리스틱 평가\n• **다음 단계**: 타겟 사용자와 제약 조건을 구체화하시면 질문 초안을 작성해 드리겠습니다.\n\n(이 메시지는 API 연결이 되지 않을 때 보여지는 샘플 데이터입니다.)";

export interface ChatInterfaceProps {
  sessionTitle?: string;
  /** 리서치 유형 (예: 대국민/B2C, 업무용/Admin, 인프라/DX) */
  researchType?: string | null;
  /** 세부 서비스 */
  serviceDetail?: string | null;
  /** 디바이스 유형 (예: 모바일, 웹) */
  deviceType?: string | null;
}

export default function ChatInterface({
  sessionTitle,
  researchType = null,
  serviceDetail = null,
  deviceType = null,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const mounted = useMounted();

  useEffect(() => {
    if (!mounted || !resultRef.current) return;
    resultRef.current.scrollIntoView({ behavior: "smooth" });
  }, [result, mounted]);

  const handleResearch = async () => {
    console.log("버튼 클릭됨");

    setResult(null);
    setIsLoading(true);

    const payload = {
      researchType: researchType ?? null,
      serviceDetail: serviceDetail ?? null,
      deviceType: deviceType ?? null,
      input: input.trim() || "",
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok || res.status === 404) {
        const data = await res.json().catch(() => ({}));
        const errorMsg =
          typeof data?.error === "string"
            ? data.error
            : "서버 연결에 실패했습니다. API 키와 네트워크를 확인해주세요.";
        if (typeof window !== "undefined") {
          alert(errorMsg);
        }
        setResult(SAMPLE_DATA);
        return;
      }

      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("text/plain") && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setResult(accumulated);
        }
        if (!accumulated) setResult(SAMPLE_DATA);
      } else {
        const data = await res.json().catch(() => ({}));
        const text = typeof data?.text === "string" ? data.text : "";
        setResult(text || SAMPLE_DATA);
      }
    } catch (e) {
      const errorMsg =
        e instanceof Error ? e.message : "서버 연결에 실패했습니다. API 키와 네트워크를 확인해주세요.";
      if (typeof window !== "undefined") {
        alert(errorMsg);
      }
      setResult(SAMPLE_DATA);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return (
      <main className="flex-1 flex flex-col min-w-0 bg-surface-50">
        <header className="shrink-0 h-14 px-6 border-b border-surface-200 bg-white animate-pulse" />
        <div className="flex-1 p-6" />
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-surface-50">
      <header className="shrink-0 flex items-center gap-3 h-14 px-6 border-b border-surface-200 bg-white">
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-surface-800 truncate">
            {sessionTitle || "새 리서치"}
          </h1>
          <p className="text-xs text-surface-500">UX 리서치 에이전트</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <div>
            <label htmlFor="chat-input" className="block text-sm font-medium text-surface-700 mb-2">
              리서치 목표 / 입력
            </label>
            <textarea
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="리서치 목표, 타겟 사용자, 방법론 등을 입력하세요..."
              rows={3}
              className="w-full resize-none rounded-xl border border-surface-200 bg-white px-4 py-3 text-sm placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isLoading}
              aria-label="리서치 입력"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleResearch}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl font-semibold bg-accent text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-busy={isLoading}
              aria-label={isLoading ? "분석 중" : "새 리서치 시작"}
            >
              {isLoading ? "분석 중..." : "새 리서치 시작"}
            </button>
            {isLoading && (
              <span className="text-sm text-surface-500" aria-live="polite">
                분석 중...
              </span>
            )}
          </div>

          {result != null && (
            <div
              ref={resultRef}
              className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm"
              role="region"
              aria-label="리서치 결과"
            >
              <h2 className="text-sm font-semibold text-surface-800 mb-3">리서치 결과</h2>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-surface-700">
                {result}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
