"use client";

export type FormState = {
  zip: string;
  language: string;
  symptoms: string;
  insurance: "none" | "medicaid" | "private" | "medicare" | "";
  circumstances: string[]; // pregnant | children | immigrant | emergency
};

export const FORM_KEY = "mira:form";
export const SESSION_ID_KEY = "mira:sid";
export const DOC_KEY = "mira:doc";

export function loadForm(): FormState {
  if (typeof window === "undefined") {
    return { zip: "", language: "en", symptoms: "", insurance: "", circumstances: [] };
  }
  try {
    const raw = window.sessionStorage.getItem(FORM_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { zip: "", language: "en", symptoms: "", insurance: "", circumstances: [] };
}

export function saveForm(form: FormState) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(FORM_KEY, JSON.stringify(form));
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  let sid = window.sessionStorage.getItem(SESSION_ID_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_ID_KEY, sid);
  }
  return sid;
}

export function wipeSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.clear();
  window.location.href = "/";
}
