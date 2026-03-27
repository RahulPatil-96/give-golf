import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Trophy, TrendingUp } from "lucide-react";

const tiers = [
  { match: "5 Numbers", pct: "40%", prize: "$18,000", color: "from-yellow-50 to-yellow-50/50", border: "border-yellow-200", textColor: "text-yellow-600", iconBg: "bg-yellow-100", label: "Jackpot" },
  { match: "4 Numbers", pct: "35%", prize: "$15,750", color: "from-primary/5 to-primary/5", border: "border-primary/20", textColor: "text-primary", iconBg: "bg-primary/10", label: "Major Win" },
  { match: "3 Numbers", pct: "25%", prize: "$11,250", color: "from-secondary/10 to-secondary/5", border: "border-secondary/20", textColor: "text-secondary-foreground", iconBg: "bg-secondary/20", label: "Win" },
];

export default function PrizePoolBanner() {
  return (
    <section className="py-28 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-1/3 w-96 h-96 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-64 h-64 bg-white rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 border border-white/30 text-primary-foreground text-sm font-medium mb-6">
              <Zap className="w-3.5 h-3.5" />
              April 2026 Draw — Live Now
            </div>

            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 text-primary-foreground">
              This Month's
              <br />
              Prize Pool
            </h2>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, type: "spring" }}
              className="font-serif text-7xl sm:text-8xl font-bold text-primary-foreground mb-2"
            >
              $45,000
            </motion.div>

            <div className="flex items-center gap-2 text-primary-foreground/70 text-sm mb-8">
              <TrendingUp className="w-4 h-4" />
              Includes $3,200 jackpot rollover from last month
            </div>

            <p className="text-primary-foreground/70 max-w-md mb-10 leading-relaxed">
              Every active subscriber enters automatically with their 5 most recent golf scores. The more you play, the better your numbers.
            </p>

            <Link to="/subscribe">
              <Button size="lg" variant="secondary" className="rounded-full px-10 gap-2 text-base h-14 shadow-2xl">
                Join This Draw
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>

          {/* Right — Prize tiers */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="space-y-4"
          >
            {tiers.map((tier, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className={`bg-gradient-to-r ${tier.color} border ${tier.border} rounded-2xl p-6 flex items-center justify-between bg-white/90 backdrop-blur-sm`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${tier.iconBg} flex items-center justify-center`}>
                    <Trophy className={`w-5 h-5 ${tier.textColor}`} />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5 uppercase tracking-wider">{tier.label}</div>
                    <div className="font-bold text-foreground">{tier.match}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-serif text-2xl font-bold ${tier.textColor}`}>{tier.prize}</div>
                  <div className="text-xs text-muted-foreground">{tier.pct} of pool</div>
                </div>
              </motion.div>
            ))}

            <div className="bg-white/20 border border-white/30 rounded-2xl p-5 mt-4">
              <p className="text-sm text-primary-foreground/80 text-center">
                🎰 No 5-match winner? The jackpot rolls over and <span className="text-primary-foreground font-medium">grows next month</span>.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}