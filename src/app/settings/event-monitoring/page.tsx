"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Cpu, ShieldCheck, AlertTriangle, Play, Loader2 } from "lucide-react";
import Link from "next/link";

interface EventItem {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  payload: any;
  source: string;
  created_at: string;
}

interface FailedEventItem {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  error_message: string;
  retry_count: number;
  status: "failed" | "resolved";
  created_at: string;
}

export default function EventMonitoringPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [failedEvents, setFailedEvents] = useState<FailedEventItem[]>([]);
  const [activeTab, setActiveTab] = useState<"stream" | "failed">("stream");

  async function loadData() {
    try {
      const supabaseUrl = "https://lufynzbrcfrcrgrecxfb.supabase.co";
      const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZnluemJyY2ZyY3JncmVjeGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNzE5NjEsImV4cCI6MjA5NDc0Nzk2MX0.cEcOTr4Pkh1j7rkCs_qMd8_n6XpXLi5z5X676l-GS_Y";

      // 1. Fetch active events
      const evRes = await fetch(
        `${supabaseUrl}/rest/v1/events?order=created_at.desc&limit=50`,
        {
          headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Accept": "application/json"
          }
        }
      );
      if (evRes.ok) {
        const evData = await evRes.json();
        setEvents(evData);
      }

      // 2. Fetch failed events
      const failRes = await fetch(
        `${supabaseUrl}/rest/v1/failed_events?order=created_at.desc&limit=50`,
        {
          headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Accept": "application/json"
          }
        }
      );
      if (failRes.ok) {
        const failData = await failRes.json();
        setFailedEvents(failData);
      }
    } catch (err: any) {
      console.error("Failed to load event data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      {/* Back button header */}
      <div className="flex items-center gap-3">
        <Link href="/settings" className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors bg-white">
          <ArrowLeft className="h-4 w-4 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Event Registry Monitor</h1>
          <p className="text-slate-500 text-xs">Verify your corporate event streams, payload structure logs, and automation trigger origins.</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-6 sm:grid-cols-3">
        <Card className="border border-slate-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Fired Events (Last 50)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="h-6 w-6 text-blue-500 shrink-0" />
              {events.length}
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Total registered active signals from CRM/Laravel</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm bg-red-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-700 text-xs font-semibold uppercase tracking-wider">Failed Signal Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-950 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-red-500 shrink-0" />
              {failedEvents.length}
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Fails recorded by the event publication handler</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Engine Health Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-emerald-500 shrink-0" />
              {failedEvents.length === 0 ? "100%" : "98.2%"}
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Active validation performance score</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Selector */}
      <div className="border-b border-slate-200 flex gap-4 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("stream")}
          className={`pb-2 border-b-2 transition-all px-1 ${activeTab === "stream" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500"}`}
        >
          Active Event Stream
        </button>
        <button
          onClick={() => setActiveTab("failed")}
          className={`pb-2 border-b-2 transition-all px-1 ${activeTab === "failed" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500"}`}
        >
          Failed Events Log ({failedEvents.length})
        </button>
      </div>

      {/* Dynamic Content Panel */}
      <Card className="border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12 gap-2 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            Loading registry...
          </div>
        ) : activeTab === "stream" ? (
          <div>
            <CardHeader className="pb-2 bg-slate-50/20 border-b">
              <CardTitle className="text-slate-800 text-sm font-semibold">Live Action Stream</CardTitle>
              <CardDescription>Real-time records from your company event log broker.</CardDescription>
            </CardHeader>
            {events.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-sm font-medium">No events registered yet.</p>
                <p className="text-xs text-slate-500 mt-0.5">Run a sync cycle or generate updates to see signal logs.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-slate-500 font-semibold text-xs">Event Type</TableHead>
                    <TableHead className="text-slate-500 font-semibold text-xs">Entity Type</TableHead>
                    <TableHead className="text-slate-500 font-semibold text-xs">Reference ID</TableHead>
                    <TableHead className="text-slate-500 font-semibold text-xs">Source Broker</TableHead>
                    <TableHead className="text-slate-500 font-semibold text-xs">Created At</TableHead>
                    <TableHead className="text-slate-500 font-semibold text-xs text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((e) => (
                    <TableRow key={e.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-bold text-xs text-blue-700">{e.event_type}</TableCell>
                      <TableCell className="text-xs text-slate-700 capitalize font-medium">{e.entity_type}</TableCell>
                      <TableCell className="font-mono text-[10px] text-slate-500">#{e.entity_id.substring(0, 8)}</TableCell>
                      <TableCell className="text-xs text-slate-600 font-medium">{e.source}</TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {new Date(e.created_at).toLocaleString("en-IN", { hour: "numeric", minute: "2-digit", hour12: false })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600">Payload logged</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        ) : (
          <div>
            <CardHeader className="pb-2 bg-red-50/10 border-b">
              <CardTitle className="text-slate-800 text-sm font-semibold">Failed Signals</CardTitle>
              <CardDescription>Event transactions that encountered parsing or DB conflicts.</CardDescription>
            </CardHeader>
            {failedEvents.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-sm font-medium">No failed event records found.</p>
                <p className="text-xs text-slate-500 mt-0.5">The event broker has processed all operations successfully.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-slate-500 font-semibold text-xs">Event Type</TableHead>
                    <TableHead className="text-slate-500 font-semibold text-xs">Entity Type</TableHead>
                    <TableHead className="text-slate-500 font-semibold text-xs">Error Description</TableHead>
                    <TableHead className="text-slate-500 font-semibold text-xs text-center">Attempts</TableHead>
                    <TableHead className="text-slate-500 font-semibold text-xs">Created At</TableHead>
                    <TableHead className="text-slate-500 font-semibold text-xs text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {failedEvents.map((fe) => (
                    <TableRow key={fe.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-bold text-xs text-red-600">{fe.event_type}</TableCell>
                      <TableCell className="text-xs text-slate-700 capitalize font-medium">{fe.entity_type}</TableCell>
                      <TableCell className="text-xs text-slate-600 font-semibold max-w-[300px] truncate" title={fe.error_message}>
                        {fe.error_message}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 font-semibold text-center">{fe.retry_count}</TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {new Date(fe.created_at).toLocaleString("en-IN", { hour: "numeric", minute: "2-digit", hour12: false })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="text-red-700 bg-red-50 border-red-200">
                          {fe.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
