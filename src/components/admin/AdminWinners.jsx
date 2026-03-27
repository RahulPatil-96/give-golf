import { useState, useEffect } from "react";
import { base44 } from "@/api/supabaseClient";
import { Trophy, CheckCircle, XCircle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

export default function AdminWinners() {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    base44.entities.Winner.list("-created_at", 100).then(setWinners).finally(() => setLoading(false));
  }, []);

  const handleApprove = async (winner) => {
    await base44.entities.Winner.update(winner.id, { status: "verified" });
    setWinners(prev => prev.map(w => w.id === winner.id ? { ...w, status: "verified" } : w));
    await base44.integrations.Core.SendEmail({
      to: winner.user_email,
      subject: "✅ Win Verification Approved — GiveGolf",
      body: `Your win of $${winner.prize_amount} has been verified! Your payment is being processed.`,
    }).catch(() => {});
    toast({ title: "Winner approved!" });
  };

  const handleReject = async (winner) => {
    // For now, let's just delete the winner or reset proof if rejected
    // Or we could update the schema. I'll stick to resetting proof for now
    await base44.entities.Winner.update(winner.id, { proof_image_url: null, status: "pending" });
    setWinners(prev => prev.map(w => w.id === winner.id ? { ...w, proof_image_url: null, status: "pending" } : w));
    await base44.integrations.Core.SendEmail({
      to: winner.user_email,
      subject: "❌ Win Verification — Action Required",
      body: `Your proof for the ${winner.month} draw was rejected. Please upload a clear screenshot of your scores.`,
    }).catch(() => {});
    toast({ title: "Winner rejected — proof requested again" });
  };

  const handleMarkPaid = async (winner) => {
    await base44.entities.Winner.update(winner.id, { status: "paid" });
    setWinners(prev => prev.map(w => w.id === winner.id ? { ...w, status: "paid" } : w));
    await base44.integrations.Core.SendEmail({
      to: winner.user_email,
      subject: "💰 Payment Sent — GiveGolf",
      body: `Your prize of $${winner.prize_amount} has been paid. Thank you!`,
    }).catch(() => {});
    toast({ title: "Marked as paid!" });
  };

  const filtered = winners.filter(w => {
    if (filter === "pending_proof") return !w.proof_image_url && w.status === "pending";
    if (filter === "pending_approval") return w.proof_image_url && w.status === "pending";
    if (filter === "approved") return w.status === "verified";
    if (filter === "paid") return w.status === "paid";
    return true;
  });

  const sBadge = {
    pending: <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>,
    verified: <Badge className="bg-blue-100 text-blue-800">Verified</Badge>,
    paid: <Badge className="bg-green-100 text-green-800">Paid</Badge>,
  };

  const filters = [
    { id: "all", label: "All" },
    { id: "pending_proof", label: "Awaiting Proof" },
    { id: "pending_approval", label: "Review Proof" },
    { id: "approved", label: "Awaiting Payment" },
    { id: "paid", label: "Paid" },
  ];

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold mb-6">Winner Management</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {filters.map(f => (
          <Button
            key={f.id}
            size="sm"
            variant={filter === f.id ? "default" : "outline"}
            className="rounded-full whitespace-nowrap"
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">No winners in this category.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(w => (
            <div key={w.id} className="bg-card border border-border/50 rounded-xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-4 h-4 text-secondary" />
                    <span className="font-semibold">{w.match_type}</span>
                    <span className="text-muted-foreground text-sm">· {w.month}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">{w.user_email}</div>
                  <div className="font-serif text-xl font-bold text-primary mt-1">${w.prize_amount?.toLocaleString()}</div>
                  <div className="flex gap-2 mt-2">
                    {sBadge[w.status]}
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-start sm:items-end">
                  {w.proof_image_url && (
                    <a href={w.proof_image_url} target="_blank" rel="noopener noreferrer">
                      <img src={w.proof_image_url} alt="Proof" className="w-20 h-14 object-cover rounded-lg border" />
                    </a>
                  )}
                  {!w.proof_image_url && (
                    <div className="text-xs text-muted-foreground italic">No proof uploaded yet</div>
                  )}
                  {w.proof_image_url && w.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleApprove(w)} className="gap-1 bg-green-600 hover:bg-green-700">
                        <CheckCircle className="w-3 h-3" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleReject(w)} className="gap-1">
                        <XCircle className="w-3 h-3" /> Reject
                      </Button>
                    </div>
                  )}
                  {w.status === "verified" && (
                    <Button size="sm" onClick={() => handleMarkPaid(w)} className="gap-1 bg-primary">
                      <DollarSign className="w-3 h-3" /> Mark as Paid
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}