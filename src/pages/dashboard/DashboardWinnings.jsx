import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/supabaseClient";
import { motion } from "framer-motion";
import { Trophy, Upload, CheckCircle, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

const statusConfig = {
  pending: { icon: Clock, color: "bg-yellow-100 text-yellow-700", label: "Pending" },
  approved: { icon: CheckCircle, color: "bg-green-100 text-green-700", label: "Approved" },
  rejected: { icon: XCircle, color: "bg-red-100 text-red-700", label: "Rejected" },
};

const paymentConfig = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
};

export default function DashboardWinnings() {
  const { user } = useOutletContext();
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null);

  const fetchWinners = () => {
    if (!user) return;
    base44.entities.Winner.filter({ user_email: user.email }, "-created_date")
      .then(setWinners)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchWinners(); }, [user]);

  const handleUploadProof = async (winnerId, file) => {
    if (!file) return;
    setUploading(winnerId);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Winner.update(winnerId, { proof_image_url: file_url });
    toast({ title: "Proof uploaded!", description: "An admin will review shortly." });
    setUploading(null);
    fetchWinners();
  };

  const totalWon = winners.reduce((sum, w) => sum + (w.prize_amount || 0), 0);
  const paidOut = winners.filter(w => w.payment_status === "paid").reduce((sum, w) => sum + (w.prize_amount || 0), 0);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-3xl pb-20 lg:pb-0">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold mb-1">My Winnings</h1>
        <p className="text-muted-foreground">Track your prizes and payment status.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <Trophy className="w-5 h-5 text-secondary mb-2" />
          <div className="font-serif text-2xl font-bold">${totalWon.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Total Won</div>
        </div>
        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <CheckCircle className="w-5 h-5 text-primary mb-2" />
          <div className="font-serif text-2xl font-bold">${paidOut.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Paid Out</div>
        </div>
      </div>

      {/* Winnings List */}
      {winners.length === 0 ? (
        <div className="bg-card border border-border/50 rounded-2xl p-12 text-center">
          <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No winnings yet. Keep playing — your turn is coming!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {winners.map((winner, i) => {
            const verif = statusConfig[winner.verification_status] || statusConfig.pending;
            return (
              <motion.div
                key={winner.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border/50 rounded-2xl p-5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="font-semibold text-lg">{winner.match_type}</div>
                    <div className="text-sm text-muted-foreground">{winner.month}</div>
                  </div>
                  <div className="font-serif text-2xl font-bold text-primary">${winner.prize_amount?.toLocaleString()}</div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${verif.color}`}>
                    Verification: {verif.label}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${paymentConfig[winner.payment_status]}`}>
                    Payment: {winner.payment_status}
                  </span>
                </div>

                {winner.verification_status === "pending" && !winner.proof_image_url && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Upload proof to claim your prize:</p>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 rounded-full"
                        disabled={uploading === winner.id}
                        onClick={() => document.getElementById(`proof-${winner.id}`).click()}
                      >
                        <Upload className="w-4 h-4" />
                        {uploading === winner.id ? "Uploading..." : "Upload Proof"}
                      </Button>
                      <input
                        id={`proof-${winner.id}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleUploadProof(winner.id, e.target.files[0])}
                      />
                    </label>
                  </div>
                )}

                {winner.proof_image_url && (
                  <div className="mt-2">
                    <div className="text-xs text-muted-foreground mb-1">Proof uploaded ✓</div>
                    <img src={winner.proof_image_url} alt="proof" className="w-20 h-20 rounded-lg object-cover border border-border" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}