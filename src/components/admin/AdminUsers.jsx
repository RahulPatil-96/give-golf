import { useState, useEffect } from "react";
import { base44 } from "@/api/supabaseClient";
import { Search, User, CreditCard, Target } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userScores, setUserScores] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [u, s] = await Promise.all([
          base44.entities.User.list(),
          base44.entities.Subscription.list(),
        ]);
        setUsers(u);
        setSubscriptions(s);
      } catch (error) {
        console.error("AdminUsers loadData failed:", error);
        toast({ title: "Failed to load admin data", description: error?.message || "Please check your Supabase configuration.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getUserSub = (email) => subscriptions.find(s => s.user_email === email && s.status === "active");

  const handleSelectUser = async (u) => {
    setSelectedUser(u);
    const scores = await base44.entities.Score.filter({ user_email: u.email }, "-play_date", 5);
    setUserScores(scores);
  };

  const handleCancelSub = async (subId) => {
    await base44.entities.Subscription.update(subId, { status: "cancelled" });
    setSubscriptions(prev => prev.map(s => s.id === subId ? { ...s, status: "cancelled" } : s));
    toast({ title: "Subscription cancelled" });
  };

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const subStatus = {
    active: "bg-green-100 text-green-800",
    expired: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold">User Management</h1>
        <div className="text-sm text-muted-foreground">{users.length} total users</div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* User List */}
        <div className="lg:col-span-2">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="pl-10" />
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(u => {
                const sub = getUserSub(u.email);
                return (
                  <button
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedUser?.id === u.id ? "border-primary bg-primary/5" : "border-border/50 bg-card hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {(u.full_name || u.email)?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{u.full_name || "—"}</div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {u.role === "admin" && <Badge className="bg-purple-100 text-purple-800">Admin</Badge>}
                        {sub ? (
                          <Badge className={subStatus[sub.status] || ""}>{sub.status} · {sub.plan}</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-700">No sub</Badge>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* User Detail */}
        {selectedUser && (
          <div className="bg-card border border-border/50 rounded-xl p-5">
            <h3 className="font-semibold mb-4">User Details</h3>
            <div className="space-y-3 mb-4">
              <div>
                <div className="text-xs text-muted-foreground">Name</div>
                <div className="text-sm font-medium">{selectedUser.full_name || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Email</div>
                <div className="text-sm">{selectedUser.email}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Role</div>
                <div className="text-sm capitalize">{selectedUser.role || "user"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Charity %</div>
                <div className="text-sm">{selectedUser.charity_contribution_pct || 10}%</div>
              </div>
            </div>

            {/* Subscription */}
            {(() => {
              const sub = getUserSub(selectedUser.email);
              return sub ? (
                <div className="border border-border/50 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Subscription</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Plan: {sub.plan} · ${sub.amount}</div>
                    <div>Status: {sub.status}</div>
                    <div>Ends: {sub.end_date}</div>
                  </div>
                  {sub.status === "active" && (
                    <Button size="sm" variant="destructive" className="mt-2 w-full" onClick={() => handleCancelSub(sub.id)}>
                      Cancel Subscription
                    </Button>
                  )}
                </div>
              ) : null;
            })()}

            {/* Scores */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Scores ({userScores.length}/5)</span>
              </div>
              {userScores.length === 0 ? (
                <div className="text-xs text-muted-foreground">No scores entered</div>
              ) : (
                <div className="flex gap-2">
                  {userScores.sort((a, b) => new Date(b.play_date) - new Date(a.play_date)).map(s => (
                    <div key={s.id} className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {s.score_data?.score || s.score}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}