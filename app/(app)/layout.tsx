import { AppShell } from "@/components/layout/app-shell";

// Every customer screen lives under this route group and gets the sidebar shell.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
