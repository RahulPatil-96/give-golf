import { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { base44 } from "@/api/supabaseClient";
import { motion } from "framer-motion";
import StatCard from "../../components/dashboard/StatCard";
import { CreditCard, Target, Trophy, Heart, AlertCircle, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardOverview() {
  const { user } = useOutletContext();
  const [subscription, setSubscription] = useState(null);
  const [scores, setScores] = useState([]);
  const [winnings, setWinnings] = useState([]);
  const [userCharity, setUserCharity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      base44.entities.Subscription.filter({ user_email: user.email }, "-created_date", 1),
      base44.entities.Score.filter({ user_email: user.email }, "-play_date", 5),
      base44.entities.Winner.filter({ user_email: user.email }),
      base44.entities.UserCharity.filter({ user_email: user.email }, "-created_date", 1),
    ]).then(([subs, sc, wins, uc]) => {
      setSubscription(subs[0] || null);
      setScores(sc);
      setWinnings(wins);
      setUserCharity(uc[0] || null);
    }).finally(() => setLoading(false));
  }, [user]);

  const totalWon = winnings.reduce((sum, w) => sum + (w.prize_amount || 0), 0);
  const isActive = subscription?.status === "active";

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-4xl pb-20 lg:pb-0">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold mb-1">
          Welcome back{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}!
        </h1>
        <p className="text-muted-foreground">Here's your GiveGolf summary.</p>
      </div>

      {/* Subscription Alert */}
      {!isActive && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-6"
        >
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-medium text-destructive">No active subscription</div>
            <div className="text-sm text-muted-foreground">Subscribe to enter the monthly draw.</div>
          </div>
          <Link to="/subscribe">
            <Button size="sm" className="rounded-full">Subscribe</Button>
          </Link>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={CreditCard}
          label="Subscription"
          value={isActive ? "Active" : subscription?.status || "None"}
          sub={isActive ? `${subscription?.plan} plan` : ""}
          color={isActive ? "text-primary" : "text-destructive"}
          delay={0}
        />
        <StatCard
          icon={Target}
          label="Scores Logged"
          value={`${scores.length}/5`}
          sub={scores.length < 5 ? "Add more scores" : "Ready for draw"}
          delay={0.1}
        />
        <StatCard
          icon={Trophy}
          label="Total Winnings"
          value={`$${totalWon.toLocaleString()}`}
          sub={`${winnings.length} draw wins`}
          delay={0.2}
        />
        <StatCard
          icon={Heart}
          label="Charity"
          value={userCharity ? "Selected" : "None"}
          sub={userCharity?.charity_name || "Choose a charity"}
          color="text-chart-4"
          delay={0.3}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">My Scores</h3>
            <Link to="/dashboard/scores" className="text-sm text-primary flex items-center gap-1">
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {scores.length === 0 ? (
            <p className="text-sm text-muted-foreground">No scores yet. Add your first score to enter the draw!</p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {scores.map((s, i) => (
                <div key={i} className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-sm text-primary">
                  {s.score}
                </div>
              ))}
              {scores.length < 5 && (
                <div className="w-10 h-10 rounded-lg bg-muted border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-lg">+</div>
              )}
            </div>
          )}
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Charity Impact</h3>
            <Link to="/dashboard/charity" className="text-sm text-primary flex items-center gap-1">
              Change <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {userCharity ? (
            <div>
              <div className="font-medium">{userCharity.charity_name}</div>
              <div className="text-sm text-muted-foreground">{userCharity.contribution_percentage}% of your subscription</div>
              <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${userCharity.contribution_percentage}%` }} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No charity selected. Choose one to start giving!</p>
          )}
        </div>
      </div>

      {/* Recent Winnings */}
      {winnings.length > 0 && (
        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Winnings</h3>
            <Link to="/dashboard/winnings" className="text-sm text-primary flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {winnings.slice(0, 3).map((w, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <div className="font-medium text-sm">{w.match_type}</div>
                  <div className="text-xs text-muted-foreground">{w.month}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${w.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {w.payment_status}
                  </span>
                  <span className="font-semibold">${w.prize_amount?.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}