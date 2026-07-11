"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import LogoutButton from "@/components/logout-button";

type DashboardSidebarProps = {
  userEmail: string;
  businessName?: string | null;
};

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/battles", label: "Battles" },
  { href: "/dashboard/battles/new", label: "Create battle" },
  { href: "/dashboard/settings", label: "Profile settings" },
  { href: "/", label: "Home" },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard" || href === "/") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function DashboardSidebar({
  userEmail,
  businessName,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-72 lg:shrink-0">
      <div className="flex h-full flex-col border-border/70 bg-background/95 lg:border-r lg:pr-6">
        <div className="flex items-center gap-3 pb-6">
          <div className="grid size-9 place-items-center rounded-md border border-border bg-card text-sm font-semibold">
            M
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-5">MenuBattle</p>
            <p className="truncate text-xs text-muted-foreground">
              {businessName ?? userEmail}
            </p>
          </div>
        </div>

        {/* <div className="rounded-lg border border-border/70 bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Dashboard
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Manage battles, tune your profile and launch experiments from one place.
          </p>
        </div> */}

        <nav className="mt-6 grid gap-1">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Button
                key={item.href}
                asChild
                variant={active ? "secondary" : "ghost"}
                className="justify-start rounded-md px-3 text-left"
              >
                <Link href={item.href}>{item.label}</Link>
              </Button>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3 pt-6">
          <div className="rounded-lg border border-border/70 bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Signed in
            </p>
            <p className="mt-1 break-words text-sm leading-6">{userEmail}</p>
          </div>

          <LogoutButton className="w-full justify-start" />
        </div>
      </div>
    </aside>
  );
}
