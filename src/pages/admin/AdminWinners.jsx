import { useState, useEffect } from "react";
import { base44 } from "@/api/supabaseClient";
import { Search, Mail, MoreHorizontal, Trophy, CheckCircle, Clock, CreditCard, Image as ImageIcon, ExternalLink } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function AdminWinners() {
  const [winners, setWinners] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const data = await base44.entities.Winner.list("-created_at");
      setWinners(data);
    } catch (error) {
      console.error("AdminWinners fetchData failed:", error);
      toast({ title: "Failed to fetch winners", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdateStatus = async (winnerId, newStatus) => {
    try {
      await base44.entities.Winner.update(winnerId, { status: newStatus });
      toast({ title: `Winner marked as ${newStatus}` });
      fetchData();
    } catch (error) {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const filtered = winners.filter(w =>
    w.user_email?.toLowerCase().includes(search.toLowerCase()) ||
    w.month?.toLowerCase().includes(search.toLowerCase()) ||
    w.match_type?.toLowerCase().includes(search.toLowerCase())
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
          <h1 className="font-serif text-3xl font-bold mb-1 text-[#0a1e16]">Prize Winners</h1>
          <p className="text-muted-foreground">Verify proof and manage payouts for all draw winners.</p>
        </div>
        <div className="relative w-full sm:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search by email, month or type..." 
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
                  <TableHead className="py-5 px-6 font-bold text-[#0a1e16] uppercase tracking-wider text-[10px]">Winner</TableHead>
                  <TableHead className="py-5 px-6 font-bold text-[#0a1e16] uppercase tracking-wider text-[10px]">Draw Details</TableHead>
                  <TableHead className="py-5 px-6 font-bold text-[#0a1e16] uppercase tracking-wider text-[10px]">Prize</TableHead>
                  <TableHead className="py-5 px-6 font-bold text-[#0a1e16] uppercase tracking-wider text-[10px]">Status</TableHead>
                  <TableHead className="py-5 px-6 font-bold text-[#0a1e16] uppercase tracking-wider text-[10px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((w) => (
                  <TableRow key={w.id} className="border-b border-muted/50 last:border-none group hover:bg-primary/[0.02] transition-colors">
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm bg-primary/5 text-primary">
                          <AvatarFallback className="font-bold">{(w.user_name || w.user_email || "W").slice(0, 1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold text-[#0a1e16] leading-tight">{w.user_name || w.user_email.split('@')[0]}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 opacity-50" /> {w.user_email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-[#0a1e16]/80 text-[11px] uppercase tracking-wider">{w.month}</span>
                        <div className="flex items-center gap-2">
                           <Badge variant="outline" className="rounded-full px-2 py-0 text-[9px] font-bold uppercase border-primary/20 text-primary whitespace-nowrap">
                             {w.match_type}
                           </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                        <Trophy className="w-4 h-4" />
                        <span>${w.prize_amount?.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "rounded-full px-3 py-0.5 font-bold text-[10px] uppercase tracking-wider shadow-none border-none",
                          w.status === "verified" ? "bg-blue-100 text-blue-700" :
                          w.status === "paid" ? "bg-emerald-100 text-emerald-700" : 
                          "bg-amber-100 text-amber-700"
                        )}
                      >
                        {w.status === "paid" ? <CheckCircle className="w-3 h-3 mr-1" /> : 
                         w.status === "verified" ? <Clock className="w-3 h-3 mr-1" /> : 
                         <Clock className="w-3 h-3 mr-1" />}
                        {w.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-9 w-9 p-0 rounded-full hover:bg-primary/10 hover:text-primary">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-xl">
                          <DropdownMenuLabel className="text-[10px] uppercase tracking-widest opacity-50">Manage Payout</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {w.status === "pending" && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(w.id, "verified")}>
                              <CheckCircle className="w-4 h-4 mr-2 text-blue-500" />
                              Verify Identity & Proof
                            </DropdownMenuItem>
                          )}
                          {w.status === "verified" && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(w.id, "paid")}>
                              <CreditCard className="w-4 h-4 mr-2 text-emerald-500" />
                              Mark as Paid
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => {
                            if (w.proof_image_url) window.open(w.proof_image_url, "_blank");
                            else toast({ title: "No proof uploaded yet." });
                          }}>
                            <ImageIcon className="w-4 h-4 mr-2" />
                            View Winner Proof
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Contact Winner
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filtered.length === 0 && (
              <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-muted-foreground opacity-20" />
                </div>
                <div>
                  <p className="font-bold text-[#0a1e16]">No winners recorded yet</p>
                  <p className="text-sm text-muted-foreground">Winners will appear here once draws are published.</p>
                </div>
                {search && <Button variant="outline" onClick={() => setSearch("")} className="mt-2 rounded-full shadow-none border-none">Clear Search</Button>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}