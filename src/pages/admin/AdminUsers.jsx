import { useState, useEffect } from "react";
import { base44 } from "@/api/supabaseClient";
import { Search, Mail, MoreHorizontal, User, Shield, Ban, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [us, subs] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.Subscription.list(),
      ]);
      setUsers(us);
      const subMap = {};
      subs.forEach(s => { subMap[s.user_email] = s; });
      setSubscriptions(subMap);
    } catch (error) {
      console.error("AdminUsers fetchData failed:", error);
      toast({ title: "Failed to fetch users", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await base44.entities.User.update(userId, { role: newRole });
      toast({ title: `Role updated to ${newRole}` });
      fetchData();
    } catch (error) {
      toast({ title: "Failed to update role", variant: "destructive" });
    }
  };

  const handleSubStatus = async (subId, newStatus) => {
    try {
      await base44.entities.Subscription.update(subId, { status: newStatus });
      toast({ title: `Subscription marked as ${newStatus}` });
      fetchData();
    } catch (error) {
      toast({ title: "Failed to update subscription", variant: "destructive" });
    }
  };

  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-72 rounded-full" />
      </div>
      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardContent className="p-0">
          <div className="space-y-4 p-6">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold mb-1 text-[#0a1e16]">User Management</h1>
          <p className="text-muted-foreground">Manage and monitor {users.length} registered members.</p>
        </div>
        <div className="relative w-full sm:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search by name or email..." 
            className="pl-11 pr-4 h-11 rounded-full border-none shadow-sm focus-visible:ring-primary/20 bg-white" 
          />
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="w-[300px] py-5 px-6 font-bold text-[#0a1e16] uppercase tracking-wider text-[10px]">Member</TableHead>
                  <TableHead className="py-5 px-6 font-bold text-[#0a1e16] uppercase tracking-wider text-[10px]">Access Level</TableHead>
                  <TableHead className="py-5 px-6 font-bold text-[#0a1e16] uppercase tracking-wider text-[10px]">Subscription</TableHead>
                  <TableHead className="py-5 px-6 font-bold text-[#0a1e16] uppercase tracking-wider text-[10px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => {
                  const sub = subscriptions[u.email];
                  return (
                    <TableRow key={u.id} className="border-b border-muted/50 last:border-none group hover:bg-primary/[0.02] transition-colors">
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-11 w-11 border-2 border-white shadow-sm">
                            <AvatarImage src={u.avatar_url} />
                            <AvatarFallback className="bg-primary/5 text-primary font-bold">
                              {(u.full_name || u.email || "U").slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-bold text-[#0a1e16] group-hover:text-primary transition-colors leading-tight">{u.full_name || "New Member"}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 opacity-50" /> {u.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <Badge 
                          variant={u.role === "admin" ? "default" : "secondary"} 
                          className={cn(
                            "rounded-full px-3 py-0.5 font-bold text-[10px] uppercase tracking-wider",
                            u.role === "admin" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                          )}
                        >
                          {u.role === "admin" ? <Shield className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
                          {u.role || "user"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        {sub ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Badge 
                                className={cn(
                                  "rounded-full px-2 py-0 h-4 text-[9px] font-bold uppercase tracking-tighter shadow-none border-none",
                                  sub.status === "active" ? "bg-emerald-100 text-emerald-700" :
                                  sub.status === "cancelled" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"
                                )}
                              >
                                {sub.status}
                              </Badge>
                              <span className="text-[10px] font-bold text-[#0a1e16]/60 uppercase">{sub.plan}</span>
                            </div>
                            {sub.amount && <span className="text-[11px] text-muted-foreground">Rate: ${sub.amount}/mo</span>}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic opacity-50">Free Member</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4 px-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-9 w-9 p-0 rounded-full hover:bg-primary/10 hover:text-primary">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-2xl">
                            <DropdownMenuLabel className="text-[10px] uppercase tracking-widest opacity-50">Quick Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleRoleChange(u.id, u.role === "admin" ? "user" : "admin")}>
                              {u.role === "admin" ? <User className="w-4 h-4 mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                              {u.role === "admin" ? "Demote to User" : "Promote to Admin"}
                            </DropdownMenuItem>
                            {sub?.status === "active" && (
                              <DropdownMenuItem onClick={() => handleSubStatus(sub.id, "cancelled")} className="text-rose-600 focus:bg-rose-50 focus:text-rose-700">
                                <Ban className="w-4 h-4 mr-2" />
                                Cancel Subscription
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <CreditCard className="w-4 h-4 mr-2" />
                              View Transactions
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {filtered.length === 0 && (
              <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center">
                  <User className="w-8 h-8 text-muted-foreground opacity-20" />
                </div>
                <div>
                  <p className="font-bold text-[#0a1e16]">No members found</p>
                  <p className="text-sm text-muted-foreground">Try adjusting your search query.</p>
                </div>
                <Button variant="outline" onClick={() => setSearch("")} className="mt-2 rounded-full">Clear Search</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}