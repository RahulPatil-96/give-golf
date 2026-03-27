import { motion } from "framer-motion";
import { Shield, Award, Heart, Zap } from "lucide-react";

const trust = [
  { icon: Shield, title: "Secure Payments", desc: "Powered by Stripe — bank-level encryption." },
  { icon: Award, title: "Verified Charities", desc: "All partner charities are vetted and accredited." },
  { icon: Heart, title: "Min 10% to Charity", desc: "Guaranteed minimum from every subscription." },
  { icon: Zap, title: "Instant Draw Results", desc: "Monthly draws published transparently for all." },
];

export default function TrustStrip() {
  return (
    <section className="py-14 border-y border-border/50 bg-muted/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {trust.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-sm">{item.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}