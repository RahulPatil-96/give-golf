import { useState, useEffect } from "react";
import { base44 } from "@/api/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, Play, CheckCircle, RefreshCw, Plus, Calendar, Users as UsersIcon, DollarSign, Eye, Send } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
      toast({ title: "Failed to load draws", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDraws(); }, []);

  const handleCreate = async () => {
    if (!newDraw.month || !newDraw.draw_date) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      await base44.entities.Draw.create({ ...newDraw, status: "pending" });
      toast({ title: "Monthly draw created successfully." });
      setShowCreate(false);
      fetchDraws();
    } catch (error) {
      toast({ title: "Failed to create draw", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleSimulate = async (draw) => {
    setSimRunning(draw.id);
    try {
      const subs = await base44.entities.Subscription.filter({ status: "active" });
      const subscriberData = await Promise.all(subs.map(async sub => {
        const scores = await base44.entities.Score.filter({ user_email: sub.user_email }, "-play_date", 5);
        return { user_email: sub.user_email, user_name: sub.user_email.split("@")[0], scores };
      }));

      const { winning, results, totalPool, hasJackpot } = runDraw(subscriberData, draw.mode, draw.jackpot_rollover || 0);

      await base44.entities.Draw.update(draw.id, {
        status: "simulated",
        winning_numbers: winning,
        total_pool: totalPool,
        total_subscribers: subs.length,
      });

      const oldResults = await base44.entities.DrawResult.filter({ draw_id: draw.id });
      await Promise.all(oldResults.map(r => base44.entities.DrawResult.delete(r.id)));

      await Promise.all(results.map(r =>
        base44.entities.DrawResult.create({ ...r, draw_id: draw.id, month: draw.month })
      ));

      toast({ 
        title: `Simulation complete: ${results.length} winners`, 
        description: hasJackpot ? "JACKPOT: 5-match winners found!" : "No jackpot winner this month." 
      });
      fetchDraws();
    } catch (error) {
      toast({ title: "Simulation failed", variant: "destructive" });
    } finally {
      setSimRunning(null);
    }
  };

  const handlePublish = async (draw) => {
    setPublishing(draw.id);
    try {
      const results = await base44.entities.DrawResult.filter({ draw_id: draw.id });

      for (const result of results) {
        const existing = await base44.entities.Winner.filter({ draw_id: draw.id, user_email: result.user_email });
        if (!existing.length) {
          await base44.entities.Winner.create({
            draw_id: draw.id,
            user_email: result.user_email,
            user_name: result.user_name,
            match_type: result.match_type,
            prize_amount: result.prize_amount,
            month: draw.month,
            status: "pending",
          });
        }
      }

      const fiveMatch = results.filter(r => r.match_type === "5-match");
      if (!fiveMatch.length) {
        await base44.entities.Draw.update(draw.id, {
          status: "published",
          jackpot_rollover: (draw.jackpot_rollover || 0) + Math.floor(draw.total_pool * 0.40),
        });
      } else {
        await base44.entities.Draw.update(draw.id, { status: "published" });
      }

      toast({ title: "Draw published and winners notified!" });
      fetchDraws();
    } catch (error) {
      toast({ title: "Failed to publish draw", variant: "destructive" });
    } finally {
      setPublishing(null);
    }
  };

  if (loading) return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>
      <div className="grid gap-6">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-3xl" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold mb-1 text-[#0a1e16]">Draw Management</h1>
          <p className="text-muted-foreground">Configure, simulate, and verify monthly prize draws.</p>
        </div>
        
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-full px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" /> New Monthly Draw
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">Create New Draw</DialogTitle>
              <DialogDescription>Set up the parameters for a new monthly prize draw.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0a1e16] uppercase tracking-wider text-[10px]">Reference Month</label>
                <Input type="month" value={newDraw.month} onChange={e => setNewDraw(p => ({ ...p, month: e.target.value }))} className="rounded-xl border-muted focus-visible:ring-primary/20" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0a1e16] uppercase tracking-wider text-[10px]">Scheduled Draw Date</label>
                <Input type="date" value={newDraw.draw_date} onChange={e => setNewDraw(p => ({ ...p, draw_date: e.target.value }))} className="rounded-xl border-muted focus-visible:ring-primary/20" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0a1e16] uppercase tracking-wider text-[10px]">Generation Mode</label>
                <select 
                  value={newDraw.mode} 
                  onChange={e => setNewDraw(p => ({ ...p, mode: e.target.value }))} 
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="random">Random (Pure Lottery)</option>
                  <option value="algorithmic">Algorithmic (Score-weighted)</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={handleCreate} disabled={creating} className="rounded-xl px-8">
                {creating ? "Creating..." : "Confirm & Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        <AnimatePresence mode="popLayout">
          {draws.map((draw, i) => (
            <motion.div
              key={draw.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 rounded-3xl overflow-hidden bg-white">
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row">
                    {/* Left Info Panel */}
                    <div className="p-6 lg:w-1/3 bg-muted/20 border-r border-muted/30">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                          <Trophy className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-xl font-bold text-[#0a1e16]">{draw.month}</div>
                          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-primary/20 text-primary bg-primary/5">
                            {draw.mode}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-muted-foreground">Date:</span>
                          <span className="text-[#0a1e16] font-semibold">{draw.draw_date}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <UsersIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-muted-foreground">Participants:</span>
                          <span className="text-[#0a1e16] font-semibold">{draw.total_subscribers}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-muted-foreground">Pool:</span>
                          <span className="text-emerald-600 font-bold">${draw.total_pool?.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Progress/Action Panel */}
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          {/* Stepper visualization */}
                          <div className="flex items-center gap-2">
                             <div className={cn("w-2.5 h-2.5 rounded-full", draw.status === "pending" ? "bg-amber-400 animate-pulse" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]")} />
                             <div className={cn("h-0.5 w-8 rounded-full", draw.status === "pending" ? "bg-muted" : "bg-emerald-500")} />
                             <div className={cn("w-2.5 h-2.5 rounded-full", draw.status === "pending" ? "bg-muted" : draw.status === "simulated" ? "bg-amber-400 animate-pulse" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]")} />
                             <div className={cn("h-0.5 w-8 rounded-full", draw.status === "published" ? "bg-emerald-500" : "bg-muted")} />
                             <div className={cn("w-2.5 h-2.5 rounded-full", draw.status === "published" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-muted")} />
                          </div>
                          <Badge className={cn(
                            "rounded-full px-4 py-1 font-bold uppercase tracking-widest text-[10px] shadow-none border-none",
                            draw.status === "pending" ? "bg-amber-100 text-amber-700 hover:bg-amber-100" :
                            draw.status === "simulated" ? "bg-blue-100 text-blue-700 hover:bg-blue-100" :
                            "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                          )}>
                            {draw.status}
                          </Badge>
                        </div>

                        {draw.winning_numbers?.length > 0 && (
                          <div className="mb-6">
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Generated Winning Numbers</div>
                            <div className="flex flex-wrap gap-3">
                              {draw.winning_numbers.map((n, i) => (
                                <motion.div 
                                  key={i}
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: i * 0.1 }}
                                  className="w-12 h-12 rounded-2xl bg-[#0a1e16] text-white flex items-center justify-center font-bold text-lg shadow-lg"
                                >
                                  {n}
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3 mt-4">
                        {draw.status !== "published" && (
                          <Button
                            onClick={() => handleSimulate(draw)}
                            disabled={simRunning === draw.id}
                            variant={draw.status === "pending" ? "default" : "outline"}
                            className="flex-1 rounded-2xl h-12 gap-2 font-bold transition-transform active:scale-95"
                          >
                            {simRunning === draw.id ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                            {draw.status === "pending" ? "Run Simulation" : "Re-simulate"}
                          </Button>
                        )}
                        {draw.status === "simulated" && (
                          <Button 
                            onClick={() => handlePublish(draw)}
                            disabled={publishing === draw.id}
                            className="flex-1 rounded-2xl h-12 gap-2 font-bold bg-emerald-600 hover:bg-emerald-700 transition-transform active:scale-95 shadow-lg shadow-emerald-200"
                          >
                            <Send className="w-5 h-5" />
                            {publishing === draw.id ? "Publishing..." : "Finalize & Publish"}
                          </Button>
                        )}
                        {draw.status === "published" && (
                          <Button variant="outline" className="flex-1 rounded-2xl h-12 gap-2 font-bold opacity-70 cursor-default">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                            Draw Published
                          </Button>
                        )}
                        {draw.status !== "pending" && (
                           <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-primary/5 text-primary">
                             <Eye className="w-5 h-5" />
                           </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {draws.length === 0 && (
          <div className="py-24 text-center flex flex-col items-center gap-4 bg-muted/20 rounded-[40px] border-2 border-dashed border-muted">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
               <Trophy className="w-10 h-10 text-muted-foreground opacity-30" />
            </div>
            <div>
               <p className="text-xl font-serif font-bold text-[#0a1e16]">No draws found</p>
               <p className="text-muted-foreground">Start by creating your first monthly draw.</p>
            </div>
            <Button onClick={() => setShowCreate(true)} variant="outline" className="rounded-full px-8">Create First Draw</Button>
          </div>
        )}
      </div>
    </div>
  );
}