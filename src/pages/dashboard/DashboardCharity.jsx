import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/supabaseClient";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, Search, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

export default function DashboardCharity() {
  const { user } = useOutletContext();
  const [charities, setCharities] = useState([]);
  const [currentCharity, setCurrentCharity] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [contribution, setContribution] = useState(10);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      base44.entities.Charity.filter({ status: "active" }),
      base44.entities.UserCharity.filter({ user_email: user.email }, "-created_date", 1),
    ]).then(([ch, uc]) => {
      setCharities(ch);
      if (uc[0]) {
        setCurrentCharity(uc[0]);
        setSelectedId(uc[0].charity_id);
        setContribution(uc[0].contribution_percentage);
      }
    }).finally(() => setLoading(false));
  }, [user]);

  const filtered = charities.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!selectedId) {
      toast({ title: "Please select a charity", variant: "destructive" });
      return;
    }
    setSaving(true);
    const charity = charities.find(c => c.id === selectedId);

    if (currentCharity) {
      await base44.entities.UserCharity.update(currentCharity.id, {
        charity_id: selectedId,
        charity_name: charity?.name || "",
        contribution_percentage: contribution,
      });
    } else {
      await base44.entities.UserCharity.create({
        user_email: user.email,
        charity_id: selectedId,
        charity_name: charity?.name || "",
        contribution_percentage: contribution,
      });
    }

    await base44.auth.updateMe({
      selected_charity_id: selectedId,
      charity_contribution_pct: contribution,
    });

    toast({ title: "Charity updated!", description: `${charity?.name} — ${contribution}%` });
    setSaving(false);

    // Re-fetch
    const uc = await base44.entities.UserCharity.filter({ user_email: user.email }, "-created_date", 1);
    if (uc[0]) setCurrentCharity(uc[0]);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-2xl pb-20 lg:pb-0">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold mb-1">My Charity</h1>
        <p className="text-muted-foreground">Choose where your contribution goes each month.</p>
      </div>

      {/* Current Selection */}
      {currentCharity && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-6">
          <div className="text-sm font-medium text-primary mb-1">Currently Supporting</div>
          <div className="font-semibold text-lg">{currentCharity.charity_name}</div>
          <div className="text-sm text-muted-foreground">{currentCharity.contribution_percentage}% of subscription</div>
        </div>
      )}

      {/* Contribution Slider */}
      <div className="bg-card border border-border/50 rounded-2xl p-6 mb-6">
        <label className="font-semibold block mb-3">
          Contribution: <span className="text-primary">{contribution}%</span>
          <span className="text-sm font-normal text-muted-foreground ml-2">(minimum 10%)</span>
        </label>
        <input
          type="range" min={10} max={100} value={contribution}
          onChange={(e) => setContribution(Number(e.target.value))}
          className="w-full accent-primary mb-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>10% (min)</span><span>55%</span><span>100%</span>
        </div>
      </div>

      {/* Charity Selector */}
      <div className="bg-card border border-border/50 rounded-2xl p-6">
        <h2 className="font-semibold mb-4">Select a Charity</h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-9 rounded-full" />
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {filtered.map(charity => (
            <motion.button
              key={charity.id}
              whileHover={{ scale: 1.01 }}
              onClick={() => setSelectedId(charity.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all border ${
                selectedId === charity.id
                  ? "border-primary bg-primary/5"
                  : "border-transparent hover:bg-muted/50"
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Heart className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{charity.name}</div>
                <div className="text-xs text-muted-foreground">{charity.category}</div>
              </div>
              {selectedId === charity.id && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
            </motion.button>
          ))}
        </div>
        <Button onClick={handleSave} disabled={saving} className="mt-4 w-full rounded-xl">
          {saving ? "Saving..." : "Save Charity Selection"}
        </Button>
      </div>
    </div>
  );
}