"use client";
import { DataTable, Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

const columns: Column[] = [
  {
    key: "name", header: "Image/Name",
    render: (r) => (
      <div className="flex items-center gap-3">
        {r.logo ? (
          <img src={String(r.logo).startsWith("http") ? String(r.logo) : `https://api.innovibemobility.com/storage/${r.logo}`}
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
  { key: "status", header: "Status", render: () => <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">Active</Badge> },
];

export function BrandsTable({ brands }: { brands: Record<string, unknown>[] }) {
  return <DataTable title="Brands List" subtitle="Manage your brands and their details here." rows={brands} columns={columns} exportFilename="brands" />;
}
