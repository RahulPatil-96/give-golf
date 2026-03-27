import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Target, Heart, Trophy, CreditCard, LogOut } from "lucide-react";
import { base44 } from "@/api/supabaseClient";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { label: "My Scores", icon: Target, href: "/dashboard/scores" },
  { label: "My Charity", icon: Heart, href: "/dashboard/charity" },
  { label: "Winnings", icon: Trophy, href: "/dashboard/winnings" },
  { label: "Subscription", icon: CreditCard, href: "/dashboard/subscription" },
];

export default function DashboardSidebar({ user }) {
  const location = useLocation();

  return (
    <aside className="w-64 flex-shrink-0 hidden lg:flex flex-col bg-sidebar text-sidebar-foreground min-h-screen">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sidebar-primary/20 flex items-center justify-center font-bold text-sidebar-primary">
            {user?.full_name?.[0] || user?.email?.[0] || "?"}
          </div>
          <div>
            <div className="font-semibold text-sm truncate">{user?.full_name || "User"}</div>
            <div className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              location.pathname === item.href
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={() => base44.auth.logout()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground w-full transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}