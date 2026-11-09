import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, writeAudit } from "@/lib/admin/guard";
import { hashSisterPin } from "@/lib/security/pin";

const updateSchema = z.object({
  display_name: z.string().trim().min(1).max(80).optional(),
  pin: z.string().regex(/^\d{4,12}$/).optional(),
  personal_wish: z.string().trim().min(1).max(4000).optional(),
  memory_text: z.string().max(2000).nullable().optional(),
  photo_path: z.string().max(500).nullable().optional(),
  is_active: z.boolean().optional()
}).refine(value => Object.keys(value).length > 0);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const { id } = await context.params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid update details." }, { status: 400 });
  const input = parsed.data;
  const patch: Record<string, unknown> = {};
  if (input.display_name !== undefined) patch.display_name = input.display_name;
  if (input.personal_wish !== undefined) patch.personal_wish = input.personal_wish;
  if (input.memory_text !== undefined) patch.memory_text = input.memory_text;
  if (input.photo_path !== undefined) patch.photo_path = input.photo_path;
  if (input.is_active !== undefined) patch.is_active = input.is_active;
  if (input.pin) {
    if (auth.role !== "admin") return NextResponse.json({ error: "Only administrators can reset PINs." }, { status: 403 });
    try { patch.pin_hash = await hashSisterPin(input.pin); }
    catch { return NextResponse.json({ error: "Secure PIN hashing is not configured." }, { status: 503 }); }
  }
  const { data, error } = await auth.supabase.from("sisters").update(patch).eq("id", id)
    .select("id,display_name,personal_wish,memory_text,photo_path,is_active,created_at,updated_at").single();
  if (error || !data) return NextResponse.json({ error: "Could not update sister record." }, { status: 400 });
  await writeAudit(auth.supabase, auth.user.id, "sister.updated", "sister", id, { changed_fields: Object.keys(patch).filter(k => k !== "pin_hash").join(",") || "pin_reset" });
  return NextResponse.json({ sister: data });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (auth.role !== "admin") return NextResponse.json({ error: "Only administrators can delete sister records." }, { status: 403 });
  const { id } = await context.params;
  const { error } = await auth.supabase.from("sisters").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Could not delete sister record." }, { status: 400 });
  await writeAudit(auth.supabase, auth.user.id, "sister.deleted", "sister", id);
  return NextResponse.json({ success: true });
}
