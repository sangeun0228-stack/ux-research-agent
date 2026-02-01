"use client";

import { useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import ChatInterface from "@/components/ChatInterface";
import type { ResearchSession } from "@/types/research";

const MOCK_SESSIONS: ResearchSession[] = [
  {
    id: "1",
    title: "온보딩 플로우 사용성 테스트",
    summary: "신규 사용자 온보딩 5단계 검증",
    createdAt: "2025-01-31",
    messageCount: 12,
  },
  {
    id: "2",
    title: "결제 페이지 개선 리서치",
    summary: "결제 이탈률 감소를 위한 인터뷰",
    createdAt: "2025-01-30",
    messageCount: 8,
  },
  {
    id: "3",
    title: "네비게이션 IA 카드 소팅",
    summary: "정보 아키텍처 검증",
    createdAt: "2025-01-29",
    messageCount: 15,
  },
  {
    id: "4",
    title: "모바일 검색 UX 개선",
    summary: "검색 결과 페이지 개선 방향",
    createdAt: "2025-01-28",
    messageCount: 6,
  },
];

export default function DashboardPage() {
  const [sessions] = useState<ResearchSession[]>(MOCK_SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const sessionTitle = activeSession?.title ?? null;

  const handleNewResearch = useCallback(() => {
    setActiveSessionId(null);
  }, []);

  const handleSendMessage = useCallback((_content: string) => {
    // 추후 API 연동 시 사용
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-100">
      <Sidebar
        sessions={sessions}
        activeId={activeSessionId ?? undefined}
        onSelect={setActiveSessionId}
        onNewResearch={handleNewResearch}
      />
      <ChatInterface
        sessionTitle={sessionTitle ?? undefined}
        onSend={handleSendMessage}
      />
    </div>
  );
}
