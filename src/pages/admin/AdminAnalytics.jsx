import { useState, useEffect } from "react";
import { base44 } from "@/api/supabaseClient";
import { motion } from "framer-motion";
import { Users, DollarSign, Heart, Trophy, TrendingUp, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AdminAnalytics() {
  const [stats, setStats] = useState({ users: 0, activeSubs: 0, totalPool: 0, draws: 0, winners: 0, charityCount: 0 });
  const [drawData, setDrawData] = useState([]);
  const [recentWinners, setRecentWinners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [users, subs, draws, winners, charities] = await Promise.all([
          base44.entities.User.list(),
          base44.entities.Subscription.filter({ status: "active" }),
          base44.entities.Draw.filter({ status: "published" }),
          base44.entities.Winner.list("-created_at", 5),
          base44.entities.Charity.filter({ status: "active" }),
        ]);

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
        setRecentWinners(winners);
      } catch (error) {
        console.error("AdminAnalytics fetchData failed:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const cards = [
    { icon: Users, label: "Total Users", value: stats.users, change: "+12%", trending: "up", color: "text-blue-600", bg: "bg-blue-50" },
    { icon: TrendingUp, label: "Active Subscribers", value: stats.activeSubs, change: "+5.2%", trending: "up", color: "text-emerald-600", bg: "bg-emerald-50" },
    { icon: DollarSign, label: "Total Prize Pool", value: `$${stats.totalPool.toLocaleString()}`, change: "+18%", trending: "up", color: "text-amber-600", bg: "bg-amber-50" },
    { icon: Trophy, label: "Total Draws", value: stats.draws, change: "Monthly", trending: "none", color: "text-purple-600", bg: "bg-purple-50" },
    { icon: Activity, label: "Total Winners", value: stats.winners, change: "+3 today", trending: "up", color: "text-rose-600", bg: "bg-rose-50" },
    { icon: Heart, label: "Partner Charities", value: stats.charityCount, change: "Active", trending: "none", color: "text-pink-600", bg: "bg-pink-50" },
  ];

  if (loading) return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-40 rounded-3xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-[400px] rounded-3xl" />
        <Skeleton className="h-[400px] rounded-3xl" />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold mb-1 text-[#0a1e16]">Dashboard Overview</h1>
          <p className="text-muted-foreground">Monitor platform growth and community impact.</p>
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="bg-background border-primary/20 text-primary px-3 py-1 rounded-full">
             Live Data
           </Badge>
           <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-none shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden relative rounded-3xl cursor-default">
              <div className={cn("absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 rounded-full opacity-10 transition-transform group-hover:scale-125 duration-500", card.bg)} />
              <CardContent className="p-7">
                <div className="flex justify-between items-start mb-6">
                  <div className={cn("p-4 rounded-2xl transition-colors duration-300", card.bg)}>
                    <card.icon className={cn("w-6 h-6", card.color)} />
                  </div>
                  {card.trending !== "none" && (
                    <Badge variant="secondary" className={cn(
                      "flex items-center gap-1 font-semibold px-3 py-1 rounded-full",
                      card.trending === "up" ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"
                    )}>
                      {card.trending === "up" ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {card.change}
                    </Badge>
                  )}
                </div>
                <div>
                  <div className="text-4xl font-bold tracking-tight text-[#0a1e16]">{card.value}</div>
                  <div className="text-sm font-semibold text-muted-foreground mt-2 uppercase tracking-wider opacity-60">{card.label}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-serif text-[#0a1e16]">Prize Pool Trend</CardTitle>
            <CardDescription>Monthly growth of the subscription prize pool.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={drawData}>
                  <defs>
                    <linearGradient id="colorPool" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 12 }} 
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="pool" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorPool)" 
                    name="Prize Pool"
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-serif text-[#0a1e16]">Subscriber Growth</CardTitle>
            <CardDescription>Participation trends per monthly draw.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={drawData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 12 }} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc', radius: 10 }}
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  />
                  <Bar 
                    dataKey="subscribers" 
                    fill="#10b981" 
                    radius={[10, 10, 0, 0]} 
                    name="Subscribers"
                    barSize={32}
                    animationDuration={2500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-serif text-[#0a1e16]">Recent Winners</CardTitle>
              <CardDescription>Latest lucky participants across all draws.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="rounded-full text-primary font-bold hover:bg-primary/5">View All</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {recentWinners.length > 0 ? (
                recentWinners.map((winner, i) => (
                  <div key={winner.id} className="flex items-center justify-between group p-3 rounded-2xl hover:bg-muted/30 transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                        {winner.user_name?.slice(0, 1).toUpperCase() || "W"}
                      </div>
                      <div>
                        <div className="font-bold group-hover:text-primary transition-colors text-[#0a1e16]">{winner.user_name || winner.user_email}</div>
                        <div className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] h-4 py-0 font-bold uppercase border-muted-foreground/20">{winner.month}</Badge>
                          <span>•</span>
                          <span>{winner.match_type}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-emerald-600">+${winner.prize_amount?.toLocaleString()}</div>
                      <div className={cn(
                        "text-[10px] font-bold uppercase tracking-widest mt-1",
                        winner.status === "paid" ? "text-emerald-500" : "text-amber-500"
                      )}>{winner.status}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-muted-foreground bg-muted/20 rounded-2xl flex flex-col items-center gap-2">
                   <Trophy className="w-8 h-8 opacity-20" />
                   <p className="font-medium">No winners recorded yet.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-primary text-white overflow-hidden relative rounded-3xl">
          <div className="absolute top-0 right-0 w-64 h-64 -mr-20 -mt-20 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 -ml-12 -mb-12 bg-emerald-400/20 rounded-full blur-2xl" />
          <CardHeader>
            <CardTitle className="text-xl font-serif">Community Impact</CardTitle>
            <CardDescription className="text-white/60">Every draw supports our active charity partners.</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-8">
              <div className="p-6 bg-white/10 rounded-3xl backdrop-blur-xl border border-white/10">
                <div className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1">Total Contributions</div>
                <div className="text-4xl font-bold tracking-tight">$42,850</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Impact Goal</div>
                  <div className="text-2xl font-bold">85%</div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Partners</div>
                  <div className="text-2xl font-bold">{stats.charityCount}</div>
                </div>
              </div>
              <Button className="w-full bg-white text-primary hover:bg-white/90 rounded-2xl font-bold h-12 shadow-lg shadow-black/10 transition-transform active:scale-95">
                Manage Charities
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}