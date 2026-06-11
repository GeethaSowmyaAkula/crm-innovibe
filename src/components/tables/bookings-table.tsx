"use client";
import { DataTable, Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

const statusStyles: Record<string, string> = {
  booking_created: "bg-yellow-50 text-yellow-700 border-yellow-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  assigned: "bg-purple-50 text-purple-700 border-purple-200",
  in_progress: "bg-orange-50 text-orange-700 border-orange-200",
  diagnosis_started: "bg-cyan-50 text-cyan-700 border-cyan-200",
  technician_visited: "bg-teal-50 text-teal-700 border-teal-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

const paymentStyles: Record<string, string> = {
  pending: "border-yellow-200 bg-yellow-50 text-yellow-700",
  success: "border-green-200 bg-green-50 text-green-700",
  failed: "border-red-200 bg-red-50 text-red-700",
};

const columns: Column[] = [
  { key: "id", header: "ID", render: (r) => <span className="font-mono text-xs text-slate-500">#{String(r.id)}</span> },
  {
    key: "user", header: "Customer",
    render: (r) => {
      const u = r.user as { name?: string; mobile?: string } | null;
      return <div><p className="font-medium text-slate-900">{u?.name ?? "—"}</p>{u?.mobile && <p className="text-xs text-slate-400">{u.mobile}</p>}</div>;
    },
  },
  { key: "service", header: "Service", render: (r) => <span>{(r.service as { title?: string } | null)?.title ?? "—"}</span> },
  {
    key: "vehicle", header: "Vehicle",
    render: (r) => {
      const v = r.vehicle as { brand?: { name?: string }; model?: { name?: string } } | null;
      return <span>{v ? `${v.brand?.name ?? ""} ${v.model?.name ?? ""}`.trim() || "—" : "—"}</span>;
    },
  },
  { key: "service_center", header: "Service Center", render: (r) => <span>{(r.service_center as { name?: string } | null)?.name ?? "—"}</span> },
  { key: "issue", header: "Issue", render: (r) => <span className="max-w-[180px] truncate block">{String(r.issue || "—")}</span> },
  { key: "date", header: "Date", render: (r) => <span>{String(r.date || "—")}</span> },
  { key: "booking_price", header: "Price", render: (r) => r.booking_price ? <span>₹{r.booking_price}</span> : <span className="text-slate-400">—</span> },
  {
    key: "status", header: "Status",
    render: (r) => <Badge variant="outline" className={statusStyles[String(r.status)] ?? "border-slate-200"}>{String(r.status).replace(/_/g, " ")}</Badge>,
  },
  {
    key: "payment_status", header: "Payment",
    render: (r) => <Badge variant="outline" className={paymentStyles[String(r.payment_status)] ?? ""}>{String(r.payment_status)}</Badge>,
  },
  { key: "created_at", header: "Created", render: (r) => <span>{new Date(String(r.created_at)).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span> },
];

export function BookingsTable({ bookings }: { bookings: Record<string, unknown>[] }) {
  return <DataTable title="Booking Management" subtitle={`${bookings.length} total bookings from live system.`} rows={bookings} columns={columns} exportFilename="bookings" />;
}
