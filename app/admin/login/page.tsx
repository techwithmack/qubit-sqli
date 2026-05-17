import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { getAdminSession } from "@/lib/admin-auth";

export const metadata = {
  title: "Admin login — The Galactic Bestiary",
};

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <AdminLoginForm />
    </div>
  );
}
