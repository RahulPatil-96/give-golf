import { useState } from "react";
import { base44 } from "@/api/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Plus, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

export default function ScorePanel({ scores, setScores, user, subscription, compact }) {
  const [newScore, setNewScore] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const canAdd = subscription?.status === "active";

  const handleAdd = async () => {
    const val = Number(newScore);
    if (!val || val < 1 || val > 45) {
      toast({ title: "Score must be between 1 and 45", variant: "destructive" });
      return;
    }
    if (!newDate) {
      toast({ title: "Please enter a date", variant: "destructive" });
      return;
    }
    setAdding(true);

    // Rolling 5-score logic: if already 5, delete oldest
    let oldestId = null;
    if (scores.length >= 5) {
      const sorted = [...scores].sort((a, b) => new Date(a.play_date) - new Date(b.play_date));
      oldestId = sorted[0].id;
      await base44.entities.Score.delete(oldestId);
    }

    const created = await base44.entities.Score.create({
      user_email: user.email,
      user_id: user.id,
      score_data: { score: val },
      play_date: newDate,
    });

    const updated = [
      ...scores.filter(s => s.id !== oldestId),
      created
    ]
      .sort((a, b) => new Date(b.play_date) - new Date(a.play_date))
      .slice(0, 5);

    setScores(updated);
    setNewScore("");
    setNewDate(new Date().toISOString().split("T")[0]);
    setShowForm(false);
    toast({ title: "Score added!" });
    setAdding(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.Score.delete(id);
    setScores(scores.filter(s => s.id !== id));
    toast({ title: "Score removed" });
  };

  return (
    <div className={`bg-card border border-border/50 rounded-2xl ${compact ? "p-5" : "p-6"}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">My Golf Scores</h3>
        </div>
        {canAdd && (
          <Button size="sm" variant="outline" className="gap-1 rounded-full" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-3 h-3" /> Add Score
          </Button>
        )}
      </div>

      {!canAdd && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Subscribe to enter scores and join monthly draws.
        </div>
      )}

      {/* Score count indicator */}
      <div className="flex gap-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full transition-all ${i < scores.length ? "bg-primary" : "bg-border"}`}
          />
        ))}
      </div>
      <div className="text-xs text-muted-foreground mb-4">
        {scores.length}/5 scores entered {scores.length === 5 ? "— You're fully entered!" : "— Add more to improve your draw entry"}
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 mb-4">
              <Input
                type="number"
                min={1}
                max={45}
                placeholder="Score (1-45)"
                value={newScore}
                onChange={(e) => setNewScore(e.target.value)}
                className="flex-1"
              />
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAdd} disabled={adding} className="bg-primary">
                {adding ? "..." : "Add"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scores list */}
      {scores.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          No scores yet. Add your first golf score to enter the draw!
        </div>
      ) : (
        <div className="space-y-2">
          {[...scores].sort((a, b) => new Date(b.play_date) - new Date(a.play_date)).map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between p-3 bg-muted/40 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  {s.score_data?.score || s.score}
                </div>
                <div>
                  <div className="text-sm font-medium">Score: {s.score_data?.score || s.score}</div>
                  <div className="text-xs text-muted-foreground">{s.play_date}</div>
                </div>
              </div>
              {canAdd && (
                <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}