import { Outlet, Link, useLocation } from "react-router-dom";
import { Users, Trophy, Heart, Award, BarChart3, ArrowLeft, Settings } from "lucide-react";

const links = [
  { label: "Analytics", href: "/admin", icon: BarChart3 },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Draws", href: "/admin/draws", icon: Trophy },
  { label: "Charities", href: "/admin/charities", icon: Heart },
  { label: "Winners", href: "/admin/winners", icon: Award },
];

export default function AdminLayout() {
  const location = useLocation();

  return (
    <div className="pt-16 lg:pt-20 min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground min-h-[calc(100vh-5rem)] hidden lg:block p-4">
        <Link to="/" className="flex items-center gap-2 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40 mb-3 px-3">
          Admin Panel
        </div>
        <nav className="space-y-1">
          {links.map(link => {
            const active = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1">
        {/* Mobile Nav */}
        <div className="lg:hidden border-b border-border bg-card overflow-x-auto">
          <div className="flex">
            {links.map(link => {
              const active = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    active ? "border-primary text-primary" : "border-transparent text-muted-foreground"
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}