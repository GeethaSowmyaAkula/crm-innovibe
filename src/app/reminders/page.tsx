import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Bell, CheckCircle2, Clock, Zap, Send } from "lucide-react";

export const dynamic = "force-dynamic";

// ── Status badge styles ────────────────────────────────────────────────────────
const statusConfig: Record<string, string> = {
  pending:       "border-yellow-200 bg-yellow-50 text-yellow-700",
  ready_to_send: "border-blue-200 bg-blue-50 text-blue-700",
  sent:          "border-green-200 bg-green-50 text-green-700",
  failed:        "border-red-200 bg-red-50 text-red-700",
};

const automationConfig: Record<string, { cls: string; label: string }> = {
  waiting:       { cls: "border-slate-200 bg-slate-50 text-slate-600",     label: "Waiting" },
  picked_by_n8n: { cls: "border-purple-200 bg-purple-50 text-purple-700",  label: "Picked by n8n" },
  completed:     { cls: "border-green-200 bg-green-50 text-green-700",     label: "Completed" },
};

function AutomationBadge({ status }: { status: string | null }) {
  const cfg = automationConfig[status ?? "waiting"] ?? automationConfig.waiting;
  const Icon = status === "picked_by_n8n" ? Zap : status === "completed" ? CheckCircle2 : Clock;
  return (
    <Badge variant="outline" className={`flex items-center gap-1 w-fit ${cfg.cls}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

export default async function RemindersPage() {
  const supabase = await createClient();
  const { data: reminders, error } = await supabase
    .from("reminder_queue")
    .select("*")
    .order("due_at", { ascending: true });

  const pending      = reminders?.filter((r: any) => r.status === "pending").length ?? 0;
  const readyToSend  = reminders?.filter((r: any) => r.status === "ready_to_send").length ?? 0;
  const sent         = reminders?.filter((r: any) => r.status === "sent").length ?? 0;
  const automatedToday = reminders?.filter((r: any) => {
    if (r.automation_status !== "completed") return false;
    const u = r.updated_at ? new Date(r.updated_at) : null;
    if (!u) return false;
    const today = new Date();
    return (
      u.getFullYear() === today.getFullYear() &&
      u.getMonth() === today.getMonth() &&
      u.getDate() === today.getDate()
    );
  }).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reminder Queue</h1>
          <p className="text-slate-500">Automation-driven service follow-up reminders.</p>
        </div>
        <div className="flex items-center gap-2">
          <form action="/api/sync-reminders" method="post">
            <button
              type="submit"
              className="flex items-center gap-2 border border-slate-300 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-50 transition-colors text-sm"
            >
              <Zap className="h-4 w-4 text-purple-500" />
              Sync Bookings
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          Error: {error.message}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-sm font-medium text-slate-600">Pending</span>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-yellow-600">{pending}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-sm font-medium text-slate-600">Ready to Send</span>
            <Send className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-600">{readyToSend}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-sm font-medium text-slate-600">Sent</span>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{sent}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-sm font-medium text-slate-600">Automated Today</span>
            <Bell className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-purple-600">{automatedToday}</div></CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader className="py-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input type="search" placeholder="Search reminders..." className="pl-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Due At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Automation</TableHead>
                <TableHead className="text-slate-500 text-xs">Booking ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reminders && reminders.length > 0 ? (
                reminders.map((r: any) => (
                  <TableRow key={r.id}>
                    {/* Customer */}
                    <TableCell className="font-medium text-slate-900">
                      <div>{r.customer_name ?? "—"}</div>
                      {r.customer_phone && (
                        <div className="text-xs text-slate-400">{r.customer_phone}</div>
                      )}
                    </TableCell>

                    {/* Vehicle */}
                    <TableCell className="text-slate-600 text-sm">
                      {r.vehicle_name ?? "—"}
                    </TableCell>

                    {/* Service */}
                    <TableCell>
                      <Badge variant="outline" className="text-slate-600 text-xs">
                        {r.service_type ?? r.reminder_type ?? "—"}
                      </Badge>
                    </TableCell>

                    {/* Trigger type */}
                    <TableCell>
                      <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700 text-xs">
                        {(r.trigger_type ?? "service_followup").replace(/_/g, " ")}
                      </Badge>
                    </TableCell>

                    {/* Due At */}
                    <TableCell className="text-slate-500 text-sm whitespace-nowrap">
                      {r.due_at
                        ? new Date(r.due_at).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : r.scheduled_at
                        ? new Date(r.scheduled_at).toLocaleDateString("en-IN")
                        : "—"}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusConfig[r.status ?? r.sent_status ?? "pending"] ?? ""}
                      >
                        {(r.status ?? r.sent_status ?? "pending")
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (c: string) => c.toUpperCase())}
                      </Badge>
                    </TableCell>

                    {/* Automation Status */}
                    <TableCell>
                      <AutomationBadge status={r.automation_status} />
                    </TableCell>

                    {/* Booking ID */}
                    <TableCell className="text-xs text-slate-400 font-mono">
                      {r.booking_id ? `#${r.booking_id}` : "—"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                    No reminders in queue. Click <strong>Sync Bookings</strong> to detect completed bookings.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
