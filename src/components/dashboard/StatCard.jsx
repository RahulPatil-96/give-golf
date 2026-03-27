import { motion } from "framer-motion";

export default function StatCard({ icon: IconComponent, label, value, sub, color = "text-primary", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-card border border-border/50 rounded-2xl p-5"
    >
      <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-3 ${color}`}>
        {IconComponent && <IconComponent className="w-5 h-5" />}
      </div>
      <div className="font-serif text-2xl font-bold mb-0.5">{value}</div>
      <div className="text-sm font-medium">{label}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </motion.div>
  );
}