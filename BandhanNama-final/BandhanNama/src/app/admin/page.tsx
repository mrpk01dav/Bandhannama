import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/guard";
import AdminDashboard from "@/components/admin-dashboard";

export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const auth = await requireAdmin();
  if (!auth.ok) redirect("/admin/login");
  return <AdminDashboard role={auth.role === "editor" ? "editor" : "admin"} email={auth.user.email ?? "Administrator"} />;
}
