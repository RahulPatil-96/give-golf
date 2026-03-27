import { useState, useEffect } from "react";
import { base44 } from "@/api/supabaseClient";
import { Search, ChevronDown, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export default function AdminWinners() {
  const [users, setUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    Promise.all([
      base44.entities.User.list(),
      base44.entities.Subscription.list(),
    ]).then(([us, subs]) => {
      setUsers(us);
      const subMap = {};
      subs.forEach(s => { subMap[s.user_email] = s; });
      setSubscriptions(subMap);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchData();
      } catch (error) {
        console.error("AdminWinners loadData failed:", error);
        toast({ title: "Failed to load users", description: error?.message || "Please check your Supabase configuration.", variant: "destructive" });
      }
    };

    loadData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    await base44.entities.User.update(userId, { role: newRole });
    toast({ title: "Role updated." });
    fetchData();
  };

  const handleSubStatus = async (subId, newStatus) => {
    await base44.entities.Subscription.update(subId, { status: newStatus });
    toast({ title: "Subscription updated." });
    fetchData();
  };

  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold mb-1">Users</h1>
          <p className="text-muted-foreground">{users.length} registered users</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="pl-9 rounded-full" />
        </div>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="text-left p-4 font-medium text-muted-foreground">User</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Role</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Subscription</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => {
                const sub = subscriptions[user.email];
                return (
                  <tr key={user.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <div className="font-medium">{user.full_name || "—"}</div>
                      <div className="text-muted-foreground text-xs flex items-center gap-1">
                        <Mail className="w-3 h-3" />{user.email}
                      </div>
                    </td>
                    <td className="p-4">
                      <select
                        value={user.role || "user"}
                        onChange={e => handleRoleChange(user.id, e.target.value)}
                        className="text-xs border rounded-lg px-2 py-1 bg-background"
                      >
                        <option value="user">User</option>
                        <option value="subscriber">Subscriber</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="p-4">
                      {sub ? (
                        <div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            sub.status === "active" ? "bg-green-100 text-green-700" :
                            sub.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                          }`}>{sub.status}</span>
                          <div className="text-xs text-muted-foreground mt-0.5">{sub.plan}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No subscription</span>
                      )}
                    </td>
                    <td className="p-4">
                      {sub && sub.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs rounded-full h-7"
                          onClick={() => handleSubStatus(sub.id, "cancelled")}
                        >
                          Cancel Sub
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No users found.</div>
          )}
        </div>
      </div>
    </div>
  );
}