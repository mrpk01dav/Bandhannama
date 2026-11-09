import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, writeAudit } from "@/lib/admin/guard";
const schema = z.object({ display_name: z.string().trim().min(1).max(80).optional(), sister_id: z.string().uuid().nullable().optional(), is_visible: z.boolean().optional(), sort_order: z.number().int().min(-10000).max(10000).optional() });
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
 const auth = await requireAdmin(); if (!auth.ok) return NextResponse.json({error:auth.message},{status:auth.status}); if(auth.role!=="admin") return NextResponse.json({error:"Only administrators can edit public names."},{status:403});
 const {id}=await context.params; const parsed=schema.safeParse(await request.json().catch(()=>null)); if(!parsed.success) return NextResponse.json({error:"Invalid update."},{status:400});
 const {data,error}=await auth.supabase.from("public_name_suggestions").update(parsed.data).eq("id",id).select("id,display_name,sister_id,is_visible,sort_order").single();
 if(error||!data) return NextResponse.json({error:"Could not update public name."},{status:400}); await writeAudit(auth.supabase,auth.user.id,"public_name.updated","public_name",id); return NextResponse.json({name:data});
}
export async function DELETE(_request:Request,context:{params:Promise<{id:string}>}) {
 const auth=await requireAdmin(); if(!auth.ok) return NextResponse.json({error:auth.message},{status:auth.status}); if(auth.role!=="admin") return NextResponse.json({error:"Only administrators can delete public names."},{status:403});
 const {id}=await context.params; const {error}=await auth.supabase.from("public_name_suggestions").delete().eq("id",id); if(error) return NextResponse.json({error:"Could not delete public name."},{status:400}); await writeAudit(auth.supabase,auth.user.id,"public_name.deleted","public_name",id); return NextResponse.json({success:true});
}
