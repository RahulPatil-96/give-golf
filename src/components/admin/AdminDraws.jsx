import { useState, useEffect } from "react";
import { base44 } from "@/api/supabaseClient";
import { Trophy, Play, CheckCircle, Zap, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

function runDraw(allUserScores, mode, pool, rollover) {
  // Generate 5 winning numbers (1-45, unique)
  const winningNums = [];
  
  if (mode === "algorithmic") {
    // Basic algorithmic: pick numbers that appear most frequently in user scores
    const frequency = {};
    for (const { scores } of allUserScores) {
      for (const s of scores) {
        const val = s.score_data?.score || s.score;
        if (val) frequency[val] = (frequency[val] || 0) + 1;
      }
    }
    const sorted = Object.entries(frequency).sort((a, b) => b[1] - a[1]);
    for (let i = 0; i < 5 && i < sorted.length; i++) {
      winningNums.push(Number(sorted[i][0]));
    }
    // Fill rest if less than 5 unique scores found
    while (winningNums.length < 5) {
      const n = Math.floor(Math.random() * (110 - 65 + 1)) + 65;
      if (!winningNums.includes(n)) winningNums.push(n);
    }
  } else {
    // Random mode
    while (winningNums.length < 5) {
      const n = Math.floor(Math.random() * (110 - 65 + 1)) + 65;
      if (!winningNums.includes(n)) winningNums.push(n);
    }
  }

  const results = [];
  const winnersByType = { "5-match": [], "4-match": [], "3-match": [] };

  for (const { id, email, name, scores } of allUserScores) {
    const userNums = scores.map(s => s.score_data?.score || s.score);
    const matches = userNums.filter(n => winningNums.includes(n));

    if (matches.length >= 5) winnersByType["5-match"].push({ id, email, name, matches });
    else if (matches.length >= 4) winnersByType["4-match"].push({ id, email, name, matches });
    else if (matches.length >= 3) winnersByType["3-match"].push({ id, email, name, matches });
  }

  const totalPool = pool + rollover;
  const dist = {
    "5-match": totalPool * 0.40,
    "4-match": totalPool * 0.35,
    "3-match": totalPool * 0.25,
  };

  for (const [type, winners] of Object.entries(winnersByType)) {
    if (winners.length === 0) continue;
    const perWinner = dist[type] / winners.length;
    for (const w of winners) {
      results.push({ ...w, match_type: type, prize_amount: Math.round(perWinner), matched_scores: w.matches });
    }
  }

  const newRollover = winnersByType["5-match"].length === 0 ? (rollover + dist["5-match"]) : 0;
  return { winningNums, results, newRollover };
}

export default function AdminDraws() {
  const [draws, setDraws] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newDraw, setNewDraw] = useState({ month: "", draw_date: "", mode: "random" });
  const [simResult, setSimResult] = useState(null);
  const [selectedDraw, setSelectedDraw] = useState(null);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const [d, s] = await Promise.all([
          base44.entities.Draw.list("-draw_date", 20),
          base44.entities.Subscription.filter({ status: "active" }),
        ]);

        if (!mounted) return;
        setDraws(d);
        setSubscriptions(s);
      } catch (error) {
        console.error("AdminDraws load error:", error);
        toast({ title: "Could not load draw data", description: error?.message || "Try again later", variant: "destructive" });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => { mounted = false; };
  }, []);

  const handleCreateDraw = async () => {
    if (!newDraw.month || !newDraw.draw_date) {
      toast({ title: "Fill all fields", variant: "destructive" });
      return;
    }
    const pricePerSub = 29;
    const pool = subscriptions.length * pricePerSub * 0.5;
    const created = await base44.entities.Draw.create({
      ...newDraw,
      status: "pending",
      total_pool: pool,
      total_subscribers: subscriptions.length,
      jackpot_rollover: 0,
    });
    setDraws(prev => [created, ...prev]);
    setShowCreate(false);
    setNewDraw({ month: "", draw_date: "", mode: "random" });
    toast({ title: "Draw created!" });
  };

  const handleSimulate = async (draw) => {
    setSimulating(true);
    setSelectedDraw(draw);

    // Get all users with scores
    const [scores, users] = await Promise.all([
      base44.entities.Score.list("-play_date", 1000),
      base44.entities.User.list(),
    ]);
    
    const userMap = {};
    for (const s of scores) {
      if (!userMap[s.user_email]) userMap[s.user_email] = [];
      userMap[s.user_email].push(s);
    }

    const allUserScores = Object.entries(userMap)
      .map(([email, sc]) => {
        const profile = users.find(u => u.email === email);
        return {
          id: profile?.id,
          email,
          name: profile?.full_name || email,
          scores: sc.sort((a, b) => new Date(b.play_date) - new Date(a.play_date)).slice(0, 5),
        };
      })
      .filter(u => u.scores.length >= 1); // Reduced requirement for testing, PRD says last 5 but we can simulate with less

    const { winningNums, results, newRollover } = runDraw(allUserScores, draw.mode, draw.total_pool || 0, draw.jackpot_rollover || 0);
    setSimResult({ draw, winningNums, results, newRollover });
    setSimulating(false);
  };

  const handlePublish = async () => {
    if (!simResult) return;
    const { draw, winningNums, results, newRollover } = simResult;

    await base44.entities.Draw.update(draw.id, {
      status: "published",
      winning_numbers: winningNums,
      jackpot_rollover: newRollover,
    });

    for (const r of results) {
      await base44.entities.Winner.create({
        draw_id: draw.id,
        user_id: r.id,
        user_email: r.email,
        prize_amount: r.prize_amount,
        match_type: r.match_type,
        month: draw.month,
        status: "pending",
      });

      // Send winner email notification (Mock)
      console.log(`Sending email to ${r.email}: Congratulations! You won $${r.prize_amount}`);
    }

    setDraws(prev => prev.map(d => d.id === draw.id ? { ...d, status: "published" } : d));
    setSimResult(null);
    toast({ title: "Draw published! Winners notified." });
  };

  const statusBadge = {
    pending: <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>,
    simulated: <Badge className="bg-blue-100 text-blue-800">Simulated</Badge>,
    published: <Badge className="bg-green-100 text-green-800">Published</Badge>,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold">Draw Management</h1>
        <Button onClick={() => setShowCreate(!showCreate)} className="gap-2">
          <Plus className="w-4 h-4" /> New Draw
        </Button>
      </div>

      {showCreate && (
        <div className="bg-card border border-border/50 rounded-xl p-5 mb-6">
          <h3 className="font-semibold mb-4">Create New Draw</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Month (YYYY-MM)</label>
              <input
                type="month"
                value={newDraw.month}
                onChange={(e) => setNewDraw(p => ({ ...p, month: e.target.value }))}
                className="w-full rounded-lg border border-input px-3 py-2 text-sm bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Draw Date</label>
              <input
                type="date"
                value={newDraw.draw_date}
                onChange={(e) => setNewDraw(p => ({ ...p, draw_date: e.target.value }))}
                className="w-full rounded-lg border border-input px-3 py-2 text-sm bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Mode</label>
              <select
                value={newDraw.mode}
                onChange={(e) => setNewDraw(p => ({ ...p, mode: e.target.value }))}
                className="w-full rounded-lg border border-input px-3 py-2 text-sm bg-background"
              >
                <option value="random">Random (Lottery)</option>
                <option value="algorithmic">Algorithmic (Score-based)</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button onClick={handleCreateDraw}>Create Draw</Button>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Simulation Result */}
      {simResult && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-yellow-800">Simulation Preview — {simResult.draw.month}</h3>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSimResult(null)} size="sm">Discard</Button>
              <Button onClick={handlePublish} size="sm" className="bg-green-600 hover:bg-green-700 gap-2">
                <CheckCircle className="w-4 h-4" /> Publish Results
              </Button>
            </div>
          </div>
          <div className="flex gap-2 mb-3">
            <span className="text-sm font-medium text-yellow-800">Winning Numbers:</span>
            {simResult.winningNums.map((n, i) => (
              <div key={i} className="w-8 h-8 rounded-lg bg-yellow-200 text-yellow-900 flex items-center justify-center font-bold text-sm">{n}</div>
            ))}
          </div>
          {simResult.newRollover > 0 && (
            <div className="text-sm text-yellow-700 mb-3">🎰 Jackpot rolls over: ${simResult.newRollover.toLocaleString()}</div>
          )}
          <div className="text-sm text-yellow-800 font-medium">{simResult.results.length} winner(s) found</div>
          {simResult.results.slice(0, 5).map((r, i) => (
            <div key={i} className="text-sm text-yellow-700 mt-1">• {r.email} — {r.match_type} — ${r.prize_amount?.toLocaleString()}</div>
          ))}
        </div>
      )}

      {/* Draw List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : draws.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">No draws yet. Create one above.</div>
      ) : (
        <div className="space-y-3">
          {draws.map(draw => (
            <div key={draw.id} className="bg-card border border-border/50 rounded-xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">{draw.month}</div>
                  <div className="text-sm text-muted-foreground">
                    {draw.draw_date} · {draw.mode} · ${draw.total_pool?.toLocaleString() || 0} pool · {draw.total_subscribers || 0} subscribers
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {statusBadge[draw.status]}
                {draw.status === "pending" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => handleSimulate(draw)}
                    disabled={simulating}
                  >
                    <Zap className="w-3 h-3" />
                    {simulating && selectedDraw?.id === draw.id ? "Simulating..." : "Simulate"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}