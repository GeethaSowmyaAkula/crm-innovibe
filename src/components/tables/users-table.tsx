"use client";

import { DataTable, Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

const statusStyles: Record<string, string> = {
  active: "border-green-200 bg-green-50 text-green-700",
  initial: "border-orange-200 bg-orange-50 text-orange-700",
  inactive: "border-red-200 bg-red-50 text-red-700",
};

const columns: Column[] = [
  {
    key: "name", header: "Name",
    render: (r) => <span className="font-medium text-slate-900">{String(r.name || "—")}</span>,
  },
  {
    key: "mobile", header: "Mobile",
    render: (r) => <span>+{r.country_code} {r.mobile}</span>,
  },
  {
    key: "gender", header: "Gender",
    render: (r) => <span className="capitalize">{String(r.gender || "—")}</span>,
  },
  {
    key: "dob", header: "Date of Birth",
    render: (r) => <span>{String(r.dob || "—")}</span>,
  },
  {
    key: "profession", header: "Profession",
    render: (r) => <span>{String(r.profession || "—")}</span>,
  },
  {
    key: "wallet_balance", header: "Wallet",
    render: (r) => <span>₹{r.wallet_balance}</span>,
  },
  {
    key: "created_at", header: "Register at",
    render: (r) => <span>{new Date(String(r.created_at)).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>,
  },
  {
    key: "status", header: "Status",
    render: (r) => (
      <Badge variant="outline" className={statusStyles[String(r.status)] ?? ""}>
        {String(r.status).charAt(0).toUpperCase() + String(r.status).slice(1)}
      </Badge>
    ),
  },
];

export function UsersTable({ users }: { users: Record<string, unknown>[] }) {
  return (
    <DataTable
      title="Users List"
      subtitle="Manage your users and their details here."
      rows={users}
      columns={columns}
      exportFilename="users"
    />
  );
}
