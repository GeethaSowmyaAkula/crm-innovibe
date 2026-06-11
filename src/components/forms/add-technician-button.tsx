"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Garage { id: string; name: string; }

export function AddTechnicianButton({ garages }: { garages: Garage[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    name: "", phone: "", garage_id: "", availability: "available", skills: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) { toast.error("Name and phone are required."); return; }
    setLoading(true);
    const { error } = await supabase.from("technicians").insert([{
      name: form.name,
      phone: form.phone,
      garage_id: form.garage_id || null,
      availability: form.availability,
      skills: form.skills ? form.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
      current_assignments: 0,
    }]);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Technician added successfully!");
    setOpen(false);
    setForm({ name: "", phone: "", garage_id: "", availability: "available", skills: "" });
    router.refresh();
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
        <Plus className="h-4 w-4" />Add Technician
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add New Technician</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input placeholder="Ravi Kumar" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone *</Label>
                <Input placeholder="+91 9811223344" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Assign to Garage</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.garage_id} onChange={e => setForm(f => ({ ...f, garage_id: e.target.value }))}>
                  <option value="">No garage assigned</option>
                  {garages.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Availability</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.availability} onChange={e => setForm(f => ({ ...f, availability: e.target.value }))}>
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="off">Off</option>
                </select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Skills (comma-separated)</Label>
                <Input placeholder="Battery, Motor, Brake" value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? "Adding..." : "Add Technician"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
