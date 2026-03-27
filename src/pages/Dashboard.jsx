import { useState, useEffect } from "react";
import { base44 } from "@/api/supabaseClient";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Target, Heart, CreditCard, Upload, CheckCircle, Clock, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ScorePanel from "../components/dashboard/ScorePanel";
import CharityPanel from "../components/dashboard/CharityPanel";
import WinningsPanel from "../components/dashboard/WinningsPanel";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [scores, setScores] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);
      const [subs, sc] = await Promise.all([
        base44.entities.Subscription.filter({ user_email: me.email }, "-created_at", 1),
        base44.entities.Score.filter({ user_email: me.email }, "-play_date", 5),
      ]);
      if (subs.length) setSubscription(subs[0]);
      setScores(sc);
      setLoading(false);
    };
    load().catch(() => setLoading(false));
  }, []);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "scores", label: "My Scores" },
    { id: "charity", label: "Charity" },
    { id: "winnings", label: "Winnings" },
  ];

  const statusConfig = {
    active: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Active" },
    expired: { color: "bg-red-100 text-red-800", icon: AlertCircle, label: "Expired" },
    cancelled: { color: "bg-gray-100 text-gray-800", icon: AlertCircle, label: "Cancelled" },
    none: { color: "bg-yellow-100 text-yellow-800", icon: Clock, label: "No Subscription" },
  };

  const status = statusConfig[subscription?.status || user?.subscription_status || "none"];

  if (loading) {
    return (
      <div className="pt-24 flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-20 pb-16 min-h-screen bg-muted/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-8"
        >
          <h1 className="font-serif text-3xl font-bold">
            Welcome back, {user?.full_name?.split(" ")[0] || "Player"} 👋
          </h1>
          <p className="text-muted-foreground mt-1">Track your scores, monitor your impact, and check your winnings.</p>
        </motion.div>

        {/* Status Bar */}
        {!subscription || subscription.status !== "active" ? (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-6 flex items-center justify-between">
            <div>
              <div className="font-semibold">No active subscription</div>
              <div className="text-sm text-muted-foreground">Subscribe to enter monthly draws and track your scores.</div>
            </div>
            <Link to="/subscribe">
              <Button className="rounded-full gap-2">Subscribe Now <ArrowRight className="w-4 h-4" /></Button>
            </Link>
          </div>
        ) : null}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Subscription",
              value: status?.label,
              icon: CreditCard,
              badge: <Badge className={status?.color}>{status?.label}</Badge>,
            },
            {
              label: "Scores Entered",
              value: `${scores.length}/5`,
              icon: Target,
              sub: scores.length < 5 ? "Add more scores" : "Full — you're in!",
            },
            {
              label: "Plan",
              value: subscription ? (subscription.plan === "yearly" ? "Yearly" : "Monthly") : "None",
              icon: Trophy,
              sub: subscription?.end_date ? `Until ${subscription.end_date}` : "—",
            },
            {
              label: "Charity %",
              value: `${user?.charity_contribution_pct || 10}%`,
              icon: Heart,
              sub: "of your subscription",
            },
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-card border border-border/50 rounded-xl p-4"
            >
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <card.icon className="w-4 h-4 text-primary" />
                </div>
                {card.badge}
              </div>
              <div className="mt-3 font-serif text-2xl font-bold">{card.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{card.sub || card.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-xl p-1 mb-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-max px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {activeTab === "overview" && (
            <div className="grid lg:grid-cols-2 gap-6">
              <ScorePanel scores={scores} setScores={setScores} user={user} subscription={subscription} compact />
              <CharityPanel user={user} setUser={setUser} compact />
            </div>
          )}
          {activeTab === "scores" && (
            <ScorePanel scores={scores} setScores={setScores} user={user} subscription={subscription} />
          )}
          {activeTab === "charity" && (
            <CharityPanel user={user} setUser={setUser} />
          )}
          {activeTab === "winnings" && (
            <WinningsPanel user={user} />
          )}
        </motion.div>
      </div>
    </div>
  );
}