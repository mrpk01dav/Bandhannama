import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** Only admin-approved public display names are returned. Never query sisters here. */
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("public_name_suggestions")
      .select("display_name")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true })
      .limit(100);
    if (error) throw new Error("Public names query failed.");
    return NextResponse.json({ names: (data ?? []).map((item) => item.display_name) }, {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" }
    });
  } catch {
    return NextResponse.json({ error: "Name suggestions are temporarily unavailable." }, { status: 503 });
  }
}
