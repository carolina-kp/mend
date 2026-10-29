"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LAB_COOKIE, labCookieValue, passcodeMatches } from "@/lib/lab";

export async function login(form: FormData) {
  if (!passcodeMatches(String(form.get("passcode") ?? ""))) redirect("/lab?wrong=1");
  (await cookies()).set(LAB_COOKIE, labCookieValue(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 60 * 60 * 12 });
  redirect("/lab");
}

export async function logout() {
  (await cookies()).delete(LAB_COOKIE);
  redirect("/lab");
}
