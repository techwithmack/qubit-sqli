import { redirect } from "next/navigation";
import { AdminConsole } from "@/components/AdminConsole";
import { getAdminSession } from "@/lib/admin-auth";

export const metadata = {
  title: "Admin console — The Galactic Bestiary",
};

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return <AdminConsole session={session} />;
}
