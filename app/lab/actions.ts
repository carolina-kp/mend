"use server";
import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isLabUser, LAB_COOKIE, labCookieValue, passcodeMatches } from "@/lib/lab";
import { upsertRow } from "@/lib/store";

export async function login(form: FormData) {
  if (!passcodeMatches(String(form.get("passcode") ?? ""))) redirect("/lab?wrong=1");
  (await cookies()).set(LAB_COOKIE, labCookieValue(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 60 * 60 * 12 });
  redirect("/lab");
}

export async function logout() {
  (await cookies()).delete(LAB_COOKIE);
  redirect("/lab");
}

// Trial tracking: mark that the follow-up was sent, or record "made something" by hand.
export async function setTrial(form: FormData) {
  if (!(await isLabUser())) redirect("/lab");
  const sessionId = String(form.get("sessionId") ?? "").slice(0, 64);
  const field = form.get("field");
  const value = form.get("value");
  if (!sessionId || (field !== "followup_sent" && field !== "made")) return;
  await upsertRow("trials", "session_id", { session_id: sessionId, [field]: value === "clear" ? null : value === "true" });
  refresh();
}
