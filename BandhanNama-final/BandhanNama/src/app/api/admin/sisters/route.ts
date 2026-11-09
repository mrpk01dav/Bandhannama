import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, writeAudit } from "@/lib/admin/guard";
import { hashSisterPin } from "@/lib/security/pin";

const sisterSchema = z.object({
  display_name: z.string().trim().min(1).max(80),
  pin: z.string().regex(/^\d{4,12}$/),
  personal_wish: z.string().trim().min(1).max(4000),
  memory_text: z.string().max(2000).optional().nullable(),
  photo_path: z.string().max(500).optional().nullable(),
  is_active: z.boolean().default(true),
  add_to_public_names: z.boolean().default(true)
});

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const { data, error } = await auth.supabase
    .from("sisters")
    .select("id,display_name,personal_wish,memory_text,photo_path,is_active,created_at,updated_at")
    .order("display_name");
  if (error) return NextResponse.json({ error: "Could not load sister records." }, { status: 500 });
  return NextResponse.json({ sisters: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (auth.role !== "admin") return NextResponse.json({ error: "Only administrators can add sister records." }, { status: 403 });
  const parsed = sisterSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check the sister details and PIN." }, { status: 400 });
  const input = parsed.data;
  let pin_hash: string;
  try { pin_hash = await hashSisterPin(input.pin); }
  catch { return NextResponse.json({ error: "Secure PIN hashing is not configured." }, { status: 503 }); }
  const { data, error } = await auth.supabase.from("sisters").insert({
    display_name: input.display_name,
    pin_hash,
    personal_wish: input.personal_wish,
    memory_text: input.memory_text || null,
    photo_path: input.photo_path || null,
    is_active: input.is_active
  }).select("id,display_name,personal_wish,memory_text,photo_path,is_active,created_at,updated_at").single();
  if (error || !data) return NextResponse.json({ error: error?.code === "23505" ? "A sister with that name already exists." : "Could not create sister record." }, { status: 400 });
  if (input.add_to_public_names) {
    await auth.supabase.from("public_name_suggestions").upsert({ display_name: input.display_name, sister_id: data.id, is_visible: true }, { onConflict: "normalized_name" });
  }
  await writeAudit(auth.supabase, auth.user.id, "sister.created", "sister", data.id, { is_active: data.is_active });
  return NextResponse.json({ sister: data }, { status: 201 });
}
