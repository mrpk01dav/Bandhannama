import "server-only";

import { z } from "zod";

const optionalNonEmpty = z.preprocess((value) => value === "" ? undefined : value, z.string().min(1).optional());
const optionalUrl = z.preprocess((value) => value === "" ? undefined : value, z.string().url().optional());
const optionalEmail = z.preprocess((value) => value === "" ? undefined : value, z.string().email().optional());
const optionalSecret = z.preprocess((value) => value === "" ? undefined : value, z.string().min(32).optional());

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: optionalNonEmpty,
  ADMIN_BOOTSTRAP_EMAIL: optionalEmail,
  UPSTASH_REDIS_REST_URL: optionalUrl,
  UPSTASH_REDIS_REST_TOKEN: optionalNonEmpty,
  BROTHER_DM_LINK: optionalUrl,
  PIN_HASH_PEPPER: optionalSecret,
  AUDIT_LOG_HMAC_KEY: optionalSecret
});

/** Validate private configuration at the point where a server feature needs it. */
export function getServerEnv() {
  return serverEnvSchema.parse(process.env);
}
