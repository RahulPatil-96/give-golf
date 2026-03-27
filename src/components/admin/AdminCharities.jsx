import { useState, useEffect } from "react";
import { base44 } from "@/api/supabaseClient";
import { Heart, Plus, Trash2, Edit3, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

const categories = ["Health", "Education", "Environment", "Community", "Youth", "Veterans", "Animals", "Other"];

const emptyForm = {
  name: "", description: "", short_description: "", category: "Health",
  image_url: "", website: "", featured: false, status: "active"
};

export default function AdminCharities() {
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.Charity.list().then(setCharities).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!form.name || !form.description) {
      toast({ title: "Name and description required", variant: "destructive" });
      return;
    }
    setSaving(true);
    if (editId) {
      const updated = await base44.entities.Charity.update(editId, form);
      setCharities(prev => prev.map(c => c.id === editId ? updated : c));
      toast({ title: "Charity updated!" });
    } else {
      const created = await base44.entities.Charity.create(form);
      setCharities(prev => [created, ...prev]);
      toast({ title: "Charity created!" });
    }
    setForm(emptyForm);
    setShowForm(false);
    setEditId(null);
    setSaving(false);
  };

  const handleEdit = (c) => {
    setForm({
      name: c.name, description: c.description, short_description: c.short_description || "",
      category: c.category, image_url: c.image_url || "", website: c.website || "",
      featured: c.featured || false, status: c.status || "active"
    });
    setEditId(c.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    await base44.entities.Charity.delete(id);
    setCharities(prev => prev.filter(c => c.id !== id));
    toast({ title: "Charity deleted" });
  };

  const handleToggleFeatured = async (c) => {
    await base44.entities.Charity.update(c.id, { featured: !c.featured });
    setCharities(prev => prev.map(ch => ch.id === c.id ? { ...ch, featured: !ch.featured } : ch));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold">Charity Management</h1>
        <Button onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(!showForm); }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Charity
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card border border-border/50 rounded-xl p-5 mb-6">
          <h3 className="font-semibold mb-4">{editId ? "Edit Charity" : "New Charity"}</h3>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Name *</label>
              <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Charity name" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full rounded-lg border border-input px-3 py-2 text-sm bg-background"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium mb-1 block">Short Description</label>
              <Input value={form.short_description} onChange={(e) => setForm(p => ({ ...p, short_description: e.target.value }))} placeholder="One-line summary" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium mb-1 block">Description *</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                rows={3}
                placeholder="Full description..."
                className="w-full rounded-lg border border-input px-3 py-2 text-sm bg-background resize-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Image URL</label>
              <Input value={form.image_url} onChange={(e) => setForm(p => ({ ...p, image_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Website</label>
              <Input value={form.website} onChange={(e) => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="featured" checked={form.featured} onChange={(e) => setForm(p => ({ ...p, featured: e.target.checked }))} />
              <label htmlFor="featured" className="text-sm">Featured on Homepage</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="active" checked={form.status === "active"} onChange={(e) => setForm(p => ({ ...p, status: e.target.checked ? "active" : "inactive" }))} />
              <label htmlFor="active" className="text-sm">Active</label>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editId ? "Update" : "Create"}</Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</Button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {charities.map(c => (
            <div key={c.id} className="bg-card border border-border/50 rounded-xl p-4 flex items-center gap-4">
              {c.image_url ? (
                <img src={c.image_url} alt={c.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{c.name}</span>
                  {c.featured && <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/20 text-secondary-foreground font-medium">Featured</span>}
                  {c.status === "inactive" && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Inactive</span>}
                </div>
                <div className="text-xs text-muted-foreground">{c.category}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => handleToggleFeatured(c)}>
                  {c.featured ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleEdit(c)}><Edit3 className="w-4 h-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}