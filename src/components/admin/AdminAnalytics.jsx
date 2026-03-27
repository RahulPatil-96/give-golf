import { useState, useEffect } from "react";
import { base44 } from "@/api/supabaseClient";
import { Users, DollarSign, Heart, Trophy, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function AdminAnalytics() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalPool: 0,
    totalCharityContributions: 0,
    totalDraws: 0,
    totalWinners: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [users, subs, draws, winners] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.Subscription.filter({ status: "active" }),
        base44.entities.Draw.filter({ status: "published" }),
        base44.entities.Winner.filter({ status: "verified" }), // Or "paid"
      ]);

      const totalPool = draws.reduce((sum, d) => sum + (d.total_pool || 0), 0);
      const activeSubs = subs.length;
      
      // Calculate charity contributions: 10% of $29 per active sub (simplified)
      const charityContributions = activeSubs * 2.9; 

      setStats({
        totalUsers: users.length,
        activeSubscriptions: activeSubs,
        totalPool,
        totalCharityContributions: charityContributions,
        totalDraws: draws.length,
        totalWinners: winners.length,
      });

      // Chart data for last 6 draws
      const chartPoints = draws.slice(-6).map(d => ({
        month: d.month,
        pool: d.total_pool || 0,
        subscribers: d.total_subscribers || 0,
      }));
      setChartData(chartPoints);
      setLoading(false);
    };
    load().catch(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-600 bg-blue-50" },
    { label: "Active Subscriptions", value: stats.activeSubscriptions, icon: TrendingUp, color: "text-green-600 bg-green-50" },
    { label: "Total Prize Pool (All Time)", value: `$${stats.totalPool.toLocaleString()}`, icon: DollarSign, color: "text-yellow-600 bg-yellow-50" },
    { label: "Charity Contributions", value: `$${Math.round(stats.totalCharityContributions).toLocaleString()}`, icon: Heart, color: "text-pink-600 bg-pink-50" },
    { label: "Total Draws Run", value: stats.totalDraws, icon: Trophy, color: "text-purple-600 bg-purple-50" },
    { label: "Verified Winners", value: stats.totalWinners, icon: Trophy, color: "text-primary bg-primary/10" },
  ];

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold mb-6">Analytics Overview</h1>
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {cards.map((card, i) => (
              <div key={i} className="bg-card border border-border/50 rounded-xl p-5">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${card.color}`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <div className="font-serif text-2xl font-bold">{card.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{card.label}</div>
              </div>
            ))}
          </div>

          {chartData.length > 0 && (
            <div className="bg-card border border-border/50 rounded-xl p-6">
              <h3 className="font-semibold mb-4">Prize Pool by Draw Month</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="pool" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}