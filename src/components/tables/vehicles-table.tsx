"use client";
import { DataTable, Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

const columns: Column[] = [
  { key: "registration_number", header: "Registration No.", render: (r) => <span className="font-medium text-slate-900">{String(r.registration_number || "—")}</span> },
  { key: "owner_name", header: "Owner", render: (r) => <span>{String(r.owner_name || `User #${r.user_id}`)}</span> },
  { key: "brand", header: "Brand", render: (r) => <span>{(r.brand as { name?: string } | null)?.name ?? "—"}</span> },
  { key: "model", header: "Model", render: (r) => <span>{(r.model as { name?: string } | null)?.name ?? "—"}</span> },
  { key: "make_year", header: "Make Year", render: (r) => <span>{String(r.make_year || "—")}</span> },
  { key: "current_odometer", header: "Odometer", render: (r) => r.current_odometer ? <span>{Number(r.current_odometer).toLocaleString()} km</span> : <span className="text-slate-400">—</span> },
  { key: "insurance_provider", header: "Insurance", render: (r) => <span>{String(r.insurance_provider || "—")}</span> },
  { key: "status", header: "Status", render: (r) => <Badge variant="outline" className={r.status === "active" ? "border-green-200 bg-green-50 text-green-700" : "border-slate-200 text-slate-500"}>{String(r.status)}</Badge> },
];

export function VehiclesTable({ vehicles }: { vehicles: Record<string, unknown>[] }) {
  return <DataTable title="Vehicles" subtitle={`${vehicles.length} registered EVs from live system.`} rows={vehicles} columns={columns} exportFilename="vehicles" />;
}
