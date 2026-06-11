import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, ShieldAlert, Cpu, Heart } from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function VehicleHealthPage() {
  const db = await createClient();
  const { data: rawVehicles } = await db.from("vehicles").select("*, customers(full_name)");
  const vehicles = rawVehicles || [];

  const healthRecords = vehicles.map((v: any) => {
    const batteryHealth = parseInt(v.battery_health) || 90;
    return {
      id: v.id,
      vehicle: v.registration_number || v.model || "Unknown",
      fleet: v.customers?.full_name || "Unassigned",
      score: batteryHealth,
      battery: batteryHealth > 80 ? "Optimal" : batteryHealth > 60 ? "Good" : "Degraded",
      motor: v.amc_status === "active" ? "Optimal" : "Warning (No AMC)",
      controller: "Optimal",
      lastChecked: v.updated_at ? new Date(v.updated_at).toLocaleDateString() : "N/A"
    };
  });

  const totalScore = healthRecords.reduce((sum: number, r: any) => sum + r.score, 0);
  const avgScore = healthRecords.length ? Math.round(totalScore / healthRecords.length) : 0;
  const criticalCount = healthRecords.filter((r: any) => r.score <= 60).length;

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Vehicle Health</h1>
        <p className="text-slate-500 text-sm">Analyze overall state-of-health (SOH) indices and predictive diagnostic results.</p>
      </div>

      {/* Stats row */}
      <div className="grid gap-6 sm:grid-cols-3">
        <Card className="border border-slate-100 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-slate-500 text-xs font-semibold uppercase">Overall Fleet Health Score</CardTitle>
            <Heart className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-950">{avgScore}%</div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-slate-500 text-xs font-semibold uppercase">Hardware Diagnostics Score</CardTitle>
            <Cpu className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-950">{avgScore > 80 ? "Optimal" : "Needs Review"}</div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-slate-500 text-xs font-semibold uppercase">Risk Mitigation Flags</CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-500 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-950">{criticalCount} Critical</div>
          </CardContent>
        </Card>
      </div>

      {/* Health List */}
      <Card className="border border-slate-100 shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-slate-800 text-sm font-semibold">Active Fleet Health Overview</CardTitle>
          <CardDescription>Estimated cell degradation, thermal indicators, and predictive warnings.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-slate-500 font-semibold text-xs">Vehicle Plate</TableHead>
                <TableHead className="text-slate-500 font-semibold text-xs">Fleet / Owner</TableHead>
                <TableHead className="text-slate-500 font-semibold text-xs">Overall Health Score</TableHead>
                <TableHead className="text-slate-500 font-semibold text-xs">Battery Pack</TableHead>
                <TableHead className="text-slate-500 font-semibold text-xs">Electric Motor</TableHead>
                <TableHead className="text-slate-500 font-semibold text-xs">Motor Controller</TableHead>
                <TableHead className="text-slate-500 font-semibold text-xs text-right">Last Telemetry Ping</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {healthRecords.map((r: any) => (
                <TableRow key={r.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-bold text-xs text-slate-800">{r.vehicle}</TableCell>
                  <TableCell className="text-xs text-slate-600 font-medium">{r.fleet}</TableCell>
                  <TableCell className="text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${r.score > 80 ? "text-green-600" : r.score > 60 ? "text-orange-600" : "text-red-600"}`}>
                        {r.score}%
                      </span>
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                        <div 
                          className={`h-full rounded-full ${r.score > 80 ? "bg-green-600" : r.score > 60 ? "bg-orange-600" : "bg-red-600"}`}
                          style={{ width: `${r.score}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 font-medium">{r.battery}</TableCell>
                  <TableCell className="text-xs text-slate-600 font-medium">{r.motor}</TableCell>
                  <TableCell className="text-xs text-slate-600 font-medium">{r.controller}</TableCell>
                  <TableCell className="text-xs text-slate-400 text-right">{r.lastChecked}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
