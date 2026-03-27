import { useState, useEffect } from "react";
import { base44 } from "@/api/supabaseClient";
import { motion } from "framer-motion";
import { Trophy, Calendar, Users, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DrawResults() {
  const [draws, setDraws] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedDraw, setSelectedDraw] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Draw.filter({ status: "published" }, "-draw_date", 12)
      .then(data => {
        setDraws(data);
        if (data.length > 0) setSelectedDraw(data[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedDraw) return;
    base44.entities.Winner.filter({ draw_id: selectedDraw.id })
      .then(setResults);
  }, [selectedDraw]);

  const matchColors = {
    "5-match": "bg-yellow-100 text-yellow-800 border-yellow-300",
    "4-match": "bg-blue-100 text-blue-800 border-blue-300",
    "3-match": "bg-green-100 text-green-800 border-green-300",
  };

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-4">Draw Results</h1>
          <p className="text-muted-foreground">View past monthly draws and winners.</p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : draws.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No draw results yet. The first draw is coming soon!</p>
          </div>
        ) : (
          <>
            {/* Draw Selector */}
            <div className="flex gap-3 overflow-x-auto pb-4 mb-8">
              {draws.map(draw => (
                <button
                  key={draw.id}
                  onClick={() => setSelectedDraw(draw)}
                  className={`flex-shrink-0 px-5 py-3 rounded-xl border-2 transition-all ${
                    selectedDraw?.id === draw.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="text-sm font-medium">{draw.month}</div>
                  <div className="text-xs text-muted-foreground">${draw.total_pool?.toLocaleString() || 0}</div>
                </button>
              ))}
            </div>

            {/* Selected Draw Details */}
            {selectedDraw && (
              <motion.div
                key={selectedDraw.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="bg-card border border-border/50 rounded-2xl p-6 mb-8">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div>
                      <Calendar className="w-4 h-4 text-muted-foreground mb-1" />
                      <div className="font-semibold">{selectedDraw.draw_date}</div>
                      <div className="text-xs text-muted-foreground">Draw Date</div>
                    </div>
                    <div>
                      <DollarSign className="w-4 h-4 text-muted-foreground mb-1" />
                      <div className="font-semibold">${selectedDraw.total_pool?.toLocaleString() || 0}</div>
                      <div className="text-xs text-muted-foreground">Prize Pool</div>
                    </div>
                    <div>
                      <Users className="w-4 h-4 text-muted-foreground mb-1" />
                      <div className="font-semibold">{selectedDraw.total_subscribers || 0}</div>
                      <div className="text-xs text-muted-foreground">Participants</div>
                    </div>
                    <div>
                      <Trophy className="w-4 h-4 text-muted-foreground mb-1" />
                      <div className="font-semibold capitalize">{selectedDraw.mode}</div>
                      <div className="text-xs text-muted-foreground">Draw Mode</div>
                    </div>
                  </div>

                  {/* Winning Numbers */}
                  {selectedDraw.winning_numbers?.length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-3">Winning Numbers</div>
                      <div className="flex gap-3">
                        {selectedDraw.winning_numbers.map((num, i) => (
                          <div key={i} className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                            {num}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Results */}
                <h3 className="font-semibold text-lg mb-4">Winners ({results.length})</h3>
                {results.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No winners for this draw.</p>
                ) : (
                  <div className="space-y-3">
                    {results.map((result, i) => (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between bg-card border border-border/50 rounded-xl p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                            {i + 1}
                          </div>
                          <div>
                            <div className="font-medium">{result.user_name || result.user_email}</div>
                            <div className="text-xs text-muted-foreground">
                              Matched: {result.matched_scores?.join(", ")}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={matchColors[result.match_type]}>{result.match_type}</Badge>
                          <div className="font-semibold">${result.prize_amount?.toLocaleString() || 0}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}