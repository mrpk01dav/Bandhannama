import "server-only";
import { createHmac } from "node:crypto";
import argon2 from "argon2";

function digestPin(pin: string) {
  const pepper = process.env.PIN_HASH_PEPPER;
  if (!pepper || pepper.length < 32) throw new Error("PIN_HASH_PEPPER must be configured with at least 32 characters.");
  return createHmac("sha256", pepper).update(pin).digest("hex");
}

/** Hash PINs before inserting sister records. Never persist or log raw PINs. */
export async function hashSisterPin(pin: string) {
  if (!/^\d{4,12}$/.test(pin)) throw new Error("PIN must contain 4–12 digits.");
  return argon2.hash(digestPin(pin), {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1
  });
}

export async function verifySisterPin(hash: string, pin: string) {
  if (!/^\d{4,12}$/.test(pin)) return false;
  try { return await argon2.verify(hash, digestPin(pin)); }
  catch { return false; }
}
