import { useState, useEffect } from "react";
import { base44 } from "@/api/supabaseClient";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Heart, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const categories = ["All", "Health", "Education", "Environment", "Community", "Youth", "Veterans", "Animals", "Other"];

export default function Charities() {
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    base44.entities.Charity.filter({ status: "active" })
      .then(setCharities)
      .finally(() => setLoading(false));
  }, []);

  const filtered = charities.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "All" || c.category === category;
    return matchSearch && matchCategory;
  });

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-4">Our Partner Charities</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Browse the charities making a difference. Choose one to support with your subscription.
          </p>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search charities..."
              className="pl-10 rounded-full"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={category === cat ? "default" : "outline"}
                size="sm"
                className="rounded-full whitespace-nowrap"
                onClick={() => setCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No charities found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((charity, i) => (
              <motion.div
                key={charity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/charities/${charity.id}`} className="group block">
                  <div className="bg-card border border-border/50 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                    <div className="aspect-video bg-muted relative overflow-hidden">
                      {charity.image_url ? (
                        <img src={charity.image_url} alt={charity.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/5">
                          <Heart className="w-10 h-10 text-primary/20" />
                        </div>
                      )}
                      {charity.featured && (
                        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-bold">
                          Featured
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="text-xs font-medium text-primary mb-1">{charity.category}</div>
                      <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">{charity.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{charity.short_description || charity.description}</p>
                      {charity.total_raised > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <span className="font-semibold text-primary">${charity.total_raised.toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground ml-1">raised</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}