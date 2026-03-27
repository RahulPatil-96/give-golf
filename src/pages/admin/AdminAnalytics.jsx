import { useState, useEffect } from "react";
import { base44 } from "@/api/supabaseClient";
import { motion } from "framer-motion";
import { Users, DollarSign, Heart, Trophy, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminAnalytics() {
  const [stats, setStats] = useState({ users: 0, activeSubs: 0, totalPool: 0, draws: 0, winners: 0, charityCount: 0 });
  const [drawData, setDrawData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.User.list(),
      base44.entities.Subscription.filter({ status: "active" }),
      base44.entities.Draw.filter({ status: "published" }),
      base44.entities.Winner.list(),
      base44.entities.Charity.filter({ status: "active" }),
    ]).then(([users, subs, draws, winners, charities]) => {
      const totalPool = draws.reduce((sum, d) => sum + (d.total_pool || 0), 0);
      setStats({
        users: users.length,
        activeSubs: subs.length,
        totalPool,
        draws: draws.length,
        winners: winners.length,
        charityCount: charities.length,
      });
      setDrawData(draws.slice(0, 6).map(d => ({
        month: d.month,
        pool: d.total_pool || 0,
        subscribers: d.total_subscribers || 0,
      })).reverse());
    }).finally(() => setLoading(false));
  }, []);

  const cards = [
    { icon: Users, label: "Total Users", value: stats.users, color: "text-primary" },
    { icon: TrendingUp, label: "Active Subscribers", value: stats.activeSubs, color: "text-secondary" },
    { icon: DollarSign, label: "Total Prize Pool", value: `$${stats.totalPool.toLocaleString()}`, color: "text-chart-3" },
    { icon: Trophy, label: "Total Draws", value: stats.draws, color: "text-chart-4" },
    { icon: Users, label: "Total Winners", value: stats.winners, color: "text-chart-5" },
    { icon: Heart, label: "Partner Charities", value: stats.charityCount, color: "text-destructive" },
  ];

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold mb-1">Analytics</h1>
        <p className="text-muted-foreground">Platform overview and key metrics.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border border-border/50 rounded-2xl p-5"
          >
            <div className={`w-9 h-9 rounded-lg bg-muted flex items-center justify-center mb-3 ${card.color}`}>
              <card.icon className="w-4 h-4" />
            </div>
            <div className="font-serif text-2xl font-bold">{card.value}</div>
            <div className="text-sm text-muted-foreground">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {drawData.length > 0 && (
        <div className="bg-card border border-border/50 rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Prize Pool by Draw</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={drawData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="pool" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Prize Pool ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}