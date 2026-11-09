import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const publicKeys = ["site_title","site_tagline","brother_display_name","brother_message","story_text","closing_message","welcome_text","brother_dm_link","music_enabled","music_url","announcement"] as const;
const defaults: Record<string,string|boolean> = {
  site_title: "BandhanNama", site_tagline: "One bond. Countless memories. Infinite love.",
  brother_display_name: "Your Brother",
  brother_message: "No matter how busy life gets, I hope you never forget how special you are. Keep chasing your dreams, keep smiling through every season, and never doubt that someone is always rooting for you.\n\nWe may tease each other, disagree over little things, or go days without talking — but none of that changes what you mean to me. You will always have a brother, a friend and a cheerleader in me.",
  story_text: "Some bonds are too precious to be measured in words. Bhai Dooj is one beautiful reminder of the love, prayers and quiet promises that make the bond between a brother and a sister so special.\n\nThe tilak is a symbol of blessings, care and a wish for a bright life ahead. Across India, families celebrate in their own ways, carrying the same feeling: may you always be safe, happy and surrounded by love.\n\nOne cherished legend tells of Yamuna welcoming her brother Yama with warmth and a tilak. Moved by her affection, he blessed her and the tradition became a symbol of a sibling's love and good wishes.",
  closing_message: "No matter where life takes us, no matter how much time passes, the bond we share will always remain special.\n\nYou will always have a brother cheering for you. Happy Bhai Dooj! ❤️",
  welcome_text: "A little something, made with love, for the sisters who make life brighter."
};
export async function GET() {
  try {
    const supabase=createAdminClient();
    const {data,error}=await supabase.from("site_settings").select("setting_key,setting_value").in("setting_key",[...publicKeys]);
    if(error) throw error;
    const content={...defaults};
    for(const row of data??[]) if(publicKeys.includes(row.setting_key as typeof publicKeys[number])) {
      const value=row.setting_value;
      if(typeof value === "string" || typeof value === "boolean") content[row.setting_key]=value;
    }
    return NextResponse.json({content},{headers:{"Cache-Control":"public, max-age=60, stale-while-revalidate=300"}});
  } catch {
    return NextResponse.json({content:defaults},{headers:{"Cache-Control":"no-store"}});
  }
}
