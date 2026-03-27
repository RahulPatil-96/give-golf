import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Target, Plus, Trash2, AlertCircle, CheckCircle, Info } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function DashboardScores() {
  const { user } = useOutletContext();
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newScore, setNewScore] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [subscription, setSubscription] = useState(null);

  const fetchScores = () => {
    if (!user) return;
    base44.entities.Score.filter({ user_email: user.email }, "-play_date")
      .then(data => setScores(data.slice(0, 5)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) return;
    fetchScores();
    base44.entities.Subscription.filter({ user_email: user.email, status: "active" }, "-created_date", 1)
      .then(subs => setSubscription(subs[0] || null));
  }, [user]);

  const handleAddScore = async () => {
    const val = parseInt(newScore);
    if (!val || val < 1 || val > 45) {
      toast({ title: "Score must be between 1 and 45", variant: "destructive" });
      return;
    }
    if (!newDate) {
      toast({ title: "Please enter a date", variant: "destructive" });
      return;
    }

    setAdding(true);

    // Get all current scores to enforce rolling 5-score limit
    const allScores = await base44.entities.Score.filter({ user_email: user.email }, "-play_date");

    // If already 5 scores, delete the oldest
    if (allScores.length >= 5) {
      const oldest = allScores[allScores.length - 1];
      await base44.entities.Score.delete(oldest.id);
    }

    await base44.entities.Score.create({
      user_email: user.email,
      score: val,
      play_date: newDate,
    });

    toast({ title: "Score added!", description: `Score of ${val} logged.` });
    setNewScore("");
    setNewDate(new Date().toISOString().split("T")[0]);
    setAdding(false);
    fetchScores();
  };

  const handleDelete = async (id) => {
    await base44.entities.Score.delete(id);
    toast({ title: "Score removed." });
    fetchScores();
  };

  return (
    <div className="max-w-2xl pb-20 lg:pb-0">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold mb-1">My Golf Scores</h1>
        <p className="text-muted-foreground">Your last 5 scores are used in the monthly draw.</p>
      </div>

      {!subscription && (
        <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-700">You need an active subscription to enter the draw. Scores are saved but won't be entered.</p>
        </div>
      )}

      {/* Info Banner */}
      <div className="flex items-start gap-3 bg-accent border border-accent-foreground/10 rounded-xl p-4 mb-6">
        <Info className="w-5 h-5 text-accent-foreground/60 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-accent-foreground/80">
          Enter scores between <strong>1–45</strong>. Only your latest 5 are kept. New scores automatically replace the oldest.
        </p>
      </div>

      {/* Add Score Form */}
      <div className="bg-card border border-border/50 rounded-2xl p-6 mb-6">
        <h2 className="font-semibold mb-4">Add New Score</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            type="number"
            placeholder="Score (1–45)"
            value={newScore}
            onChange={(e) => setNewScore(e.target.value)}
            min={1}
            max={45}
            className="flex-1"
          />
          <Input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleAddScore} disabled={adding} className="gap-2 rounded-xl">
            <Plus className="w-4 h-4" />
            {adding ? "Adding..." : "Add Score"}
          </Button>
        </div>
      </div>

      {/* Scores List */}
      <div className="bg-card border border-border/50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Current Scores ({scores.length}/5)</h2>
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i < scores.length ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
        ) : scores.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No scores yet. Add your first score above!</p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {scores.map((score, i) => (
                <motion.div
                  key={score.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-4 bg-muted/40 rounded-xl group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-xl text-primary">
                      {score.score}
                    </div>
                    <div>
                      <div className="font-medium">Score: {score.score}</div>
                      <div className="text-sm text-muted-foreground">Played: {score.play_date}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(score.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}

        {scores.length === 5 && (
          <div className="flex items-center gap-2 mt-4 text-sm text-primary">
            <CheckCircle className="w-4 h-4" />
            All 5 scores entered — you're in the draw!
          </div>
        )}
      </div>
    </div>
  );
}