"use client";

import { useState, useCallback, useEffect } from "react";
import { useMounted } from "@/hooks/useMounted";
import Sidebar from "@/components/Sidebar";
import AnalysisView from "@/components/AnalysisView";
import {
  getResearchHistory,
  saveResearchHistory,
  type ResearchHistoryItem,
} from "@/types/research";
import type { AnalysisResult } from "@/components/AnalysisView";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function DashboardPage() {
  const [history, setHistory] = useState<ResearchHistoryItem[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [displayedResult, setDisplayedResult] = useState<AnalysisResult | null>(null);
  const mounted = useMounted();

  useEffect(() => {
    if (!mounted) return;
    setHistory(getResearchHistory());
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    saveResearchHistory(history);
  }, [mounted, history]);

  const handleAnalysisComplete = useCallback(
    (
      topic: string,
      result: AnalysisResult,
      researchType: ResearchHistoryItem["researchType"]
    ) => {
      const newItem: ResearchHistoryItem = {
        id: generateId(),
        topic,
        createdAt: new Date().toISOString(),
        result,
        researchType: researchType ?? undefined,
      };
      setHistory((prev) => [newItem, ...prev]);
      setActiveHistoryId(newItem.id);
      setDisplayedResult(result);
    },
    []
  );

  const handleDeleteHistory = useCallback((id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
    if (activeHistoryId === id) {
      setActiveHistoryId(null);
      setDisplayedResult(null);
    } else {
      setActiveHistoryId((current) => (current === id ? null : current));
    }
  }, [activeHistoryId]);

  const handleSelectHistory = useCallback(
    (id: string) => {
      const item = history.find((h) => h.id === id);
      if (item) {
        setActiveHistoryId(item.id);
        setDisplayedResult(item.result);
      }
    },
    [history]
  );

  const handleNewResearch = useCallback(() => {
    setActiveHistoryId(null);
    setDisplayedResult(null);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-screen overflow-hidden bg-surface-100" aria-busy="true">
        <aside className="w-[280px] shrink-0 bg-white border-r border-surface-200 animate-pulse">
          <div className="p-4 border-b border-surface-100 space-y-3">
            <div className="h-4 bg-surface-200 rounded w-32" />
            <div className="h-10 bg-surface-200 rounded" />
            <div className="h-10 bg-surface-200 rounded" />
          </div>
          <div className="p-4 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-surface-100 rounded-lg" />
            ))}
          </div>
        </aside>
        <main className="flex-1 flex flex-col min-w-0 bg-surface-50">
          <div className="p-6 border-b border-surface-200 bg-white animate-pulse">
            <div className="max-w-3xl mx-auto flex gap-3">
              <div className="flex-1 h-14 bg-surface-200 rounded-xl" />
              <div className="w-28 h-14 bg-surface-200 rounded-xl" />
            </div>
          </div>
          <div className="flex-1 p-6" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-100">
      <Sidebar
        history={history}
        activeId={activeHistoryId}
        onSelect={handleSelectHistory}
        onNewResearch={handleNewResearch}
        onDelete={handleDeleteHistory}
      />
      <AnalysisView
        displayedResult={displayedResult}
        onAnalysisComplete={handleAnalysisComplete}
      />
    </div>
  );
}
