"use client";
import { DataTable, Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

const columns: Column[] = [
  {
    key: "name", header: "Image/Name",
    render: (r) => (
      <div className="flex items-center gap-3">
        {r.image ? (
          <img src={String(r.image).startsWith("http") ? String(r.image) : `https://api.innovibemobility.com/storage/${r.image}`}
            alt={String(r.name)} className="h-10 w-10 object-contain rounded border bg-slate-50" />
        ) : (
          <div className="h-10 w-10 rounded border bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-sm">
            {String(r.name || "?")[0]}
          </div>
        )}
        <span className="font-medium text-slate-900">{String(r.name || "—")}</span>
      </div>
    ),
  },
  { key: "brand", header: "Brand Name", render: (r) => <span>{(r.brand as { name?: string } | null)?.name ?? "—"}</span> },
  { key: "release_year", header: "Release Year", render: (r) => <span>{String(r.release_year || "—")}</span> },
  { key: "status", header: "Status", render: () => <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">Active</Badge> },
];

export function ModelsTable({ models }: { models: Record<string, unknown>[] }) {
  return <DataTable title="Models" subtitle="All vehicle models from live system." rows={models} columns={columns} exportFilename="models" />;
}
