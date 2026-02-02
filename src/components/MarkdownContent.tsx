"use client";

import ReactMarkdown from "react-markdown";

const proseClass =
  "text-sm text-slate-700 leading-loose [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1.5 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:space-y-1.5 [&>li]:my-0.5 [&>strong]:font-semibold [&>strong]:text-slate-800 [&>h3]:text-base [&>h3]:font-semibold [&>h3]:mt-3 [&>h3]:mb-1 [&>h4]:text-sm [&>h4]:font-semibold [&>h4]:mt-2 [&>h4]:mb-1 [&>code]:bg-slate-100 [&>code]:px-1 [&>code]:rounded [&>code]:text-xs [&>pre]:bg-slate-100 [&>pre]:p-3 [&>pre]:rounded-lg [&>pre]:overflow-x-auto [&>pre]:text-xs";

export default function MarkdownContent({ content }: { content: string }) {
  if (!content?.trim()) return <span className="text-slate-400">—</span>;
  return (
    <div className={`markdown-content ${proseClass}`}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
