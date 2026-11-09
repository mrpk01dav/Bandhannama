import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, writeAudit } from "@/lib/admin/guard";

const schema = z.object({ display_name: z.string().trim().min(1).max(80), sister_id: z.string().uuid().nullable().optional(), is_visible: z.boolean().default(true), sort_order: z.number().int().min(-10000).max(10000).default(0) });
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const { data, error } = await auth.supabase.from("public_name_suggestions").select("id,display_name,sister_id,is_visible,sort_order,created_at").order("sort_order").order("display_name");
  if (error) return NextResponse.json({ error: "Could not load public names." }, { status: 500 });
  return NextResponse.json({ names: data ?? [] });
}
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (auth.role !== "admin") return NextResponse.json({ error: "Only administrators can manage public names." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid public name." }, { status: 400 });
  const { data, error } = await auth.supabase.from("public_name_suggestions").insert(parsed.data).select("id,display_name,sister_id,is_visible,sort_order").single();
  if (error || !data) return NextResponse.json({ error: "Could not add public name. It may already exist." }, { status: 400 });
  await writeAudit(auth.supabase, auth.user.id, "public_name.created", "public_name", data.id);
  return NextResponse.json({ name: data }, { status: 201 });
}
