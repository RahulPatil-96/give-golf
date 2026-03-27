import { useState, useEffect } from "react";
import { base44 } from "@/api/supabaseClient";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Heart, Shield, Trophy } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const plans = [
  {
    id: "monthly",
    name: "Monthly",
    price: 29,
    period: "/month",
    description: "Perfect to get started",
    features: [
      "Monthly draw entry",
      "Score tracking",
      "Choose your charity",
      "10%+ charity contribution",
      "Winner verification",
    ],
  },
  {
    id: "yearly",
    name: "Yearly",
    price: 249,
    period: "/year",
    savings: "Save $99",
    description: "Best value — committed impact",
    features: [
      "All Monthly features",
      "12 monthly draws",
      "Priority support",
      "Bonus 2% contribution",
      "Annual impact report",
    ],
    popular: true,
  },
];

export default function Subscribe() {
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [charities, setCharities] = useState([]);
  const [selectedCharity, setSelectedCharity] = useState("");
  const [contributionPct, setContributionPct] = useState(10);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    base44.entities.Charity.filter({ status: "active" }).then(setCharities).catch(() => {});
  }, []);

  const handleSubscribe = async () => {
    if (!user) {
      base44.auth.redirectToLogin("/subscribe");
      return;
    }

    if (!selectedCharity) {
      toast({ title: "Please select a charity", variant: "destructive" });
      return;
    }

    setLoading(true);
    const plan = plans.find(p => p.id === selectedPlan);

    // Create subscription
    await base44.entities.Subscription.create({
      user_email: user.email,
      plan: selectedPlan,
      status: "active",
      amount: plan.price,
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date(Date.now() + (selectedPlan === "yearly" ? 365 : 30) * 86400000).toISOString().split("T")[0],
      charity_contribution_pct: contributionPct,
    });

    // Save charity selection
    await base44.entities.UserCharity.create({
      user_email: user.email,
      user_id: user.id,
      charity_id: selectedCharity,
      percentage: 100, // For now, 100% of their contribution goes to this charity
    });

    // Update user
    await base44.auth.updateMe({
      subscription_status: "active",
      charity_contribution_pct: contributionPct,
    });

    toast({ title: "Subscription activated!", description: "Welcome to GiveGolf!" });
    navigate("/dashboard");
    setLoading(false);
  };

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Join the movement
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Every subscription fuels prizes and charity. Pick a plan, choose your charity, and start making an impact.
          </p>
        </motion.div>

        {/* Plan Cards */}
        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12">
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative cursor-pointer rounded-2xl border-2 p-6 transition-all ${
                selectedPlan === plan.id
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                  : "border-border hover:border-primary/30"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-bold">
                  Most Popular
                </div>
              )}
              {plan.savings && (
                <div className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {plan.savings}
                </div>
              )}
              <div className="mb-4">
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>
              <div className="mb-6">
                <span className="font-serif text-4xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Charity Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-xl mx-auto bg-card border border-border/50 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Choose Your Charity</h3>
          </div>
          <select
            value={selectedCharity}
            onChange={(e) => setSelectedCharity(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm mb-4"
          >
            <option value="">Select a charity...</option>
            {charities.map(c => (
              <option key={c.id} value={c.id}>{c.name} — {c.category}</option>
            ))}
          </select>
          <div>
            <label className="text-sm font-medium mb-2 block">
              Contribution: {contributionPct}% <span className="text-muted-foreground">(min 10%)</span>
            </label>
            <input
              type="range"
              min={10}
              max={100}
              value={contributionPct}
              onChange={(e) => setContributionPct(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>10%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </motion.div>

        {/* Subscribe Button */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={handleSubscribe}
            disabled={loading}
            className="rounded-full px-12 py-6 text-lg bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
          >
            {loading ? "Processing..." : `Subscribe — $${plans.find(p => p.id === selectedPlan)?.price}${plans.find(p => p.id === selectedPlan)?.period}`}
          </Button>
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1"><Shield className="w-4 h-4" /> Secure payment</div>
            <div className="flex items-center gap-1"><Trophy className="w-4 h-4" /> Instant draw entry</div>
          </div>
        </div>
      </div>
    </div>
  );
}