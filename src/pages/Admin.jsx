import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { motion } from "framer-motion";
import { Users, Trophy, Heart, ShieldCheck, BarChart3, LogOut } from "lucide-react";
import AdminUsers from "../components/admin/AdminUsers";
import AdminDraws from "../components/admin/AdminDraws";
import AdminCharities from "../components/admin/AdminCharities";
import AdminWinners from "../components/admin/AdminWinners";
import AdminAnalytics from "../components/admin/AdminAnalytics";

const tabs = [
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "users", label: "Users", icon: Users },
  { id: "draws", label: "Draws", icon: Trophy },
  { id: "charities", label: "Charities", icon: Heart },
  { id: "winners", label: "Winners", icon: ShieldCheck },
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState("analytics");
  const { isLoadingAuth, logout } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-16 lg:w-56 bg-sidebar text-sidebar-foreground flex flex-col fixed top-0 left-0 bottom-0 z-30">
        <div className="p-4 lg:p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="hidden lg:block font-serif font-bold text-sm">GiveGolf Admin</span>
          </div>
        </div>
        <nav className="flex-1 p-3">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition-all ${
                activeTab === tab.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70"
              }`}
            >
              <tab.icon className="w-4 h-4 flex-shrink-0" />
              <span className="hidden lg:block">{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden lg:block">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-16 lg:ml-56 p-6 lg:p-8">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {activeTab === "analytics" && <AdminAnalytics />}
          {activeTab === "users" && <AdminUsers />}
          {activeTab === "draws" && <AdminDraws />}
          {activeTab === "charities" && <AdminCharities />}
          {activeTab === "winners" && <AdminWinners />}
        </motion.div>
      </div>
    </div>
  );
}

