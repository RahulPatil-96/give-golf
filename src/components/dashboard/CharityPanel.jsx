import { useState, useEffect } from "react";
import { base44 } from "@/api/supabaseClient";
import { motion } from "framer-motion";
import { Heart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export default function CharityPanel({ user, setUser, compact }) {
  const [charities, setCharities] = useState([]);
  const [selected, setSelected] = useState(user?.selected_charity_id || "");
  const [pct, setPct] = useState(user?.charity_contribution_pct || 10);
  const [saving, setSaving] = useState(false);
  const [currentCharity, setCurrentCharity] = useState(null);

  useEffect(() => {
    base44.entities.Charity.filter({ status: "active" }).then(setCharities);
    if (user?.selected_charity_id) {
      base44.entities.Charity.filter({ id: user.selected_charity_id })
        .then(data => { if (data.length) setCurrentCharity(data[0]); });
    }
  }, [user]);

  const handleSave = async () => {
    if (!selected) { toast({ title: "Please select a charity", variant: "destructive" }); return; }
    setSaving(true);
    const charityObj = charities.find(c => c.id === selected);

    // Upsert user charity
    const existing = await base44.entities.UserCharity.filter({ user_email: user.email });
    if (existing.length) {
      await base44.entities.UserCharity.update(existing[0].id, {
        charity_id: selected,
        charity_name: charityObj?.name || "",
        contribution_percentage: pct,
      });
    } else {
      await base44.entities.UserCharity.create({
        user_email: user.email,
        charity_id: selected,
        charity_name: charityObj?.name || "",
        contribution_percentage: pct,
      });
    }

    await base44.auth.updateMe({ selected_charity_id: selected, charity_contribution_pct: pct });
    setUser(prev => ({ ...prev, selected_charity_id: selected, charity_contribution_pct: pct }));
    setCurrentCharity(charityObj);
    toast({ title: "Charity preferences saved!" });
    setSaving(false);
  };

  return (
    <div className={`bg-card border border-border/50 rounded-2xl ${compact ? "p-5" : "p-6"}`}>
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">My Charity</h3>
      </div>

      {currentCharity && (
        <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl mb-4">
          {currentCharity.image_url ? (
            <img src={currentCharity.image_url} alt={currentCharity.name} className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary" />
            </div>
          )}
          <div>
            <div className="font-medium text-sm">{currentCharity.name}</div>
            <div className="text-xs text-muted-foreground">{pct}% contribution</div>
          </div>
          <Check className="w-4 h-4 text-primary ml-auto" />
        </div>
      )}

      <div className="mb-4">
        <label className="text-sm font-medium mb-2 block">Change Charity</label>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
        >
          <option value="">Select a charity...</option>
          {charities.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="text-sm font-medium mb-2 block">
          Contribution: <span className="text-primary font-bold">{pct}%</span>
          <span className="text-muted-foreground font-normal ml-1">(min 10%)</span>
        </label>
        <input
          type="range"
          min={10}
          max={100}
          value={pct}
          onChange={(e) => setPct(Number(e.target.value))}
          className="w-full accent-primary"
        />
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full rounded-full">
        {saving ? "Saving..." : "Save Charity Preferences"}
      </Button>
    </div>
  );
}