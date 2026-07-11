import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBusinessByOwnerId } from "@/lib/battles";
import DashboardSidebar from "@/components/dashboard/dashboard-sidebar";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const business = await getBusinessByOwnerId(user.id).catch(() => null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex w-full flex-col gap-6 px-4 py-4 sm:px-6 lg:flex-row lg:px-8 lg:py-6">
        <DashboardSidebar userEmail={user.email} businessName={business?.name ?? null} />
        <main className="min-w-0 flex-1 space-y-6 rounded-none lg:pt-1">{children}</main>
      </div>
    </div>
  );
}
