"use client";
import React from "react";

function renderInline(text: string, baseKey: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const regex = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const k = `${baseKey}-${i++}`;
    if (tok.startsWith("**")) {
      out.push(
        <strong key={k} className="font-semibold text-slate-900">
          {tok.slice(2, -2)}
        </strong>
      );
    } else if (tok.startsWith("`")) {
      out.push(
        <code key={k} className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.85em]">
          {tok.slice(1, -1)}
        </code>
      );
    } else {
      out.push(
        <em key={k} className="italic">
          {tok.slice(1, -1)}
        </em>
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));

  return out.flatMap((node, idx) => {
    if (typeof node !== "string") return [node];
    const lines = node.split("\n");
    const result: React.ReactNode[] = [];
    lines.forEach((line, j) => {
      if (j > 0) result.push(<br key={`${baseKey}-br-${idx}-${j}`} />);
      if (line) result.push(line);
    });
    return result;
  });
}

export default function RichText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  if (!text) return null;
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim());
  return (
    <div className={`space-y-2 ${className}`}>
      {paragraphs.map((p, i) => (
        <p key={i} className="leading-relaxed">
          {renderInline(p, `p${i}`)}
        </p>
      ))}
    </div>
  );
}
