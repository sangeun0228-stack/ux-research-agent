"use client";

import { useState } from "react";
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

export default function Sidebar({
  sessions = MOCK_SESSIONS,
  activeId,
  onSelect,
  onNewResearch,
}: {
  sessions?: ResearchSession[];
  activeId?: string;
  onSelect?: (id: string) => void;
  onNewResearch?: () => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = sessions.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.summary?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="w-[var(--sidebar-width)] shrink-0 flex flex-col h-full bg-white border-r border-surface-200">
      {/* 헤더 */}
      <div className="p-4 border-b border-surface-100">
        <h2 className="text-sm font-semibold text-surface-700 uppercase tracking-wider mb-3">
          리서치 히스토리
        </h2>
        <button
          type="button"
          onClick={onNewResearch}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          <span aria-hidden>+</span>
          새 리서치 시작
        </button>
        <div className="mt-3 relative">
          <input
            type="search"
            placeholder="히스토리 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-surface-200 rounded-lg bg-surface-50 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            aria-label="리서치 히스토리 검색"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* 리스트 */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin p-2" aria-label="리서치 세션 목록">
        <ul className="space-y-0.5">
          {filtered.length === 0 ? (
            <li className="py-6 text-center text-sm text-surface-500">
              {search ? "검색 결과가 없습니다." : "리서치 세션이 없습니다."}
            </li>
          ) : (
            filtered.map((session) => (
              <li key={session.id}>
                <button
                  type="button"
                  onClick={() => onSelect?.(session.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    activeId === session.id
                      ? "bg-accent-muted text-accent-hover border border-accent/30"
                      : "text-surface-700 hover:bg-surface-100 border border-transparent"
                  }`}
                >
                  <span className="block text-sm font-medium truncate">
                    {session.title}
                  </span>
                  {session.summary && (
                    <span className="block text-xs text-surface-500 mt-0.5 line-clamp-2">
                      {session.summary}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 mt-1.5 text-xs text-surface-400">
                    <span>{session.createdAt}</span>
                    <span>·</span>
                    <span>메시지 {session.messageCount}개</span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </nav>
    </aside>
  );
}
