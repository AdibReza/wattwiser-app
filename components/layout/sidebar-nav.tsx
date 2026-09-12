"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/nav";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const primary = NAV_ITEMS.filter((i) => !i.secondary);
  const secondary = NAV_ITEMS.filter((i) => i.secondary);

  const render = (items: typeof NAV_ITEMS) =>
    items.map(({ href, label, icon: Icon }) => {
      const active = pathname === href || pathname.startsWith(href + "/");
      return (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            active
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-muted"
          )}
        >
          <Icon className="size-4 shrink-0" aria-hidden />
          {label}
        </Link>
      );
    });

  return (
    <nav className="flex h-full flex-col gap-1" aria-label="Main">
      {render(primary)}
      <div className="my-3 border-t" />
      {render(secondary)}
    </nav>
  );
}
