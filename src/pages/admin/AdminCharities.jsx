import { useState, useEffect } from "react";
import { base44 } from "@/api/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Plus, Pencil, Trash2, X, Check, Globe, Image as ImageIcon, Star } from "lucide-react";
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
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Health", "Education", "Environment", "Community", "Youth", "Veterans", "Animals", "Other"];
const EMPTY = { name: "", description: "", short_description: "", category: "Health", image_url: "", website: "", featured: false, status: "active" };

export default function AdminCharities() {
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchCharities = async () => {
    try {
      const data = await base44.entities.Charity.list("-created_date");
      setCharities(data);
    } catch (error) {
      toast({ title: "Failed to load charities", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCharities(); }, []);

  const handleSave = async () => {
    if (!form.name || !form.description || !form.category) {
      toast({ title: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await base44.entities.Charity.update(editing, form);
        toast({ title: "Charity updated successfully." });
      } else {
        await base44.entities.Charity.create(form);
        toast({ title: "Charity created successfully." });
      }
      setForm(EMPTY);
      setEditing(null);
      setShowForm(false);
      fetchCharities();
    } catch (error) {
      toast({ title: "Failed to save charity", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (charity) => {
    setForm({ ...EMPTY, ...charity });
    setEditing(charity.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this charity?")) return;
    try {
      await base44.entities.Charity.delete(id);
      toast({ title: "Charity removed." });
      fetchCharities();
    } catch (error) {
      toast({ title: "Failed to delete charity", variant: "destructive" });
    }
  };

  const handleToggleFeatured = async (charity) => {
    try {
      await base44.entities.Charity.update(charity.id, { featured: !charity.featured });
      fetchCharities();
    } catch (error) {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  if (loading) return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
         <Skeleton className="h-10 w-64" />
         <Skeleton className="h-10 w-32 rounded-full" />
       </div>
       <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
         {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-80 w-full rounded-3xl" />)}
       </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold mb-1 text-[#0a1e16]">Charity Partners</h1>
          <p className="text-muted-foreground">Manage organizational partners and featured causes.</p>
        </div>
        <Button onClick={() => { setForm(EMPTY); setEditing(null); setShowForm(true); }} className="gap-2 rounded-full px-6 bg-primary shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> Add New Charity
        </Button>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-2xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-primary/5 p-8 border-b border-primary/10">
            <DialogHeader className="">
              <DialogTitle className="font-serif text-2xl text-[#0a1e16]">{editing ? "Edit Charity Partner" : "Register New Charity"}</DialogTitle>
              <DialogDescription className="text-muted-foreground/80">Configure how this charity appears across the platform.</DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#0a1e16] uppercase tracking-widest pl-1">Organization Name *</label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Save the Children" className="rounded-xl border-muted focus-visible:ring-primary/20" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#0a1e16] uppercase tracking-widest pl-1">Primary Category *</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-[#0a1e16] uppercase tracking-widest pl-1">Short Tagline</label>
                <Input value={form.short_description} onChange={e => setForm(p => ({ ...p, short_description: e.target.value }))} placeholder="A brief one-line summary..." className="rounded-xl border-muted focus-visible:ring-primary/20" />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-[#0a1e16] uppercase tracking-widest pl-1">Full Mission Description *</label>
                <textarea 
                  value={form.description} 
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))} 
                  rows={4} 
                  placeholder="Tell our users about the impact this organization makes..." 
                  className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#0a1e16] uppercase tracking-widest pl-1 flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Cover Image URL</label>
                <Input value={form.image_url} onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))} placeholder="https://unsplash.com/..." className="rounded-xl border-muted focus-visible:ring-primary/20" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#0a1e16] uppercase tracking-widest pl-1 flex items-center gap-1"><Globe className="w-3 h-3" /> Official Website</label>
                <Input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://organization.org" className="rounded-xl border-muted focus-visible:ring-primary/20" />
              </div>
              
              <div className="sm:col-span-2 flex items-center gap-6 p-4 bg-muted/20 rounded-2xl">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors border-2",
                    form.featured ? "bg-primary text-white shadow-lg shadow-primary/20 border-primary" : "bg-white text-muted-foreground border-muted"
                  )}>
                    <Star className={cn("w-5 h-5", form.featured && "fill-current")} />
                    <input type="checkbox" checked={form.featured} onChange={e => setForm(p => ({ ...p, featured: e.target.checked }))} className="sr-only" />
                  </div>
                  <div>
                    <span className="text-sm font-bold block text-[#0a1e16]">Featured Status</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Show on homepage</span>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer group border-l border-muted pl-6">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors border-2",
                    form.status === "active" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-white text-muted-foreground border-muted"
                  )}>
                    <Check className="w-5 h-5" />
                    <input type="checkbox" checked={form.status === "active"} onChange={e => setForm(p => ({ ...p, status: e.target.checked ? "active" : "inactive" }))} className="sr-only" />
                  </div>
                  <div>
                    <span className="text-sm font-bold block text-[#0a1e16]">Visibility</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{form.status === "active" ? "Live on site" : "Hidden"}</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
          
          <DialogFooter className="p-8 bg-muted/10 border-t border-muted/30">
            <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl h-12 px-6">Discard</Button>
            <Button onClick={handleSave} disabled={saving} className="rounded-xl h-12 px-8 bg-primary">
              {saving ? "Saving Changes..." : editing ? "Apply Changes" : "Confirm & Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {charities.map((charity, i) => (
            <motion.div
              key={charity.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-[32px] overflow-hidden group bg-white h-full flex flex-col">
                <div className="aspect-[16/10] relative overflow-hidden bg-muted">
                  {charity.image_url ? (
                    <img 
                      src={charity.image_url} 
                      alt={charity.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                       <ImageIcon className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <Badge className="bg-white/90 backdrop-blur-md text-[#0a1e16] border-none font-bold text-[9px] uppercase tracking-widest shadow-sm">
                      {charity.category}
                    </Badge>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge className={cn(
                      "backdrop-blur-md border-none font-bold text-[9px] uppercase tracking-widest shadow-sm",
                      charity.status === "active" ? "bg-emerald-500/90 text-white" : "bg-slate-500/90 text-white"
                    )}>
                      {charity.status}
                    </Badge>
                  </div>
                  {charity.featured && (
                    <div className="absolute bottom-4 left-4">
                      <div className="bg-primary text-white p-2 rounded-xl shadow-lg">
                        <Star className="w-4 h-4 fill-current" />
                      </div>
                    </div>
                  )}
                </div>
                
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="flex-1">
                    <h3 className="text-lg font-serif font-bold text-[#0a1e16] mb-1 group-hover:text-primary transition-colors">{charity.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-4 min-h-[48px]">
                      {charity.short_description || charity.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-4 border-t border-muted/50">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 rounded-2xl gap-2 h-10 border-muted hover:bg-primary/5 hover:text-primary transition-all active:scale-95 shadow-none" 
                      onClick={() => handleEdit(charity)}
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className={cn(
                        "rounded-2xl h-10 w-10 p-0 transition-all active:scale-95 shadow-none",
                        charity.featured ? "text-primary border-primary/20 bg-primary/5" : "text-muted-foreground border-muted hover:text-primary"
                      )} 
                      onClick={() => handleToggleFeatured(charity)}
                    >
                      <Heart className={cn("w-4 h-4", charity.featured && "fill-current")} />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="rounded-2xl h-10 w-10 p-0 text-rose-500 border-muted hover:bg-rose-50 hover:border-rose-100 transition-all active:scale-95 shadow-none" 
                      onClick={() => handleDelete(charity.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {charities.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3 py-24 text-center flex flex-col items-center gap-4 bg-muted/20 rounded-[40px] border-2 border-dashed border-muted text-muted-foreground">
             <Heart className="w-12 h-12 opacity-20" />
             <div>
                <p className="text-lg font-serif font-bold text-[#0a1e16]">No charity partners registered</p>
                <p className="text-sm">Partners added here will be available for user donations.</p>
             </div>
             <Button onClick={() => setShowForm(true)} variant="outline" className="rounded-full px-8 mt-2 shadow-none">Register First Charity</Button>
          </div>
        )}
      </div>
    </div>
  );
}