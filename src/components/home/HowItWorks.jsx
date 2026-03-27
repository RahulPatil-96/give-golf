import { motion } from "framer-motion";
import { UserPlus, Target, Trophy, Heart, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Subscribe",
    description: "Choose a monthly or yearly plan. A portion of every subscription goes directly to your chosen charity.",
    color: "bg-primary text-primary-foreground",
    glow: "shadow-primary/25",
    accent: "from-primary/10",
    num: "01",
  },
  {
    icon: Target,
    title: "Log Your Scores",
    description: "Enter your latest 5 golf scores (1–45). These become your personal draw numbers for the month.",
    color: "bg-secondary text-secondary-foreground",
    glow: "shadow-secondary/25",
    accent: "from-secondary/10",
    num: "02",
  },
  {
    icon: Trophy,
    title: "Win Prizes",
    description: "Our monthly draw matches your scores against winning numbers. Match 3, 4, or all 5 to win big!",
    color: "bg-chart-3 text-white",
    glow: "shadow-chart-3/25",
    accent: "from-chart-3/10",
    num: "03",
  },
  {
    icon: Heart,
    title: "Give Back",
    description: "Your subscription fuels both prizes and charity. Choose your cause and watch your impact grow over time.",
    color: "bg-chart-4 text-white",
    glow: "shadow-chart-4/25",
    accent: "from-chart-4/10",
    num: "04",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 bg-background relative overflow-hidden">
      {/* Subtle background grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Simple & Meaningful
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            Four simple steps to play, win, and make a real difference.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
          {/* Connector lines on desktop */}
          <div className="hidden lg:block absolute top-14 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-primary/30 via-secondary/30 to-chart-4/30 z-0" />

          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.6 }}
              className="relative z-10 group"
            >
              <div className={`bg-card border border-border/50 rounded-3xl p-7 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 h-full bg-gradient-to-b ${step.accent} to-transparent`}>
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl ${step.color} shadow-lg ${step.glow} flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300`}>
                  <step.icon className="w-7 h-7" />
                </div>

                {/* Number */}
                <div className="font-serif text-5xl font-bold text-border/40 mb-3 leading-none">
                  {step.num}
                </div>

                <h3 className="font-serif font-bold text-xl mb-3">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}