"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface Customer { id: string; full_name: string; }

export function AddComplaintButton({ customers }: { customers: Customer[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    customer_id: "", category: "", severity: "Medium", description: "", status: "open",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_id || !form.description) {
      toast.error("Customer and description are required.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("complaints").insert([form]);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Complaint logged successfully!");
    setOpen(false);
    setForm({ customer_id: "", category: "", severity: "Medium", description: "", status: "open" });
    router.refresh();
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
        <Plus className="h-4 w-4" />Log Complaint
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Log New Complaint</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label>Customer *</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}>
                  <option value="">Select customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  <option value="">Select category...</option>
                  {["Service Delay","Rude Staff","Part Unavailability","Billing Issue","Quality Issue","Other"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Severity</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
                  {["Low","Medium","High","Critical"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Description *</Label>
                <Textarea placeholder="Describe the complaint in detail..." rows={4} value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? "Logging..." : "Log Complaint"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
