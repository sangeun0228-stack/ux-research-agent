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
  const [reportTopic, setReportTopic] = useState<string | null>(null);
  const [reportDate, setReportDate] = useState<string | null>(null);
  const [analysisViewKey, setAnalysisViewKey] = useState(0);
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
    setReportTopic(topic);
    setReportDate(newItem.createdAt);
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
        setReportTopic(item.topic);
        setReportDate(item.createdAt);
      }
    },
    [history]
  );

  const handleNewResearch = useCallback(() => {
    setActiveHistoryId(null);
    setDisplayedResult(null);
    setReportTopic(null);
    setReportDate(null);
    setAnalysisViewKey((k) => k + 1);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-slate-50" aria-busy="true">
        <header className="h-14 shrink-0 border-b border-slate-200 bg-white px-6 flex items-center" />
        <div className="flex flex-1 min-h-0">
        <aside className="w-[280px] shrink-0 bg-white border-r border-slate-200 animate-pulse">
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
        <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
          <div className="p-6 border-b border-slate-200 bg-white animate-pulse">
            <div className="max-w-3xl mx-auto flex gap-3">
              <div className="flex-1 h-14 bg-slate-200 rounded-xl" />
              <div className="w-28 h-14 bg-slate-200 rounded-xl" />
            </div>
          </div>
          <div className="flex-1 p-6" />
        </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      <header className="h-14 shrink-0 border-b border-slate-200 bg-white px-6 flex items-center">
        <span className="flex items-center gap-2 font-bold text-slate-800 tracking-tight text-lg">
          <span aria-hidden className="text-xl">📊</span>
          kt ds UX Insight Agent
        </span>
      </header>
      <div className="flex flex-1 min-h-0">
      <Sidebar
        history={history}
        activeId={activeHistoryId}
        onSelect={handleSelectHistory}
        onNewResearch={handleNewResearch}
        onDelete={handleDeleteHistory}
      />
      <AnalysisView
        key={analysisViewKey}
        displayedResult={displayedResult}
        reportTopic={reportTopic}
        reportDate={reportDate}
        onAnalysisComplete={handleAnalysisComplete}
      />
      </div>
    </div>
  );
}
