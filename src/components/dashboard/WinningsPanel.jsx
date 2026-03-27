import { useState, useEffect } from "react";
import { base44 } from "@/api/supabaseClient";
import { motion } from "framer-motion";
import { Trophy, Upload, CheckCircle, Clock, XCircle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

export default function WinningsPanel({ user }) {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);

  useEffect(() => {
    if (!user) return;
    base44.entities.Winner.filter({ user_email: user.email }, "-created_at", 20)
      .then(setWinners)
      .finally(() => setLoading(false));
  }, [user]);

  const handleUploadProof = async (winnerId, file) => {
    setUploadingId(winnerId);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Winner.update(winnerId, { proof_image_url: file_url });
    setWinners(prev => prev.map(w => w.id === winnerId ? { ...w, proof_image_url: file_url } : w));
    toast({ title: "Proof uploaded! Awaiting admin review." });
    setUploadingId(null);
  };

  const statusBadge = {
    pending: <Badge className="bg-yellow-100 text-yellow-800">Pending Proof</Badge>,
    verified: <Badge className="bg-blue-100 text-blue-800">Approved</Badge>,
    paid: <Badge className="bg-green-100 text-green-800">Paid</Badge>,
  };

  const totalWon = winners.filter(w => w.status === "verified" || w.status === "paid").reduce((sum, w) => sum + (w.prize_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <Trophy className="w-5 h-5 text-primary mb-2" />
          <div className="font-serif text-2xl font-bold">{winners.length}</div>
          <div className="text-xs text-muted-foreground">Total Wins</div>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <DollarSign className="w-5 h-5 text-green-600 mb-2" />
          <div className="font-serif text-2xl font-bold">${totalWon.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Total Approved</div>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <Clock className="w-5 h-5 text-orange-500 mb-2" />
          <div className="font-serif text-2xl font-bold">
            {winners.filter(w => w.status === "verified").length}
          </div>
          <div className="text-xs text-muted-foreground">Awaiting Payment</div>
        </div>
      </div>

      {/* Winnings List */}
      <div className="bg-card border border-border/50 rounded-2xl p-6">
        <h3 className="font-semibold mb-4">Win History</h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : winners.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No wins yet — keep playing!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {winners.map((w, i) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="border border-border/50 rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Trophy className="w-4 h-4 text-secondary" />
                      <span className="font-semibold">{w.match_type}</span>
                      <span className="text-muted-foreground text-sm">— {w.month}</span>
                    </div>
                    <div className="font-serif text-xl font-bold text-primary">${w.prize_amount?.toLocaleString()}</div>
                    <div className="flex gap-2 mt-2">
                      {statusBadge[w.status]}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    {w.status === "pending" && !w.proof_image_url && (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files[0] && handleUploadProof(w.id, e.target.files[0])}
                        />
                        <Button size="sm" variant="outline" className="gap-1 pointer-events-none">
                          <Upload className="w-3 h-3" />
                          {uploadingId === w.id ? "Uploading..." : "Upload Proof"}
                        </Button>
                      </label>
                    )}
                    {w.proof_image_url && (
                      <a href={w.proof_image_url} target="_blank" rel="noopener noreferrer">
                        <img src={w.proof_image_url} alt="Proof" className="w-16 h-12 object-cover rounded-lg" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}