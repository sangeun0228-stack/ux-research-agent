"use client";

import { useState, useRef, useEffect } from "react";
import { useMounted } from "@/hooks/useMounted";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const WELCOME_CONTENT = "안녕하세요. UX 리서치 에이전트입니다. 리서치 목표, 타겟 사용자, 방법론 등을 알려주시면 플랜과 질문 초안을 도와드립니다.";

function createWelcomeMessage(): Message {
  return {
    id: "welcome",
    role: "assistant",
    content: WELCOME_CONTENT,
    timestamp: new Date(),
  };
}

export default function ChatInterface({
  sessionTitle,
  onSend,
}: {
  sessionTitle?: string;
  onSend?: (content: string) => void;
}) {
  // 페이지가 마운트된 뒤에만 이 컴포넌트가 렌더되므로, 초기화 함수는 클라이언트에서만 실행됨 (Hydration 안전)
  const [messages, setMessages] = useState<Message[]>(() => [createWelcomeMessage()]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const mounted = useMounted();

  useEffect(() => {
    if (!mounted) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, mounted]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    onSend?.(trimmed);

    // 데모: 간단한 자동 응답
    setTimeout(() => {
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: `"${trimmed}"에 대한 리서치 방향을 정리해 보겠습니다. 목표, 타겟, 제약 조건을 조금 더 구체적으로 알려주시면 플랜 초안을 작성해 드리겠습니다.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 800);
  };

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-surface-50">
      {/* 채팅 헤더 */}
      <header className="shrink-0 flex items-center gap-3 h-14 px-6 border-b border-surface-200 bg-white">
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-surface-800 truncate">
            {sessionTitle || "새 리서치"}
          </h1>
          <p className="text-xs text-surface-500">UX 리서치 에이전트와 대화하세요</p>
        </div>
      </header>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-4">
        <ul className="space-y-6 max-w-2xl mx-auto">
          {messages.map((msg) => (
            <li
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-accent text-white rounded-br-md"
                    : "bg-white border border-surface-200 text-surface-800 rounded-bl-md shadow-sm"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
                <p
                  className={`mt-1.5 text-xs ${
                    msg.role === "user" ? "text-white/80" : "text-surface-400"
                  }`}
                >
                  {mounted
                    ? msg.timestamp.toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "--:--"}
                </p>
              </div>
            </li>
          ))}
          {isLoading && (
            <li className="flex justify-start">
              <div className="bg-white border border-surface-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <span className="inline-flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-surface-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 rounded-full bg-surface-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-surface-400 animate-bounce" />
                </span>
              </div>
            </li>
          )}
        </ul>
        <div ref={bottomRef} aria-hidden />
      </div>

      {/* 입력 영역 */}
      <footer className="shrink-0 p-4 bg-white border-t border-surface-200">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="flex gap-3 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="리서치 목표, 타겟, 방법론 등을 입력하세요..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent min-h-[44px] max-h-32"
              disabled={isLoading}
              aria-label="메시지 입력"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-accent text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              aria-label="전송"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-xs text-surface-400 text-center">
            Enter로 전송, Shift+Enter로 줄바꿈
          </p>
        </form>
      </footer>
    </main>
  );
}
