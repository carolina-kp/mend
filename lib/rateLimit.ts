// Simple in-memory per-IP limiter. Resets when the server restarts and is per
// server instance — good enough for a prototype. FUTURE: shared store if traffic grows.
import { RATE_LIMIT } from "./config";

const hits = new Map<string, number[]>();

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear(); // keep memory bounded
  return recent.length > RATE_LIMIT.requests;
}
