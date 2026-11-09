import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { ok: false as const, status: 401, message: "Authentication required." };
  const { data: profile, error } = await supabase
    .from("admin_profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !profile || !["admin", "editor"].includes(profile.role)) {
    return { ok: false as const, status: 403, message: "Administrator access required." };
  }
  return { ok: true as const, supabase, user, role: profile.role as "admin" | "editor" };
}

export async function writeAudit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  actorId: string,
  action: string,
  targetType: string,
  targetId?: string,
  metadata: Record<string, string | number | boolean | null> = {}
) {
  await supabase.from("audit_logs").insert({
    actor_id: actorId,
    action,
    target_type: targetType,
    target_id: targetId ?? null,
    metadata
  });
}
