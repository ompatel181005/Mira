"use client";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import EmergencyBanner from "@/components/EmergencyBanner";
import RichText from "@/components/RichText";
import ReconciliationCard from "@/components/docs/ReconciliationCard";
import QuickChips from "@/components/docs/QuickChips";
import type { EmergencyMatch } from "@/lib/emergency";
import { compressImageIfLarge } from "@/lib/imageCompress";

const MAX_BYTES = 10 * 1024 * 1024;

type LabValue = {
  name: string;
  value: string;
  units?: string | null;
  normal_range?: string | null;
  flag?: string | null;
};
type Medication = {
  name: string;
  dose?: string | null;
  frequency?: string | null;
  generic_available?: boolean | null;
};
type LineItem = {
  description: string;
  cpt_code?: string | null;
  charge?: number | null;
};

type Doc = {
  _id: string;
  filename: string;
  ocr_quality?: "low" | "ok";
  pending_summary?: boolean;
  extracted: {
    doc_type?: string;
    provider_name?: string | null;
    date?: string | null;
    diagnoses?: string[];
    lab_values?: LabValue[];
    medications?: Medication[];
    bill_total?: number | null;
    bill_line_items?: LineItem[];
    insurance_paid?: number | null;
    patient_responsibility?: number | null;
    due_date?: string | null;
    follow_up_needed?: string | null;
    red_flags?: string[];
  };
  summary: string;
  what_this_means: string;
  next_steps: string[];
  key_terms?: { term: string; plain_meaning: string }[];
};

function flagStyles(flag?: string | null) {
  const f = (flag || "").toLowerCase();
  if (f.includes("crit") || f === "panic")
    return "border-red-300 bg-red-50 text-red-700";
  if (f === "h" || f.includes("high") || f === "l" || f.includes("low") || f === "abnormal")
    return "border-amber-300 bg-amber-50 text-amber-800";
  if (f === "n" || f.includes("normal"))
    return "border-emerald-300 bg-emerald-50 text-emerald-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function fmtMoney(n?: number | null) {
  if (n == null) return "";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function DocsPage() {
  const { t, lang } = useT();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(false);
  const [emergency, setEmergency] = useState<EmergencyMatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [progress, setProgress] = useState<{ name: string; status: "uploading" | "done" | "error"; message?: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem("mira:docs");
    if (raw) {
      try {
        setDocs(JSON.parse(raw));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem("mira:docs", JSON.stringify(docs));
  }, [docs]);

  async function uploadOne(
    rawFile: File,
    onStatus: (s: "uploading" | "done" | "error", message?: string) => void
  ) {
    const file = await compressImageIfLarge(rawFile);
    if (file.size > MAX_BYTES) {
      onStatus("error", t("docs.maxFileSize"));
      return;
    }
    onStatus("uploading");
    const fd = new FormData();
    fd.append("file", file);

    // Phase 1: extract structured fields. Fast — user sees the doc card right away.
    let extracted: any;
    let emergencyMatch: EmergencyMatch | null = null;
    let ocrQuality: "low" | "ok" = "ok";
    try {
      const r = await fetch("/api/docs/extract", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) {
        onStatus("error", j.error || "Upload failed");
        return;
      }
      extracted = j.extracted;
      emergencyMatch = j.emergency || null;
      ocrQuality = j.ocr_quality || "ok";
    } catch (err: any) {
      onStatus("error", err?.message || "Upload failed");
      return;
    }

    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    const skipSummary = ocrQuality === "low";
    setDocs((d) => [
      ...d,
      {
        _id: id,
        filename: file.name,
        extracted: extracted || {},
        ocr_quality: ocrQuality,
        summary: "",
        what_this_means: "",
        next_steps: [],
        key_terms: [],
        pending_summary: !skipSummary,
      },
    ]);
    if (emergencyMatch) setEmergency(emergencyMatch);
    onStatus("done");

    if (skipSummary) return;

    // Phase 2: summarize. Slower; the doc card already shows structured fields and
    // a "thinking" placeholder updates in place when this returns.
    try {
      const r2 = await fetch("/api/docs/summarize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ extracted, language: lang }),
      });
      const j2 = await r2.json();
      setDocs((d) =>
        d.map((x) =>
          x._id === id
            ? {
                ...x,
                summary: j2.summary || "",
                what_this_means: j2.what_this_means || "",
                next_steps: j2.next_steps || [],
                key_terms: j2.key_terms || [],
                pending_summary: false,
              }
            : x
        )
      );
    } catch {
      setDocs((d) =>
        d.map((x) => (x._id === id ? { ...x, pending_summary: false } : x))
      );
    }
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setError(null);
    setLoading(true);

    const initial = files.map((f) => ({
      name: f.name,
      status: "uploading" as const,
    }));
    setProgress(initial);

    await Promise.all(
      files.map((file, idx) =>
        uploadOne(file, (status, message) =>
          setProgress((p) => {
            const copy = [...p];
            copy[idx] = { name: file.name, status, message };
            return copy;
          })
        )
      )
    );

    setLoading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
    // Clear progress entries that succeeded; keep only errors so the user sees them.
    setProgress((p) => p.filter((row) => row.status === "error"));
  }

  function removeDoc(idx: number) {
    setDocs((d) => d.filter((_, i) => i !== idx));
  }

  async function sendChat(overrideText?: string) {
    const content = (overrideText ?? chatInput).trim();
    if (!content || docs.length === 0 || chatLoading) return;
    const next = [...chatMessages, { role: "user" as const, content }];
    setChatMessages(next);
    setChatInput("");
    setChatLoading(true);
    if (typeof window !== "undefined") {
      // Scroll the chatbox into view so the user can see their question + the spinner.
      setTimeout(() => {
        document
          .getElementById("docs-chat")
          ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 50);
    }
    try {
      const r = await fetch("/api/docs/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next, docs, language: lang }),
      });
      const j = await r.json();
      const reply = j.reply || j.error || "(no response)";
      setChatMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (err: any) {
      setChatMessages((m) => [
        ...m,
        { role: "assistant", content: `(error: ${err?.message || "request failed"})` },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="page-shell max-w-4xl space-y-5">
      <div>
        <div className="page-kicker">Plain-language document review</div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
          {t("nav.understandDocs")}
        </h1>
      </div>

      {emergency && (
        <EmergencyBanner match={emergency} onDismiss={() => setEmergency(null)} />
      )}

      <div className="rounded-3xl border-2 border-dashed border-medical-100 bg-white/95 p-6 sm:p-8 text-center shadow-soft">
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          onChange={onUpload}
          disabled={loading}
        />
        <input
          ref={cameraRef}
          type="file"
          className="hidden"
          accept="image/*"
          capture="environment"
          multiple
          onChange={onUpload}
          disabled={loading}
        />
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-medical-50 text-3xl">
          📄
        </div>
        <div className="font-medium mt-1">{t("docs.upload")}</div>
        <div className="text-xs text-slate-500 mt-1">{t("docs.uploadHint")}</div>
        <div className="text-xs text-slate-400 mt-1">{t("docs.uploadLimit")}</div>
        <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={loading}
            className="primary-button"
          >
            {t("docs.chooseFiles")}
          </button>
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            disabled={loading}
            className="rounded-2xl border border-medical-100 bg-white px-4 py-2 text-sm font-medium text-medical-700 transition hover:border-medical-600 hover:bg-medical-50 disabled:opacity-50"
          >
            📷 {t("docs.takePhoto")}
          </button>
        </div>
        <div className="text-xs text-slate-400 mt-2">{t("docs.multiHint")}</div>
        {loading && (
          <div className="text-sm text-brand-600 mt-3">{t("docs.processing")}</div>
        )}
      </div>

      {progress.length > 0 && (
        <div className="space-y-1">
          {progress.map((p, i) => (
            <div
              key={i}
              className={`flex items-center justify-between rounded-md border px-3 py-1.5 text-sm ${
                p.status === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : p.status === "done"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-slate-50 text-slate-600"
              }`}
            >
              <span className="truncate">{p.name}</span>
              <span className="text-xs ml-2 shrink-0">
                {p.status === "uploading"
                  ? t("docs.processing")
                  : p.status === "done"
                    ? "✓"
                    : p.message || t("docs.uploadFailed")}
              </span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      <ReconciliationCard docs={docs} language={lang} />

      {docs.map((d, i) => {
        const ex = d.extracted || {};
        return (
          <div key={i} className="ui-card p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{d.filename}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {ex.provider_name && <span>{ex.provider_name}</span>}
                  {ex.provider_name && ex.date && <span> · </span>}
                  {ex.date && <span>{ex.date}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="soft-pill border-slate-200 bg-slate-100 text-slate-600">
                  {ex.doc_type || "document"}
                </span>
                <button
                  onClick={() => removeDoc(i)}
                  className="text-xs text-slate-400 hover:text-red-600"
                  aria-label="Remove document"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            </div>

            {d.ocr_quality === "low" && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <div className="font-semibold mb-0.5">📷 {t("docs.ocrLowTitle")}</div>
                <div className="text-xs">{t("docs.ocrLowBody")}</div>
              </div>
            )}

            {ex.red_flags && ex.red_flags.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <div className="font-semibold mb-1">{t("docs.important")}</div>
                <ul className="list-disc ms-5 space-y-0.5">
                  {ex.red_flags.map((r, j) => (
                    <li key={j}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {d.pending_summary && (
              <div className="text-sm text-slate-500 italic">
                {t("docs.summarizing")}
              </div>
            )}

            {d.summary && (
              <RichText
                text={d.summary}
                className="text-base text-slate-900 font-medium"
              />
            )}

            {d.what_this_means && (
              <RichText text={d.what_this_means} className="text-sm text-slate-600" />
            )}

            {d.next_steps && d.next_steps.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700">
                  {t("docs.whatToDoNext")}
                </h4>
                <ol className="list-decimal ms-5 mt-1 text-sm text-slate-700 space-y-1.5">
                  {d.next_steps.map((s, j) => (
                    <li key={j}>
                      <RichText text={s} />
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {!d.pending_summary && d.ocr_quality !== "low" && (
              <div>
                <div className="text-xs text-slate-500 mb-1.5">
                  {t("docs.askThis")}
                </div>
                <QuickChips
                  docType={ex.doc_type}
                  filename={d.filename}
                  onAsk={(q) => sendChat(q)}
                />
              </div>
            )}

            {(ex.bill_total != null ||
              ex.patient_responsibility != null ||
              ex.insurance_paid != null) && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm space-y-0.5">
                {ex.bill_total != null && (
                  <div>
                    {t("docs.totalCharges")}: <strong>{fmtMoney(ex.bill_total)}</strong>
                  </div>
                )}
                {ex.insurance_paid != null && (
                  <div>
                    {t("docs.insurancePaid")}:{" "}
                    <strong>{fmtMoney(ex.insurance_paid)}</strong>
                  </div>
                )}
                {ex.patient_responsibility != null && (
                  <div>
                    {t("docs.youOwe")}:{" "}
                    <strong>{fmtMoney(ex.patient_responsibility)}</strong>
                  </div>
                )}
                {ex.due_date && (
                  <div>
                    {t("docs.due")}: {ex.due_date}
                  </div>
                )}
                <a
                  href={`/apply?${new URLSearchParams({
                    ...(ex.provider_name ? { hospital: ex.provider_name } : {}),
                    ...(ex.patient_responsibility != null
                      ? { amount: String(ex.patient_responsibility) }
                      : {}),
                  }).toString()}`}
                  className="text-brand-600 underline text-sm"
                >
                  {t("docs.charityHelp")}
                </a>
              </div>
            )}

            {(((ex.diagnoses?.length ?? 0) > 0) ||
              ((ex.lab_values?.length ?? 0) > 0) ||
              ((ex.medications?.length ?? 0) > 0) ||
              ((ex.bill_line_items?.length ?? 0) > 0) ||
              ((d.key_terms?.length ?? 0) > 0)) && (
              <details className="rounded-lg border border-slate-200 bg-slate-50/50">
                <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  {t("docs.moreDetails")}
                </summary>
                <div className="space-y-4 px-3 pb-3 pt-1">
                  {ex.diagnoses && ex.diagnoses.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {t("docs.diagnoses")}
                      </h4>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {ex.diagnoses.map((dx, j) => (
                          <span
                            key={j}
                            className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs text-slate-700"
                          >
                            {dx}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {ex.lab_values && ex.lab_values.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {t("docs.labValues")}
                      </h4>
                      <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ex.lab_values.map((lv, j) => (
                          <div
                            key={j}
                            className={`rounded-lg border p-2 text-sm ${flagStyles(lv.flag)}`}
                          >
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="font-medium">{lv.name}</span>
                              {lv.flag && (
                                <span className="text-xs uppercase tracking-wide">
                                  {lv.flag}
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5">
                              <span className="font-semibold">{lv.value}</span>
                              {lv.units ? <span className="ml-1">{lv.units}</span> : null}
                              {lv.normal_range && (
                                <span className="ml-2 text-xs opacity-70">
                                  ({t("docs.normal")} {lv.normal_range})
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {ex.medications && ex.medications.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {t("docs.medications")}
                      </h4>
                      <ul className="mt-1 text-sm text-slate-700 space-y-1">
                        {ex.medications.map((m, j) => (
                          <li key={j} className="flex flex-wrap gap-x-2">
                            <span className="font-medium">{m.name}</span>
                            {m.dose && <span className="text-slate-500">{m.dose}</span>}
                            {m.frequency && (
                              <span className="text-slate-500">· {m.frequency}</span>
                            )}
                            {m.generic_available && (
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 text-xs text-emerald-700">
                                {t("docs.genericAvailable")}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {ex.bill_line_items && ex.bill_line_items.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {t("docs.charges")}
                      </h4>
                      <div className="mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                              <th className="px-2 py-1.5">{t("docs.item")}</th>
                              <th className="px-2 py-1.5">{t("docs.cpt")}</th>
                              <th className="px-2 py-1.5 text-right">
                                {t("docs.charge")}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {ex.bill_line_items.map((li, j) => (
                              <tr key={j} className="border-t border-slate-100">
                                <td className="px-2 py-1.5">{li.description}</td>
                                <td className="px-2 py-1.5 text-slate-500">
                                  {li.cpt_code || ""}
                                </td>
                                <td className="px-2 py-1.5 text-right tabular-nums">
                                  {fmtMoney(li.charge)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {d.key_terms && d.key_terms.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {t("docs.inPlainLanguage")}
                      </h4>
                      <dl className="mt-1 text-sm text-slate-700 space-y-1.5">
                        {d.key_terms.map((kt, j) => (
                          <div key={j}>
                            <dt className="font-medium inline">{kt.term}:</dt>{" "}
                            <dd className="inline text-slate-600">{kt.plain_meaning}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        );
      })}

      {docs.length > 0 && (
        <div id="docs-chat" className="ui-card p-5">
          <h3 className="font-semibold mb-2">{t("docs.askQuestions")}</h3>
          <div className="space-y-2 max-h-72 overflow-auto">
            {chatMessages.map((m, i) => (
              <div
                key={i}
                className={`text-sm ${
                  m.role === "user"
                    ? "text-slate-900"
                    : "text-slate-700 bg-slate-50 p-2 rounded"
                }`}
              >
                <div className="font-medium mb-0.5">
                  {m.role === "user" ? t("docs.you") : "MIRA"}
                </div>
                <RichText text={m.content} />
              </div>
            ))}
            {chatLoading && (
              <div className="text-sm text-slate-500">{t("docs.thinking")}</div>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !chatLoading) sendChat();
              }}
              placeholder="…"
              className="field-input flex-1"
              disabled={chatLoading}
            />
            <button
              onClick={() => sendChat()}
              disabled={chatLoading || !chatInput.trim()}
              className="primary-button"
            >
              {t("docs.send")}
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-500">{t("disclaimer")}</p>
    </div>
  );
}
