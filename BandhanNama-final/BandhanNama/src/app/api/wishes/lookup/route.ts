import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRateLimitIdentity, getRequestIp, normalizeName } from "@/lib/security/identity";
import { enforceWishRateLimit } from "@/lib/security/rate-limit";
import { getCommonWish } from "@/lib/wishes/common";
import { lookupWishSchema } from "@/lib/validation/wishes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const parsed = lookupWishSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Please enter a valid name." }, { status: 400 });

    const displayName = parsed.data.name.normalize("NFKC").trim().replace(/\s+/g, " ");
    const normalizedName = normalizeName(displayName);
    const identities = createRateLimitIdentity(getRequestIp(request), normalizedName);
    const [ipLimit, nameLimit] = await Promise.all([
      enforceWishRateLimit(identities.ip),
      enforceWishRateLimit(identities.name)
    ]);
    if (!ipLimit.success || !nameLimit.success) {
      return NextResponse.json({ error: "Please wait a little before trying again." }, { status: 429, headers: { "Cache-Control": "no-store" } });
    }

    const supabase = createAdminClient();
    const { data: sister, error } = await supabase
      .from("sisters")
      .select("id")
      .eq("normalized_name", normalizedName)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw new Error("Sister lookup failed.");

    if (sister) {
      return NextResponse.json({ status: "pin_required", displayName }, { headers: { "Cache-Control": "no-store" } });
    }

    const wish = await getCommonWish(displayName);
    return NextResponse.json({ status: "common_wish", displayName, wish }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "We couldn't prepare your wish right now. Please try again." }, { status: 503 });
  }
}
