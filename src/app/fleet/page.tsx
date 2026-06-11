import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Car, Wrench, ShieldAlert, Award, FileText, CheckCircle2 } from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function FleetDashboardPage() {
  const db = await createClient();
  
  const { data: rawVehicles } = await db.from("vehicles").select("*, customers(full_name)");
  const { data: rawReminders } = await db.from("reminder_queue").select("*").order("scheduled_at", { ascending: true }).limit(5);

  const vehicles = rawVehicles || [];
  
  // Group by customer_id to form "fleets"
  const fleetMap = new Map<string, any>();
  vehicles.forEach((v: any) => {
    const cId = v.customer_id || "unassigned";
    if (!fleetMap.has(cId)) {
      fleetMap.set(cId, {
        id: cId,
        name: v.customers?.full_name || `Fleet ${cId.substring(0, 4)}`,
        owner: v.customers?.full_name || "Unknown",
        vehiclesCount: 0,
        status: "Active",
        healthSum: 0
      });
    }
    const fleet = fleetMap.get(cId);
    fleet.vehiclesCount++;
    const healthNum = parseInt(v.battery_health || "90");
    fleet.healthSum += (isNaN(healthNum) ? 90 : healthNum);
    if (v.amc_status !== "active") fleet.status = "Under Maintenance";
  });

  const fleets = Array.from(fleetMap.values()).map(f => ({
    id: f.id,
    name: f.name,
    owner: f.owner,
    vehiclesCount: f.vehiclesCount,
    status: f.status,
    health: `${Math.round(f.healthSum / f.vehiclesCount)}%`
  }));

  const activeCount = fleets.filter(f => f.status === "Active").length;
  const maintenanceCount = fleets.length - activeCount;

  const maintenanceSchedule = (rawReminders || []).map((m: any) => ({
    id: m.id,
    vehicle: m.vehicle_name || m.customer_name || "Unknown",
    fleet: m.customer_name || "Unknown Fleet",
    type: m.service_type || "Service",
    date: m.scheduled_at ? new Date(m.scheduled_at).toISOString().split("T")[0] : "N/A",
    status: m.status === "ready_to_send" ? "Scheduled" : m.status
  }));

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Fleet Intelligence</h1>
        <p className="text-slate-500 text-sm">Monitor enterprise vehicle groups, AMC compliance, and scheduled preventive services.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 sm:grid-cols-4">
        {[
          { label: "Active Fleets", value: activeCount.toString(), icon: Award, color: "text-blue-600 bg-blue-50" },
          { label: "Total Fleet Vehicles", value: vehicles.length.toString(), icon: Car, color: "text-emerald-600 bg-emerald-50" },
          { label: "Under Maintenance", value: maintenanceCount.toString(), icon: Wrench, color: "text-orange-600 bg-orange-50" },
          { label: "SLA Adherence Rate", value: fleets.length > 0 ? "96.4%" : "0%", icon: CheckCircle2, color: "text-purple-600 bg-purple-50" }
        ].map((stat, i) => (
          <Card key={i} className="border border-slate-100 shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-slate-500 text-xs font-semibold uppercase">{stat.label}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-950">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Fleets list */}
        <Card className="border border-slate-100 shadow-sm md:col-span-2 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-slate-800 text-sm font-semibold">Registered Client Fleets</CardTitle>
            <CardDescription>Managed enterprise client pools and aggregate scores.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="text-slate-500 font-semibold text-xs">Fleet Name</TableHead>
                  <TableHead className="text-slate-500 font-semibold text-xs">Client Owner</TableHead>
                  <TableHead className="text-slate-500 font-semibold text-xs text-center">Vehicles</TableHead>
                  <TableHead className="text-slate-500 font-semibold text-xs">Average Health</TableHead>
                  <TableHead className="text-slate-500 font-semibold text-xs text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fleets.map((f) => (
                  <TableRow key={f.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-bold text-xs text-slate-800">{f.name}</TableCell>
                    <TableCell className="text-xs text-slate-600 font-medium">{f.owner}</TableCell>
                    <TableCell className="text-xs text-slate-600 text-center font-bold">{f.vehiclesCount}</TableCell>
                    <TableCell className="text-xs text-slate-600 font-semibold">{f.health}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className={f.status === "Active" ? "text-green-700 bg-green-50 border-green-200" : "text-orange-700 bg-orange-50 border-orange-200"}>
                        {f.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Maintenance Log */}
        <Card className="border border-slate-100 shadow-sm md:col-span-1">
          <CardHeader>
            <CardTitle className="text-slate-800 text-sm font-semibold">Maintenance Schedule</CardTitle>
            <CardDescription>Preventive maintenance dates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {maintenanceSchedule.map((m: any) => (
              <div key={m.id} className="p-3 border border-slate-100 rounded-xl bg-white hover:bg-slate-50 transition-all flex items-start gap-3">
                <div className="p-2 rounded-lg bg-orange-50 text-orange-600 shrink-0">
                  <Wrench className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-900">{m.vehicle}</span>
                    <Badge variant="outline" className="text-[9px] uppercase border-slate-200">{m.status}</Badge>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">{m.fleet} · {m.type}</p>
                  <p className="text-[9px] text-slate-400 mt-1">Due Date: {m.date}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
