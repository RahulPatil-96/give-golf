import { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { base44 } from "@/api/supabaseClient";
import { motion } from "framer-motion";
import { CreditCard, CheckCircle, XCircle, Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardSubscription() {
  const { user } = useOutletContext();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    base44.entities.Subscription.filter({ user_email: user.email }, "-created_date", 1)
      .then(subs => setSubscription(subs[0] || null))
      .finally(() => setLoading(false));
  }, [user]);

  const statusColor = {
    active: "text-green-600 bg-green-100",
    expired: "text-red-600 bg-red-100",
    cancelled: "text-gray-600 bg-gray-100",
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-2xl pb-20 lg:pb-0">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold mb-1">Subscription</h1>
        <p className="text-muted-foreground">Manage your GiveGolf membership.</p>
      </div>

      {!subscription ? (
        <div className="bg-card border border-border/50 rounded-2xl p-8 text-center">
          <CreditCard className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-semibold text-lg mb-2">No Active Subscription</h2>
          <p className="text-muted-foreground mb-6">Subscribe to enter monthly draws and support charities.</p>
          <Link to="/subscribe">
            <Button className="rounded-full px-8">Subscribe Now</Button>
          </Link>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-card border border-border/50 rounded-2xl p-6 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="font-serif text-2xl font-bold capitalize">{subscription.plan} Plan</div>
                <div className="text-muted-foreground">
                  ${subscription.amount}/{subscription.plan === "yearly" ? "year" : "month"}
                </div>
              </div>
              <span className={`text-sm px-3 py-1.5 rounded-full font-medium capitalize ${statusColor[subscription.status] || "bg-gray-100 text-gray-600"}`}>
                {subscription.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-xl p-4">
                <Calendar className="w-4 h-4 text-muted-foreground mb-1" />
                <div className="font-medium text-sm">Start Date</div>
                <div className="text-muted-foreground text-sm">{subscription.start_date}</div>
              </div>
              <div className="bg-muted/50 rounded-xl p-4">
                <RefreshCw className="w-4 h-4 text-muted-foreground mb-1" />
                <div className="font-medium text-sm">Renewal Date</div>
                <div className="text-muted-foreground text-sm">{subscription.end_date}</div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Plan Features</h3>
            {[
              "Monthly draw entry",
              "Score tracking (up to 5 scores)",
              "Charity contribution",
              `${subscription.charity_contribution_pct || 10}% to your chosen charity`,
              subscription.plan === "yearly" ? "Annual impact report" : "Monthly impact summary",
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm">{f}</span>
              </div>
            ))}
          </div>

          {subscription.status === "active" && (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground mb-4">Need to change your plan?</p>
              <Link to="/subscribe">
                <Button variant="outline" className="rounded-full px-8">Change Plan</Button>
              </Link>
            </div>
          )}

          {subscription.status !== "active" && (
            <div className="mt-6 text-center">
              <Link to="/subscribe">
                <Button className="rounded-full px-8">Reactivate Subscription</Button>
              </Link>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}