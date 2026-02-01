"use client";

import { useState, useMemo } from "react";
import type { ResearchHistoryItem, ResearchTypeLabel } from "@/types/research";

function formatHistoryDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
    if (isToday) {
      return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

const iconSvgClass = "w-full h-full";

/** 리서치 유형별 작은 아이콘 (대국민/B2C: 사용자군, 업무용/Admin: 테이블·효율, 인프라/DX: 클라우드) */
function ResearchTypeIcon({ type }: { type: ResearchTypeLabel | string }) {
  const wrapperClass = "w-4 h-4 shrink-0 text-surface-500";
  switch (type) {
    case "대국민/B2C":
      return (
        <span className={wrapperClass} title="대국민/B2C" aria-hidden>
          <svg className={iconSvgClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </span>
      );
    case "업무용/Admin":
      return (
        <span className={wrapperClass} title="업무용/Admin" aria-hidden>
          <svg className={iconSvgClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
        </span>
      );
    case "인프라/DX":
      return (
        <span className={wrapperClass} title="인프라/DX" aria-hidden>
          <svg className={iconSvgClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
          </svg>
        </span>
      );
    default:
      return null;
  }
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

export default function Sidebar({
  history,
  activeId,
  onSelect,
  onNewResearch,
  onDelete,
}: {
  history: ResearchHistoryItem[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  onNewResearch?: () => void;
  onDelete?: (id: string) => void;
}) {
  const [search, setSearch] = useState("");

  const sorted = useMemo(
    () => [...history].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [history]
  );

  const filtered = useMemo(
    () =>
      sorted.filter((item) =>
        item.topic.toLowerCase().includes(search.toLowerCase())
      ),
    [sorted, search]
  );

  return (
    <aside className="w-[var(--sidebar-width)] shrink-0 flex flex-col h-full bg-white border-r border-surface-200">
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

      <nav className="flex-1 overflow-y-auto scrollbar-thin p-2" aria-label="리서치 히스토리 목록">
        <ul className="space-y-0.5">
          {filtered.length === 0 ? (
            <li className="py-6 text-center text-sm text-surface-500">
              {search ? "검색 결과가 없습니다." : "최근 리서치 내역이 없습니다."}
            </li>
          ) : (
            filtered.map((item) => (
              <li key={item.id}>
                <div
                  className={`group flex items-start gap-2 w-full p-3 rounded-lg transition-colors border ${
                    activeId === item.id
                      ? "bg-accent-muted text-accent-hover border-accent/30"
                      : "text-surface-700 hover:bg-surface-100 border-transparent"
                  }`}
                >
                  {item.researchType && (
                    <span className="mt-0.5 shrink-0 flex items-center justify-center w-5 h-5 rounded bg-surface-100 text-surface-500">
                      <ResearchTypeIcon type={item.researchType} />
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onSelect?.(item.id)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <span className="block text-sm font-medium truncate">
                      {item.topic}
                    </span>
                    <span className="flex items-center gap-1.5 mt-1 text-xs text-surface-400">
                      {formatHistoryDate(item.createdAt)}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(item.id);
                    }}
                    className="shrink-0 p-1.5 rounded text-surface-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    aria-label="이 리서치 내역 삭제"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </nav>
    </aside>
  );
}
