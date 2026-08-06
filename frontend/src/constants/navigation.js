import {
  Bookmark,
  CircleHelp,
  History,
  LayoutDashboard,
  Settings,
  Sparkles,
} from "lucide-react";

/** Primary sidebar destinations. */
export const PRIMARY_NAV = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/research", label: "Research", icon: Sparkles },
  { to: "/app/history", label: "History", icon: History },
  { to: "/app/saved", label: "Saved Reports", icon: Bookmark },
];

/** Secondary destinations, pinned to the bottom of the sidebar. */
export const SECONDARY_NAV = [
  { to: "/app/settings", label: "Settings", icon: Settings },
  { to: "/app/help", label: "Help", icon: CircleHelp },
];

/** Marketing site anchors. */
export const MARKETING_NAV = [
  { href: "#features", label: "Features" },
  { href: "#pipeline", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];
