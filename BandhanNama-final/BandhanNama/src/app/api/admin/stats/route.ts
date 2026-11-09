import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
export async function GET() {
 const auth=await requireAdmin(); if(!auth.ok) return NextResponse.json({error:auth.message},{status:auth.status});
 const [all,active,inactive,wishes,logs]=await Promise.all([
  auth.supabase.from("sisters").select("id",{count:"exact",head:true}),
  auth.supabase.from("sisters").select("id",{count:"exact",head:true}).eq("is_active",true),
  auth.supabase.from("sisters").select("id",{count:"exact",head:true}).eq("is_active",false),
  auth.supabase.from("site_settings").select("setting_key",{count:"exact",head:true}).in("setting_key",["common_wish","brother_message"]),
  auth.supabase.from("audit_logs").select("id,action,target_type,created_at").order("created_at",{ascending:false}).limit(5)
 ]);
 return NextResponse.json({stats:{total_sisters:all.count??0,active_sisters:active.count??0,inactive_sisters:inactive.count??0,configured_messages:wishes.count??0},recent_activity:logs.data??[]});
}
