import { useState, useEffect } from "react";
import { base44 } from "@/api/supabaseClient";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ArrowRight, ExternalLink, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FeaturedCharity() {
  const [charity, setCharity] = useState(null);
  const [charities, setCharities] = useState([]);

  useEffect(() => {
    base44.entities.Charity.filter({ status: "active" }, "-total_raised", 6)
      .then(data => {
        const featured = data.find(c => c.featured);
        setCharity(featured || data[0] || null);
        setCharities(data.slice(0, 5));
      })
      .catch(() => {});
  }, []);

  return (
    <section className="py-28 bg-muted/20 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Heart className="w-3.5 h-3.5 fill-primary" />
            Community Impact
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl font-bold mb-4">Charities You Support</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Every subscription directly funds causes that matter. You choose where your impact goes.
          </p>
        </motion.div>

        {charity && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid lg:grid-cols-5 gap-0 bg-card border border-border/50 rounded-3xl overflow-hidden shadow-xl shadow-primary/5 mb-8"
          >
            {/* Image — spans 2 cols */}
            <div className="lg:col-span-2 aspect-video lg:aspect-auto relative overflow-hidden min-h-[280px]">
              {charity.image_url ? (
                <img src={charity.image_url} alt={charity.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <Heart className="w-20 h-20 text-primary/30" />
                </div>
              )}
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20 hidden lg:block" />
              {/* Featured badge */}
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-lg">
                  ⭐ Featured This Month
                </span>
              </div>
            </div>

            {/* Content — spans 3 cols */}
            <div className="lg:col-span-3 p-8 lg:p-12 flex flex-col justify-center">
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4 w-fit">
                {charity.category}
              </div>
              <h3 className="font-serif text-3xl lg:text-4xl font-bold mb-4">{charity.name}</h3>
              <p className="text-muted-foreground leading-relaxed mb-8 text-base">
                {charity.short_description || charity.description?.slice(0, 180) + "..."}
              </p>

              {charity.total_raised > 0 && (
                <div className="flex items-center gap-6 mb-8 p-5 bg-muted/50 rounded-2xl border border-border/40">
                  <div>
                    <div className="font-serif text-3xl font-bold text-primary">${charity.total_raised.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">raised through GiveGolf</div>
                  </div>
                  <div className="h-12 w-px bg-border" />
                  <div className="flex items-center gap-2 text-green-600">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-sm font-medium">Growing every month</span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Link to={`/charities/${charity.id}`}>
                  <Button className="rounded-full px-6 gap-2 shadow-lg shadow-primary/20">
                    Learn More <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                {charity.website && (
                  <a href={charity.website} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="rounded-full px-6 gap-2">
                      Visit Website <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Other charities row */}
        {charities.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">All Partner Charities</h3>
              <Link to="/charities" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {charities.filter(c => c.id !== charity?.id).slice(0, 5).map((c, i) => (
                <Link key={c.id} to={`/charities/${c.id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07 }}
                    className="group bg-card border border-border/50 rounded-2xl p-4 hover:border-primary/40 hover:shadow-md transition-all duration-300 text-center"
                  >
                    {c.image_url ? (
                      <img src={c.image_url} alt={c.name} className="w-10 h-10 rounded-xl object-cover mx-auto mb-3 group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <Heart className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div className="text-xs font-medium leading-tight line-clamp-2">{c.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{c.category}</div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-14"
        >
          <p className="text-muted-foreground mb-4">Ready to make your game count?</p>
          <Link to="/subscribe">
            <Button size="lg" className="rounded-full px-10 gap-2 shadow-lg shadow-primary/20">
              Start Your Subscription <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}