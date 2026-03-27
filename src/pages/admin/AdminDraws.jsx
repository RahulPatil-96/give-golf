import { useState, useEffect } from "react";
import { base44 } from "@/api/supabaseClient";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, Play, CheckCircle, RefreshCw, Plus } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const POOL_PER_SUBSCRIBER_MONTHLY = 29;

function runDraw(subscribers, mode, jackpotRollover = 0) {
  // Generate 5 winning numbers between 1-45
  const winning = [];
  while (winning.length < 5) {
    const n = Math.floor(Math.random() * 45) + 1;
    if (!winning.includes(n)) winning.push(n);
  }

  const totalPool = (subscribers.length * POOL_PER_SUBSCRIBER_MONTHLY) + jackpotRollover;
  const fiveMatchPool = totalPool * 0.40;
  const fourMatchPool = totalPool * 0.35;
  const threeMatchPool = totalPool * 0.25;

  const results = [];

  subscribers.forEach(sub => {
    const scores = sub.scores || [];
    const matched = scores.filter(s => winning.includes(s.score));
    const matchCount = matched.length;

    if (matchCount >= 3) {
      results.push({
        user_email: sub.user_email,
        user_name: sub.user_name,
        matched_scores: matched.map(s => s.score),
        match_type: matchCount >= 5 ? "5-match" : matchCount >= 4 ? "4-match" : "3-match",
      });
    }
  });

  // Calculate prizes
  const five = results.filter(r => r.match_type === "5-match");
  const four = results.filter(r => r.match_type === "4-match");
  const three = results.filter(r => r.match_type === "3-match");

  const hasJackpot = five.length > 0;

  five.forEach(r => { r.prize_amount = five.length ? Math.floor(fiveMatchPool / five.length) : 0; });
  four.forEach(r => { r.prize_amount = four.length ? Math.floor(fourMatchPool / four.length) : 0; });
  three.forEach(r => { r.prize_amount = three.length ? Math.floor(threeMatchPool / three.length) : 0; });

  return { winning, results: [...five, ...four, ...three], totalPool, hasJackpot };
}

export default function AdminDraws() {
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [simRunning, setSimRunning] = useState(null);
  const [publishing, setPublishing] = useState(null);
  const [newDraw, setNewDraw] = useState({ month: new Date().toISOString().slice(0, 7), draw_date: "", mode: "random" });
  const [showCreate, setShowCreate] = useState(false);

  const fetchDraws = async () => {
    setLoading(true);
    try {
      const drawsData = await base44.entities.Draw.list("-draw_date", 20);
      setDraws(drawsData);
    } catch (error) {
      console.error("AdminDraws fetchDraws failed:", error);
      toast({ title: "Failed to load draws", description: error?.message || "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!mounted) return;
      await fetchDraws();
    };
    load();
    return () => { mounted = false; };
  }, []);

  const handleCreate = async () => {
    if (!newDraw.month || !newDraw.draw_date) {
      toast({ title: "Fill in all fields", variant: "destructive" });
      return;
    }
    setCreating(true);
    await base44.entities.Draw.create({ ...newDraw, status: "pending" });
    toast({ title: "Draw created." });
    setShowCreate(false);
    setCreating(false);
    fetchDraws();
  };

  const handleSimulate = async (draw) => {
    setSimRunning(draw.id);
    // Get active subscribers with their scores
    const subs = await base44.entities.Subscription.filter({ status: "active" });
    const subscriberData = await Promise.all(subs.map(async sub => {
      const scores = await base44.entities.Score.filter({ user_email: sub.user_email }, "-play_date", 5);
      return { user_email: sub.user_email, user_name: sub.user_email.split("@")[0], scores };
    }));

    const { winning, results, totalPool, hasJackpot } = runDraw(subscriberData, draw.mode, draw.jackpot_rollover || 0);

    // Save simulation results
    await base44.entities.Draw.update(draw.id, {
      status: "simulated",
      winning_numbers: winning,
      total_pool: totalPool,
      total_subscribers: subs.length,
    });

    // Delete old simulation results for this draw
    const oldResults = await base44.entities.DrawResult.filter({ draw_id: draw.id });
    await Promise.all(oldResults.map(r => base44.entities.DrawResult.delete(r.id)));

    // Create new results
    await Promise.all(results.map(r =>
      base44.entities.DrawResult.create({ ...r, draw_id: draw.id, month: draw.month })
    ));

    toast({ title: `Simulation complete! ${results.length} winners found.`, description: hasJackpot ? "5-match winners found!" : "No jackpot winner — will rollover." });
    setSimRunning(null);
    fetchDraws();
  };

  const handlePublish = async (draw) => {
    setPublishing(draw.id);
    // Get simulation results and create Winner records
    const results = await base44.entities.DrawResult.filter({ draw_id: draw.id });

    for (const result of results) {
      const existing = await base44.entities.Winner.filter({ draw_id: draw.id, user_email: result.user_email });
      if (!existing.length) {
        await base44.entities.Winner.create({
          draw_id: draw.id,
          draw_result_id: result.id,
          user_email: result.user_email,
          user_name: result.user_name,
          match_type: result.match_type,
          prize_amount: result.prize_amount,
          month: draw.month,
          verification_status: "pending",
          payment_status: "pending",
        });
      }
    }

    // Handle jackpot rollover
    const fiveMatch = results.filter(r => r.match_type === "5-match");
    if (!fiveMatch.length) {
      // Add rollover to next draw (stored in the draw itself for now)
      await base44.entities.Draw.update(draw.id, {
        status: "published",
        jackpot_rollover: (draw.jackpot_rollover || 0) + Math.floor(draw.total_pool * 0.40),
      });
    } else {
      await base44.entities.Draw.update(draw.id, { status: "published" });
    }

    // Notify winners via email
    for (const winner of results) {
      await base44.integrations.Core.SendEmail({
        to: winner.user_email,
        subject: "🏆 Congratulations — You Won in the GiveGolf Draw!",
        body: `Hi ${winner.user_name},\n\nCongratulations! You matched ${winner.match_type} in the ${draw.month} GiveGolf draw and won $${winner.prize_amount?.toLocaleString()}!\n\nLog in to your dashboard to upload your proof and claim your prize.\n\nThank you for playing and giving back!\n\nThe GiveGolf Team`,
      }).catch(() => {});
    }

    toast({ title: "Draw published and winners notified!" });
    setPublishing(null);
    fetchDraws();
  };

  const statusBadge = { pending: "bg-gray-100 text-gray-600", simulated: "bg-yellow-100 text-yellow-700", published: "bg-green-100 text-green-700" };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold mb-1">Draw Management</h1>
          <p className="text-muted-foreground">Configure, simulate and publish monthly draws.</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="gap-2 rounded-full">
          <Plus className="w-4 h-4" /> New Draw
        </Button>
      </div>

      {showCreate && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border/50 rounded-2xl p-6 mb-6"
        >
          <h2 className="font-semibold mb-4">Create New Draw</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1">Month</label>
              <Input type="month" value={newDraw.month} onChange={e => setNewDraw(p => ({ ...p, month: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Draw Date</label>
              <Input type="date" value={newDraw.draw_date} onChange={e => setNewDraw(p => ({ ...p, draw_date: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Mode</label>
              <select value={newDraw.mode} onChange={e => setNewDraw(p => ({ ...p, mode: e.target.value }))} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="random">Random (Lottery)</option>
                <option value="algorithmic">Algorithmic (Score-weighted)</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button onClick={handleCreate} disabled={creating}>{creating ? "Creating..." : "Create Draw"}</Button>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </motion.div>
      )}

      <div className="space-y-4">
        {draws.map((draw) => (
          <div key={draw.id} className="bg-card border border-border/50 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-semibold">{draw.month}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[draw.status]}`}>{draw.status}</span>
                  <span className="text-xs text-muted-foreground capitalize">{draw.mode}</span>
                </div>
                <div className="text-sm text-muted-foreground flex gap-4">
                  <span>Date: {draw.draw_date}</span>
                  {draw.total_pool > 0 && <span>Pool: ${draw.total_pool?.toLocaleString()}</span>}
                  {draw.total_subscribers > 0 && <span>Subscribers: {draw.total_subscribers}</span>}
                </div>
                {draw.winning_numbers?.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {draw.winning_numbers.map((n, i) => (
                      <div key={i} className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{n}</div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {draw.status !== "published" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 rounded-full"
                    onClick={() => handleSimulate(draw)}
                    disabled={simRunning === draw.id}
                  >
                    {simRunning === draw.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Simulate
                  </Button>
                )}
                {draw.status === "simulated" && (
                  <Button
                    size="sm"
                    className="gap-2 rounded-full"
                    onClick={() => handlePublish(draw)}
                    disabled={publishing === draw.id}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {publishing === draw.id ? "Publishing..." : "Publish"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
        {draws.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No draws yet. Create your first draw above.</div>
        )}
      </div>
    </div>
  );
}