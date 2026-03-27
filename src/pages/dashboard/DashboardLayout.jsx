import { useState, useEffect } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/supabaseClient";
import DashboardSidebar from "../../components/dashboard/DashboardSidebar";
import { Menu, X, LayoutDashboard, Target, Heart, Trophy, CreditCard } from "lucide-react";

const mobileNav = [
  { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Scores", icon: Target, href: "/dashboard/scores" },
  { label: "Charity", icon: Heart, href: "/dashboard/charity" },
  { label: "Wins", icon: Trophy, href: "/dashboard/winnings" },
  { label: "Plan", icon: CreditCard, href: "/dashboard/subscription" },
];

export default function DashboardLayout() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    base44.auth.me()
      .then(u => { setUser(u); setLoading(false); })
      .catch(() => { navigate("/"); });
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      <DashboardSidebar user={user} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Bar */}
        <div className="lg:hidden bg-background border-b border-border/50 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <span className="font-serif font-bold text-lg">Dashboard</span>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet context={{ user, setUser }} />
        </main>

        {/* Mobile Bottom Nav */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border/50 flex z-30">
          {mobileNav.map(item => (
            <Link
              key={item.href}
              to={item.href}
              className={`flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
                location.pathname === item.href ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="w-5 h-5 mb-0.5" />
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}