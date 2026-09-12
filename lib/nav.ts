import {
  ChartPie,
  ClipboardCheck,
  LayoutDashboard,
  List,
  Settings,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** true = shown in the secondary group at the bottom of the sidebar */
  secondary?: boolean;
};

/**
 * Screen map from docs/specs/screens.md. `/calibration/[id]` is not listed:
 * a calibration always starts from an appliance, never from the menu.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/appliances", label: "Appliances", icon: List },
  { href: "/breakdown", label: "Breakdown", icon: ChartPie },
  { href: "/confirm", label: "Confirm", icon: ClipboardCheck },
  { href: "/setup", label: "Household setup", icon: Settings, secondary: true },
  { href: "/dev", label: "Demo controls", icon: Wrench, secondary: true },
];
