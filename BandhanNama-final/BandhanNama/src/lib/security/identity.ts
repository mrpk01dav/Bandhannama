import "server-only";

import { createHmac } from "node:crypto";
import { normalizeName } from "@/lib/security/normalization";

export { normalizeName };

export function getRequestIp(request: Request) {
  // Vercel sets x-forwarded-for. Only the first value is used as the client hop.
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export function createRateLimitIdentity(ip: string, normalizedName: string) {
  const pepper = process.env.PIN_HASH_PEPPER;
  if (!pepper || pepper.length < 32) {
    if (process.env.NODE_ENV === "production") throw new Error("PIN_HASH_PEPPER is not configured securely.");
    return { ip: `dev-ip:${ip}`, name: `dev-name:${normalizedName}` };
  }
  const hash = (value: string) => createHmac("sha256", pepper).update(value).digest("hex");
  return { ip: `ip:${hash(ip)}`, name: `name:${hash(normalizedName)}` };
}
