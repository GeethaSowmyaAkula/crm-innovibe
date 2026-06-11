import { getBookings, LaravelBooking } from "@/lib/laravel/api";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

// Service History = all bookings that have reached a completed/visited/in-progress state
const HISTORY_STATUSES = ["completed", "technician_visited", "diagnosis_started", "in_progress"];

const statusStyles: Record<string, string> = {
  completed: "bg-green-50 text-green-700 border-green-200",
  technician_visited: "bg-teal-50 text-teal-700 border-teal-200",
  diagnosis_started: "bg-cyan-50 text-cyan-700 border-cyan-200",
  in_progress: "bg-orange-50 text-orange-700 border-orange-200",
};

const columns = [
  {
    key: "id", header: "Booking ID",
    render: (r: Record<string, unknown>) => (
      <span className="font-mono text-xs font-semibold text-slate-700">#{String(r.id)}</span>
    ),
  },
  {
    key: "user", header: "Customer",
    render: (r: Record<string, unknown>) => {
      const u = r.user as { name?: string; mobile?: string } | null;
      return (
        <div>
          <p className="font-medium text-slate-900 text-sm">{u?.name ?? "—"}</p>
          {u?.mobile && <p className="text-xs text-slate-400">{u.mobile}</p>}
        </div>
      );
    },
  },
  {
    key: "vehicle", header: "Vehicle",
    render: (r: Record<string, unknown>) => {
      const v = r.vehicle as { registration_number?: string; brand?: { name?: string }; model?: { name?: string } } | null;
      if (!v) return <span className="text-slate-400">—</span>;
      return (
        <div>
          <p className="text-sm text-slate-900">{[v.brand?.name, v.model?.name].filter(Boolean).join(" ") || "—"}</p>
          {v.registration_number && <p className="text-xs text-slate-400 font-mono">{v.registration_number}</p>}
        </div>
      );
    },
  },
  {
    key: "service", header: "Service",
    render: (r: Record<string, unknown>) => (
      <span>{(r.service as { title?: string } | null)?.title ?? "—"}</span>
    ),
  },
  {
    key: "service_center", header: "Service Center",
    render: (r: Record<string, unknown>) => (
      <span>{(r.service_center as { name?: string } | null)?.name ?? "—"}</span>
    ),
  },
  {
    key: "issue", header: "Issue Reported",
    render: (r: Record<string, unknown>) => (
      <span className="max-w-[200px] truncate block text-slate-600 text-sm">{String(r.issue || "—")}</span>
    ),
  },
  {
    key: "booking_price", header: "Cost",
    render: (r: Record<string, unknown>) => r.booking_price
      ? <span className="font-semibold text-slate-900">₹{Number(r.booking_price).toLocaleString("en-IN")}</span>
      : <span className="text-slate-400">—</span>,
  },
  {
    key: "date", header: "Service Date",
    render: (r: Record<string, unknown>) => <span>{String(r.date || "—")}</span>,
  },
  {
    key: "status", header: "Status",
    render: (r: Record<string, unknown>) => (
      <Badge variant="outline" className={statusStyles[String(r.status)] ?? "border-slate-200 text-slate-600"}>
        {String(r.status).replace(/_/g, " ")}
      </Badge>
    ),
  },
];

export default async function ServiceHistoryPage() {
  const allBookings: LaravelBooking[] = await getBookings().catch(() => []);
  const historyBookings = allBookings.filter(b => HISTORY_STATUSES.includes(b.status));
  const completedCount = allBookings.filter(b => b.status === "completed").length;

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Completed", count: allBookings.filter(b => b.status === "completed").length, color: "bg-green-50 text-green-700 border-green-200" },
          { label: "In Progress", count: allBookings.filter(b => b.status === "in_progress").length, color: "bg-orange-50 text-orange-700 border-orange-200" },
          { label: "Technician Visited", count: allBookings.filter(b => b.status === "technician_visited").length, color: "bg-teal-50 text-teal-700 border-teal-200" },
          { label: "Diagnosis Started", count: allBookings.filter(b => b.status === "diagnosis_started").length, color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
        ].map(s => (
          <div key={s.label} className={`border rounded-lg px-4 py-3 ${s.color}`}>
            <p className="text-xs font-medium opacity-80">{s.label}</p>
            <p className="text-2xl font-bold">{s.count}</p>
          </div>
        ))}
      </div>

      <DataTable
        title="Service History"
        subtitle={`${historyBookings.length} service records with active/completed status — live data from production.`}
        rows={historyBookings as unknown as Record<string, unknown>[]}
        columns={columns}
        exportFilename="service-history"
      />
    </div>
  );
}
