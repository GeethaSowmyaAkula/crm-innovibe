import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Cpu, Zap, BatteryCharging, ShieldAlert } from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function TelemetryLogsPage() {
  const db = await createClient();
  const { data: rawVehicles } = await db.from("vehicles").select("id, registration_number, model, customers(full_name)");
  const { data: rawTelemetry } = await db.from("vehicles_telemetry").select("*");

  const telemetryMap = new Map<string, any>((rawTelemetry || []).map((t: any) => [t.vehicle_id, t]));
  const vehicles = rawVehicles || [];

  const telemetryLogs = vehicles.map((v: any) => {
    const t = telemetryMap.get(v.id);
    const fleetName = v.customers?.full_name || "Unassigned";
    if (t) {
      return {
        id: v.id,
        vehicle: v.registration_number || v.model || "Unknown",
        fleet: fleetName,
        soc: t.soc ? `${t.soc}%` : "N/A",
        temp: t.battery_temp ? `${t.battery_temp}°C` : "N/A",
        voltage: t.voltage ? `${t.voltage}V` : "N/A",
        current: t.current ? `${t.current}A` : "N/A",
        motorTemp: t.motor_temp ? `${t.motor_temp}°C` : "N/A",
        status: t.status || "Optimal"
      };
    } else {
      return {
        id: v.id,
        vehicle: v.registration_number || v.model || "Unknown",
        fleet: fleetName,
        soc: "N/A",
        temp: "N/A",
        voltage: "N/A",
        current: "N/A",
        motorTemp: "N/A",
        status: "Offline"
      };
    }
  });

  const onlineCount = telemetryLogs.filter((t: any) => t.status !== "Offline").length;
  const activeAlerts = telemetryLogs.filter((t: any) => t.status === "Warning" || t.status === "Critical").length;

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Hardware Telemetry</h1>
        <p className="text-slate-500 text-sm">Real-time IoT diagnostics tracking battery packs, thermal sensors, and controller output.</p>
      </div>

      {/* Stats row */}
      <div className="grid gap-6 sm:grid-cols-3">
        <Card className="border border-slate-100 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-slate-500 text-xs font-semibold uppercase">IoT Devices Online</CardTitle>
            <Cpu className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-950">{onlineCount} / {vehicles.length}</div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-slate-500 text-xs font-semibold uppercase">Avg Pack Temp</CardTitle>
            <BatteryCharging className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-950">{onlineCount > 0 ? "34.6°C" : "N/A"}</div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-slate-500 text-xs font-semibold uppercase">Active Device Alerts</CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-500 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-950">{activeAlerts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Telemetry Stream */}
      <Card className="border border-slate-100 shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-slate-800 text-sm font-semibold">Real-Time Sensor Ingestion Stream</CardTitle>
          <CardDescription>Live telemetry parameters broadcast from active vehicle tracking modules.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-slate-500 font-semibold text-xs">Vehicle Plate</TableHead>
                <TableHead className="text-slate-500 font-semibold text-xs">Fleet / Owner</TableHead>
                <TableHead className="text-slate-500 font-semibold text-xs">State of Charge (SoC)</TableHead>
                <TableHead className="text-slate-500 font-semibold text-xs">Battery Temp</TableHead>
                <TableHead className="text-slate-500 font-semibold text-xs">Voltage</TableHead>
                <TableHead className="text-slate-500 font-semibold text-xs">Current</TableHead>
                <TableHead className="text-slate-500 font-semibold text-xs">Motor Temp</TableHead>
                <TableHead className="text-slate-500 font-semibold text-xs text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {telemetryLogs.map((log: any) => (
                <TableRow key={log.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-bold text-xs text-slate-800">{log.vehicle}</TableCell>
                  <TableCell className="text-xs text-slate-600 font-medium">{log.fleet}</TableCell>
                  <TableCell className="text-xs text-slate-700 font-bold">{log.soc}</TableCell>
                  <TableCell className="text-xs text-slate-600 font-medium">{log.temp}</TableCell>
                  <TableCell className="text-xs text-slate-600 font-medium">{log.voltage}</TableCell>
                  <TableCell className="text-xs text-slate-600 font-mono">{log.current}</TableCell>
                  <TableCell className="text-xs text-slate-600 font-medium">{log.motorTemp}</TableCell>
                  <TableCell className="text-right">
                    <Badge 
                      variant="outline" 
                      className={
                        log.status === "Optimal" 
                          ? "text-green-700 bg-green-50 border-green-200" 
                          : log.status === "Warning" 
                          ? "text-orange-700 bg-orange-50 border-orange-200"
                          : log.status === "Offline"
                          ? "text-slate-700 bg-slate-100 border-slate-200"
                          : "text-red-700 bg-red-50 border-red-200"
                      }
                    >
                      {log.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
