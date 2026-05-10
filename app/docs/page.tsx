"use client";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import EmergencyBanner from "@/components/EmergencyBanner";
import type { EmergencyMatch } from "@/lib/emergency";

type Doc = {
  filename: string;
  extracted: any;
  summary: string;
  what_this_means: string;
  next_steps: string[];
};

export default function DocsPage() {
  const { t, lang } = useT();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(false);
  const [emergency, setEmergency] = useState<EmergencyMatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const raw = window.sessionStorage.getItem("mira:docs");
      if (raw) {
        try {
          setDocs(JSON.parse(raw));
        } catch {}
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("mira:docs", JSON.stringify(docs));
    }
  }, [docs]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || !files[0]) return;
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", files[0]);
    fd.append("language", lang);
    try {
      const r = await fetch("/api/docs/upload", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) {
        setError(j.error || "Upload failed");
      } else {
        setDocs((d) => [...d, j.doc]);
        if (j.emergency) setEmergency(j.emergency);
      }
    } catch (err: any) {
      setError(err?.message || "Upload failed");
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function sendChat() {
    if (!chatInput.trim() || docs.length === 0) return;
    const next = [...chatMessages, { role: "user" as const, content: chatInput }];
    setChatMessages(next);
    setChatInput("");
    setChatLoading(true);
    try {
      const r = await fetch("/api/docs/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next, docs, language: lang }),
      });
      const j = await r.json();
      setChatMessages((m) => [...m, { role: "assistant", content: j.reply || "(no response)" }]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="page-shell max-w-4xl space-y-5">
      <div>
        <div className="page-kicker">Plain-language document review</div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{t("nav.understandDocs")}</h1>
      </div>

      {emergency && <EmergencyBanner match={emergency} onDismiss={() => setEmergency(null)} />}

      <label className="block cursor-pointer rounded-lg border-2 border-dashed border-teal-200 bg-white/85 p-8 text-center shadow-sm transition hover:border-teal-400 hover:bg-teal-50/60">
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept="application/pdf,image/jpeg,image/png"
          onChange={onUpload}
          disabled={loading}
        />
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-teal-50 text-3xl">📄</div>
        <div className="font-medium mt-1">{t("docs.upload")}</div>
        <div className="text-xs text-slate-500 mt-1">{t("docs.uploadHint")}</div>
        {loading && <div className="text-sm text-brand-600 mt-2">Processing…</div>}
      </label>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}

      {docs.map((d, i) => (
        <div key={i} className="ui-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold">{d.filename}</div>
            <span className="soft-pill border-slate-200 bg-slate-100 text-slate-600">
              {d.extracted?.doc_type || "document"}
            </span>
          </div>
          {d.summary && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700">{t("docs.summary")}</h4>
              <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{d.summary}</p>
            </div>
          )}
          {d.what_this_means && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700">{t("docs.whatThisMeans")}</h4>
              <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{d.what_this_means}</p>
            </div>
          )}
          {d.next_steps?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700">{t("docs.whatToDoNext")}</h4>
              <ol className="list-decimal ms-5 mt-1 text-sm text-slate-700 space-y-1">
                {d.next_steps.map((s, j) => (
                  <li key={j}>{s}</li>
                ))}
              </ol>
            </div>
          )}
          {(d.extracted?.bill_total != null || d.extracted?.patient_responsibility != null) && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
              {d.extracted.patient_responsibility != null && (
                <div>You owe: <strong>${d.extracted.patient_responsibility}</strong></div>
              )}
              {d.extracted.due_date && <div>Due: {d.extracted.due_date}</div>}
              <a href="/apply" className="text-brand-600 underline text-sm">Get help applying for charity care →</a>
            </div>
          )}
        </div>
      ))}

      {docs.length > 0 && (
        <div className="ui-card p-5">
          <h3 className="font-semibold mb-2">{t("docs.askQuestions")}</h3>
          <div className="space-y-2 max-h-60 overflow-auto">
            {chatMessages.map((m, i) => (
              <div key={i} className={`text-sm ${m.role === "user" ? "text-slate-900" : "text-slate-700 bg-slate-50 p-2 rounded"}`}>
                <span className="font-medium me-1">{m.role === "user" ? "You:" : "MIRA:"}</span>
                {m.content}
              </div>
            ))}
            {chatLoading && <div className="text-sm text-slate-500">{t("docs.thinking")}</div>}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              placeholder="…"
              className="field-input flex-1"
            />
            <button onClick={sendChat} disabled={chatLoading} className="primary-button">
              {t("docs.send")}
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-500">{t("disclaimer")}</p>
    </div>
  );
}
