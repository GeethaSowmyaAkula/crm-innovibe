"use client";
import { DataTable, Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

const availabilityStyles: Record<string, string> = {
  available: "border-green-200 bg-green-50 text-green-700",
  busy: "border-orange-200 bg-orange-50 text-orange-700",
  offline: "border-slate-200 bg-slate-50 text-slate-500",
};

const columns: Column[] = [
  {
    key: "name", header: "Name",
    render: (r) => (
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <span className="text-blue-700 font-semibold text-sm">{String(r.name || "?")[0].toUpperCase()}</span>
        </div>
        <span className="font-medium text-slate-900">{String(r.name || "—")}</span>
      </div>
    ),
  },
  {
    key: "phone", header: "Mobile",
    render: (r) => <span>{String(r.phone || "—")}</span>,
  },
  {
    key: "skills", header: "Skills",
    render: (r) => {
      const skills = r.skills as string[] | null;
      if (!skills || skills.length === 0) return <span className="text-slate-400">—</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {skills.map((s) => (
            <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">{s}</span>
          ))}
        </div>
      );
    },
  },
  {
    key: "current_assignments", header: "Active Jobs",
    render: (r) => (
      <span className={`font-semibold ${Number(r.current_assignments) > 0 ? "text-orange-600" : "text-slate-400"}`}>
        {r.current_assignments ?? 0}
      </span>
    ),
  },
  {
    key: "availability", header: "Status",
    render: (r) => {
      const status = String(r.availability || "available");
      return (
        <Badge variant="outline" className={availabilityStyles[status] ?? "border-slate-200 text-slate-500"}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
  },
  {
    key: "created_at", header: "Joined",
    render: (r) => (
      <span className="text-slate-500 text-sm">
        {r.created_at ? new Date(String(r.created_at)).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
      </span>
    ),
  },
];

export function TechniciansTable({ technicians }: { technicians: Record<string, unknown>[] }) {
  return (
    <DataTable
      title="Technicians List"
      subtitle="Manage technicians and their role details."
      rows={technicians}
      columns={columns}
      exportFilename="technicians"
    />
  );
}
