import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, writeAudit } from "@/lib/admin/guard";

const allowedKeys = ["common_wish", "brother_message", "brother_display_name", "site_title", "site_tagline", "welcome_text", "story_text", "closing_message", "brother_dm_link", "music_enabled", "music_url", "announcement"] as const;
const updateSchema = z.object({ settings: z.record(z.string(), z.unknown()) });

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const { data, error } = await auth.supabase.from("site_settings").select("setting_key,setting_value,updated_at").in("setting_key", [...allowedKeys]);
  if (error) return NextResponse.json({ error: "Could not load settings." }, { status: 500 });
  return NextResponse.json({ settings: Object.fromEntries((data ?? []).map(row => [row.setting_key, row.setting_value])) });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (auth.role !== "admin") return NextResponse.json({ error: "Only administrators can change site settings." }, { status: 403 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid settings." }, { status: 400 });
  const entries = Object.entries(parsed.data.settings);
  if (!entries.length || entries.some(([key, value]) => !allowedKeys.includes(key as typeof allowedKeys[number]) || typeof value !== "string" && typeof value !== "boolean")) {
    return NextResponse.json({ error: "One or more settings are not editable." }, { status: 400 });
  }
  for (const [key, value] of entries) {
    if (typeof value === "string" && value.length > 5000) return NextResponse.json({ error: "A setting is too long." }, { status: 400 });
    if (key === "brother_dm_link" && typeof value === "string" && value && !/^https:\/\//i.test(value)) return NextResponse.json({ error: "The contact link must use HTTPS." }, { status: 400 });
    if (key === "music_url" && typeof value === "string" && value && !/^https:\/\//i.test(value)) return NextResponse.json({ error: "The music URL must use HTTPS." }, { status: 400 });
  }
  const { error } = await auth.supabase.from("site_settings").upsert(entries.map(([setting_key, setting_value]) => ({ setting_key, setting_value, updated_by: auth.user.id })), { onConflict: "setting_key" });
  if (error) return NextResponse.json({ error: "Could not save settings." }, { status: 500 });
  await writeAudit(auth.supabase, auth.user.id, "settings.updated", "site_settings", undefined, { keys: entries.map(([key]) => key).join(",") });
  return NextResponse.json({ success: true });
}
