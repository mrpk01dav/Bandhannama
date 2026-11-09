import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_COMMON_WISH = "Dear [Name], This little surprise is for you. May your life always remain filled with happiness, beautiful memories, success and endless reasons to smile. Your brother is always cheering for you. Happy Bhai Dooj! ❤️";

export async function getCommonWish(name: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("setting_value")
    .eq("setting_key", "common_wish")
    .maybeSingle();
  if (error) throw new Error("Unable to load the common wish.");
  const stored = data?.setting_value;
  const template = typeof stored === "string" ? stored : DEFAULT_COMMON_WISH;
  return template.replaceAll("[Name]", name).replaceAll("{name}", name);
}
