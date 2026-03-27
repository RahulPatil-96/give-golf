import { Outlet, Link, useLocation } from "react-router-dom";
import DashboardSidebar from "./DashboardSidebar";
import { LayoutDashboard, Target, Heart, Trophy, CreditCard, Menu } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const mobileLinks = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Scores", href: "/dashboard/scores", icon: Target },
  { label: "Charity", href: "/dashboard/charity", icon: Heart },
  { label: "Winnings", href: "/dashboard/winnings", icon: Trophy },
  { label: "Plan", href: "/dashboard/subscription", icon: CreditCard },
];

export default function DashboardLayout() {
  const location = useLocation();

  return (
    <div className="pt-16 lg:pt-20 min-h-screen flex">
      <DashboardSidebar />
      <div className="flex-1">
        {/* Mobile Nav */}
        <div className="lg:hidden border-b border-border bg-card overflow-x-auto">
          <div className="flex">
            {mobileLinks.map(link => {
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
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
}