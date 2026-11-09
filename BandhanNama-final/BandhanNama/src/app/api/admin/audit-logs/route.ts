import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const url = new URL(request.url);
  const rawLimit = Number(url.searchParams.get("limit") ?? 50);
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(100, Math.floor(rawLimit))) : 50;
  const { data, error } = await auth.supabase.from("audit_logs")
    .select("id,action,target_type,target_id,metadata,created_at,actor_id")
    .order("created_at", { ascending: false }).limit(limit);
  if (error) return NextResponse.json({ error: "Could not load audit history." }, { status: 500 });
  return NextResponse.json({ logs: data ?? [] });
}
