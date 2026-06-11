import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Car, Wrench, ShieldAlert, Award, FileText, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function FleetDashboardPage() {
  const fleets = [
    { id: "fl1", name: "Pune Logistics Hub", owner: "Express Delivery Services", vehiclesCount: 14, status: "Active", health: "92%" },
    { id: "fl2", name: "Bangalore Rider Pool", owner: "Zippy Food Delivery", vehiclesCount: 12, status: "Active", health: "88%" },
    { id: "fl3", name: "Mumbai Corporate Fleet", owner: "InnoCorp Services", vehiclesCount: 5, status: "Under Maintenance", health: "74%" }
  ];

  const maintenanceSchedule = [
    { id: "m1", vehicle: "MH-12-EQ-8834", fleet: "Pune Logistics", type: "Battery Audit", date: "2026-06-08", status: "Scheduled" },
    { id: "m2", vehicle: "KA-51-AB-1209", fleet: "Bangalore Rider Pool", type: "General Tuning", date: "2026-06-10", status: "Pending Allocation" },
    { id: "m3", vehicle: "MH-01-XX-9090", fleet: "Mumbai Corporate", type: "Controller Repair", date: "2026-06-06", status: "In Progress" }
  ];

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Fleet Intelligence</h1>
        <p className="text-slate-500 text-sm">Monitor enterprise vehicle groups, AMC compliance, and scheduled preventive services.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 sm:grid-cols-4">
        {[
          { label: "Active Fleets", value: "3", icon: Award, color: "text-blue-600 bg-blue-50" },
          { label: "Total Fleet Vehicles", value: "31", icon: Car, color: "text-emerald-600 bg-emerald-50" },
          { label: "Under Maintenance", value: "3", icon: Wrench, color: "text-orange-600 bg-orange-50" },
          { label: "SLA Adherence Rate", value: "96.4%", icon: CheckCircle2, color: "text-purple-600 bg-purple-50" }
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
            {maintenanceSchedule.map((m) => (
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
