import { useState, useEffect } from "react";
import { base44 } from "@/api/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const CATEGORIES = ["Health", "Education", "Environment", "Community", "Youth", "Veterans", "Animals", "Other"];
const EMPTY = { name: "", description: "", short_description: "", category: "Health", image_url: "", website: "", featured: false, status: "active" };

export default function AdminCharities() {
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchCharities = () => {
    base44.entities.Charity.list("-created_date").then(setCharities).finally(() => setLoading(false));
  };
  useEffect(() => { fetchCharities(); }, []);

  const handleSave = async () => {
    if (!form.name || !form.description || !form.category) {
      toast({ title: "Name, description and category are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    if (editing) {
      await base44.entities.Charity.update(editing, form);
      toast({ title: "Charity updated." });
    } else {
      await base44.entities.Charity.create(form);
      toast({ title: "Charity created." });
    }
    setForm(EMPTY);
    setEditing(null);
    setShowForm(false);
    setSaving(false);
    fetchCharities();
  };

  const handleEdit = (charity) => {
    setForm({ ...EMPTY, ...charity });
    setEditing(charity.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this charity?")) return;
    await base44.entities.Charity.delete(id);
    toast({ title: "Charity deleted." });
    fetchCharities();
  };

  const handleToggleFeatured = async (charity) => {
    await base44.entities.Charity.update(charity.id, { featured: !charity.featured });
    fetchCharities();
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold mb-1">Charity Management</h1>
          <p className="text-muted-foreground">{charities.length} charities in system</p>
        </div>
        <Button onClick={() => { setForm(EMPTY); setEditing(null); setShowForm(true); }} className="gap-2 rounded-full">
          <Plus className="w-4 h-4" /> Add Charity
        </Button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border/50 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">{editing ? "Edit Charity" : "New Charity"}</h2>
            <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1">Name *</label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Charity name" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Category *</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium block mb-1">Short Description</label>
              <Input value={form.short_description} onChange={e => setForm(p => ({ ...p, short_description: e.target.value }))} placeholder="One-line description" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium block mb-1">Full Description *</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Charity description..." className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Image URL</label>
              <Input value={form.image_url} onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Website</label>
              <Input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="flex gap-4 items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.featured} onChange={e => setForm(p => ({ ...p, featured: e.target.checked }))} className="rounded" />
                <span className="text-sm font-medium">Featured on Homepage</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.status === "active"} onChange={e => setForm(p => ({ ...p, status: e.target.checked ? "active" : "inactive" }))} className="rounded" />
                <span className="text-sm font-medium">Active</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create"}</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </motion.div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {charities.map(charity => (
          <div key={charity.id} className="bg-card border border-border/50 rounded-2xl overflow-hidden">
            {charity.image_url && (
              <div className="aspect-video bg-muted">
                <img src={charity.image_url} alt={charity.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-semibold">{charity.name}</div>
                  <div className="text-xs text-muted-foreground">{charity.category}</div>
                </div>
                <div className="flex gap-1">
                  {charity.featured && <span className="text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded-full">Featured</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${charity.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{charity.status}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{charity.short_description || charity.description}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 rounded-full gap-1 h-8" onClick={() => handleEdit(charity)}>
                  <Pencil className="w-3 h-3" /> Edit
                </Button>
                <Button size="sm" variant="outline" className="rounded-full h-8 px-3" onClick={() => handleToggleFeatured(charity)}>
                  <Heart className={`w-3 h-3 ${charity.featured ? "fill-primary text-primary" : ""}`} />
                </Button>
                <Button size="sm" variant="outline" className="rounded-full h-8 px-3 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(charity.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {charities.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3 text-center py-12 text-muted-foreground">
            No charities yet. Add your first charity above.
          </div>
        )}
      </div>
    </div>
  );
}