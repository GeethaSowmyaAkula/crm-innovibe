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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface Customer { id: string; full_name: string; }
interface Vehicle { id: string; registration_number: string; customer_id: string; }
interface Garage  { id: string; name: string; }
interface Tech    { id: string; name: string; }

interface Props {
  customers: Customer[];
  vehicles: Vehicle[];
  garages: Garage[];
  technicians: Tech[];
  onSuccess?: () => void;
}

export function AddBookingButton({ customers, vehicles, garages, technicians, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    customer_id: "", vehicle_id: "", issue_type: "", issue_description: "",
    booking_source: "CRM", preferred_slot: "", assigned_garage_id: "",
    assigned_technician_id: "", status: "pending",
  });

  const filteredVehicles = form.customer_id
    ? vehicles.filter(v => v.customer_id === form.customer_id)
    : vehicles;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_id || !form.issue_type) {
      toast.error("Customer and issue type are required.");
      return;
    }
    setLoading(true);
    const payload = {
      ...form,
      vehicle_id: form.vehicle_id || null,
      preferred_slot: form.preferred_slot || null,
      assigned_garage_id: form.assigned_garage_id || null,
      assigned_technician_id: form.assigned_technician_id || null,
    };
    const { error } = await supabase.from("bookings").insert([payload]);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Booking created successfully!");
    setOpen(false);
    if (onSuccess) {
      onSuccess();
    } else {
      router.refresh();
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="crm-btn-primary crm-btn-sm">
        <Plus className="h-3.5 w-3.5" />New Booking
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Booking</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label>Customer *</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value, vehicle_id: "" }))}>
                  <option value="">Select customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Vehicle</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.vehicle_id} onChange={e => setForm(f => ({ ...f, vehicle_id: e.target.value }))}>
                  <option value="">Select vehicle...</option>
                  {filteredVehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Issue Type *</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.issue_type} onChange={e => setForm(f => ({ ...f, issue_type: e.target.value }))}>
                  <option value="">Select issue...</option>
                  {["Battery Warning","General Service","Brake Noise","Motor Issue","Software Update","Tyre/Suspension","Other"].map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Source</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.booking_source} onChange={e => setForm(f => ({ ...f, booking_source: e.target.value }))}>
                  {["CRM","WhatsApp","Website","Voice Agent","Email","Mobile App"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Issue Description</Label>
                <Textarea placeholder="Describe the issue..." value={form.issue_description}
                  onChange={e => setForm(f => ({ ...f, issue_description: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Preferred Slot</Label>
                <Input type="datetime-local" value={form.preferred_slot}
                  onChange={e => setForm(f => ({ ...f, preferred_slot: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Assign Garage</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.assigned_garage_id} onChange={e => setForm(f => ({ ...f, assigned_garage_id: e.target.value }))}>
                  <option value="">No garage assigned</option>
                  {garages.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Assign Technician</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.assigned_technician_id} onChange={e => setForm(f => ({ ...f, assigned_technician_id: e.target.value }))}>
                  <option value="">No technician assigned</option>
                  {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? "Creating..." : "Create Booking"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
