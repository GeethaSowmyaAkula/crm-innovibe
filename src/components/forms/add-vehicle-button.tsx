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

interface Customer { id: string; full_name: string; }

export function AddVehicleButton({ customers }: { customers: Customer[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    customer_id: "", brand: "", model: "", registration_number: "",
    battery_serial: "", battery_health: "", purchase_date: "",
    warranty_expiry: "", amc_status: "inactive",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_id || !form.brand || !form.model || !form.registration_number) {
      toast.error("Customer, brand, model and registration are required.");
      return;
    }
    setLoading(true);
    const payload = {
      ...form,
      purchase_date: form.purchase_date || null,
      warranty_expiry: form.warranty_expiry || null,
    };
    const { error } = await supabase.from("vehicles").insert([payload]);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Vehicle added successfully!");
    setOpen(false);
    setForm({ customer_id: "", brand: "", model: "", registration_number: "", battery_serial: "", battery_health: "", purchase_date: "", warranty_expiry: "", amc_status: "inactive" });
    router.refresh();
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
        <Plus className="h-4 w-4" />Add Vehicle
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Vehicle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="v-customer">Customer *</Label>
                <select
                  id="v-customer"
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.customer_id}
                  onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}
                >
                  <option value="">Select customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="v-brand">Brand *</Label>
                <Input id="v-brand" placeholder="Ola / Ather / Revolt" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="v-model">Model *</Label>
                <Input id="v-model" placeholder="S1 Pro / 450X" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="v-reg">Registration No. *</Label>
                <Input id="v-reg" placeholder="MH 12 AB 1234" value={form.registration_number} onChange={e => setForm(f => ({ ...f, registration_number: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="v-battery">Battery Serial</Label>
                <Input id="v-battery" placeholder="BAT-XXXX" value={form.battery_serial} onChange={e => setForm(f => ({ ...f, battery_serial: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="v-health">Battery Health (%)</Label>
                <Input id="v-health" placeholder="95" value={form.battery_health} onChange={e => setForm(f => ({ ...f, battery_health: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="v-amc">AMC Status</Label>
                <select
                  id="v-amc"
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.amc_status}
                  onChange={e => setForm(f => ({ ...f, amc_status: e.target.value }))}
                >
                  <option value="inactive">Inactive</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="v-purchase">Purchase Date</Label>
                <Input id="v-purchase" type="date" value={form.purchase_date} onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="v-warranty">Warranty Expiry</Label>
                <Input id="v-warranty" type="date" value={form.warranty_expiry} onChange={e => setForm(f => ({ ...f, warranty_expiry: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? "Adding..." : "Add Vehicle"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
