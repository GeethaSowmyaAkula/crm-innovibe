import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Cpu, Zap, BatteryCharging, ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default function TelemetryLogsPage() {
  const telemetryLogs = [
    { id: "t1", vehicle: "MH-12-EQ-8834", soc: "42%", temp: "45°C", voltage: "72.4V", current: "-12.5A", motorTemp: "62°C", status: "Warning" },
    { id: "t2", vehicle: "KA-51-AB-1209", soc: "88%", temp: "32°C", voltage: "74.1V", current: "2.1A", motorTemp: "38°C", status: "Optimal" },
    { id: "t3", vehicle: "MH-01-XX-9090", soc: "15%", temp: "38°C", voltage: "68.2V", current: "-42.0A", motorTemp: "70°C", status: "Critical" },
    { id: "t4", vehicle: "DL-03-CC-4451", soc: "96%", temp: "29°C", voltage: "74.8V", current: "0.0A", motorTemp: "25°C", status: "Optimal" }
  ];

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
            <div className="text-2xl font-bold text-slate-950">28 / 31</div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-slate-500 text-xs font-semibold uppercase">Avg Pack Temp</CardTitle>
            <BatteryCharging className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-950">34.6°C</div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-slate-500 text-xs font-semibold uppercase">Active Device Alerts</CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-500 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-950">2</div>
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
                <TableHead className="text-slate-500 font-semibold text-xs">State of Charge (SoC)</TableHead>
                <TableHead className="text-slate-500 font-semibold text-xs">Battery Temp</TableHead>
                <TableHead className="text-slate-500 font-semibold text-xs">Voltage</TableHead>
                <TableHead className="text-slate-500 font-semibold text-xs">Current</TableHead>
                <TableHead className="text-slate-500 font-semibold text-xs">Motor Temp</TableHead>
                <TableHead className="text-slate-500 font-semibold text-xs text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {telemetryLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-bold text-xs text-slate-800">{log.vehicle}</TableCell>
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
