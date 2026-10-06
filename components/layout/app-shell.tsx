
"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Brand } from "@/components/layout/brand";
import { SidebarNav } from "@/components/layout/sidebar-nav";

export function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr] md:items-start">
      <aside className="hidden border-r bg-sidebar md:sticky md:top-0 md:flex md:h-screen md:flex-col md:gap-6 md:self-start md:overflow-y-auto md:p-4">
        <Brand />
        <SidebarNav />
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-sidebar px-2 py-2 md:hidden">
        <Brand />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="size-10"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="flex w-64 flex-col p-4">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <div className="mb-6">
              <Brand />
            </div>
            <SidebarNav onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-8">
        {children}
      </main>
    </div>
  );
}
