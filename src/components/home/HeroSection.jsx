import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Heart, Trophy, Star, Users, TrendingUp } from "lucide-react";

const scoreNums = [32, 18, 27, 41, 9];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-background">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
      <div className="absolute top-32 right-20 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
      <div className="absolute bottom-40 left-10 w-60 h-60 bg-secondary/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left — Copy */}
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9 }}>

            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8"
            >
              <Star className="w-3.5 h-3.5 fill-primary" />
              Golf's Most Rewarding Subscription
            </motion.div>

            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-6 text-foreground">
              Play Golf.
              <br />
              <span className="text-primary">Win Prizes.</span>
              <br />
              Change Lives.
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg mb-10 leading-relaxed">
              Subscribe, log your five latest golf scores, and enter our monthly charity draw. Match your scores to winning numbers and win thousands — while funding causes you love.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-14">
              <Link to="/subscribe">
                <Button size="lg" className="rounded-full px-8 gap-2 text-base bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 h-14">
                  Start Playing
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button size="lg" variant="outline" className="rounded-full px-8 text-base h-14">
                  How It Works
                </Button>
              </a>
            </div>

            {/* Stats row */}
            <div className="flex gap-8 pt-8 border-t border-border/50">
              {[
                { value: "$2.1M+", label: "Donated to charity" },
                { value: "12K+", label: "Active members" },
                { value: "850+", label: "Monthly winners" },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.1 }}>
                  <div className="font-serif text-2xl sm:text-3xl font-bold text-primary">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right — Card Stack */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.3 }}
            className="relative hidden lg:flex items-center justify-center"
          >
            <div className="relative w-full max-w-md">

              {/* Main prize card */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="bg-card border border-border/60 rounded-3xl p-8 shadow-2xl shadow-primary/10"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <div className="font-bold text-foreground">Monthly Draw</div>
                      <div className="text-xs text-muted-foreground">March 2026</div>
                    </div>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium border border-green-200">Live</span>
                </div>

                <div className="mb-2 text-muted-foreground text-sm">This Month's Prize Pool</div>
                <div className="font-serif text-5xl font-bold text-foreground mb-1">$45,000</div>
                <div className="flex items-center gap-1 text-green-600 text-sm mb-6">
                  <TrendingUp className="w-4 h-4" />
                  +$3,200 rollover included
                </div>

                <div className="mb-3 text-muted-foreground text-xs uppercase tracking-wider">Winning Numbers</div>
                <div className="flex gap-2">
                  {scoreNums.map((n, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8 + i * 0.1 }}
                      className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center font-bold text-lg text-primary-foreground shadow-lg shadow-primary/20"
                    >
                      {n}
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Impact card */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-6 left-0 bg-card border border-border/60 rounded-2xl p-5 shadow-xl"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-secondary/20 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-secondary" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-foreground">Your Impact</div>
                    <div className="text-xs text-muted-foreground">This Year</div>
                  </div>
                </div>
                <div className="font-serif text-2xl font-bold text-foreground">$340 <span className="text-sm font-normal text-muted-foreground">donated</span></div>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-1.5 flex-1 rounded-full bg-secondary/50" />)}
                </div>
              </motion.div>

              {/* Members card */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute top-4 -right-4 bg-card border border-border/60 rounded-2xl px-4 py-3 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Members</div>
                    <div className="font-bold text-foreground text-sm">12,481</div>
                  </div>
                </div>
              </motion.div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}