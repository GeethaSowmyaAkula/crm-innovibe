"use client";
import { DataTable, Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

const statusStyles: Record<string, string> = {
  success: "border-green-200 bg-green-50 text-green-700",
  failed: "border-red-200 bg-red-50 text-red-700",
  pending: "border-yellow-200 bg-yellow-50 text-yellow-700",
};

const columns: Column[] = [
  { key: "txnid", header: "Txn ID", render: (r) => <span className="font-mono text-xs text-slate-500">{String(r.txnid || "").slice(0, 18)}…</span> },
  {
    key: "user", header: "Customer",
    render: (r) => {
      const u = r.user as { name?: string; mobile?: string } | null;
      return <div><p className="font-medium text-slate-900">{u?.name ?? "—"}</p>{u?.mobile && <p className="text-xs text-slate-400">{u.mobile}</p>}</div>;
    },
  },
  { key: "amount", header: "Amount", render: (r) => <span className="font-semibold">₹{Number(r.amount).toLocaleString("en-IN")}</span> },
  { key: "payment_method", header: "Method", render: (r) => <span>{String(r.payment_method || "—")}</span> },
  { key: "reference", header: "Reference", render: (r) => <span className="text-slate-500">{String(r.reference || "—")}</span> },
  { key: "status", header: "Status", render: (r) => <Badge variant="outline" className={statusStyles[String(r.status)] ?? ""}>{String(r.status)}</Badge> },
  { key: "refunded", header: "Refunded", render: (r) => r.refunded ? <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">Yes</Badge> : <span className="text-slate-400">No</span> },
  { key: "created_at", header: "Date", render: (r) => <span>{new Date(String(r.created_at)).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span> },
];

export function TransactionsTable({ transactions, totalRevenue }: { transactions: Record<string, unknown>[], totalRevenue: number }) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
        <p className="text-green-700 font-medium text-sm">Total Revenue (Successful Transactions)</p>
        <p className="text-2xl font-bold text-green-700">₹{totalRevenue.toLocaleString("en-IN")}</p>
      </div>
      <DataTable title="Transactions" subtitle={`${transactions.length} payment records from live system.`} rows={transactions} columns={columns} exportFilename="transactions" />
    </div>
  );
}
