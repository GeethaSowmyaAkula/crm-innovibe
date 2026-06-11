import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Target, TrendingUp, Lightbulb, Zap, Plus, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function StrategyCenterPage() {
  const supabase = await createClient();

  const { data: dbOpps } = await supabase
    .from("strategy_opportunities")
    .select("*")
    .order("impact_score", { ascending: false });

  const opportunities = (dbOpps && dbOpps.length > 0) ? dbOpps : [
    {
      id: "o1",
      title: "Pune B2B Fleet Expansion",
      description: "Acquire three local logistics partners for corporate home service contracts.",
      category: "fleet",
      impact_score: 9,
      effort_score: 4,
      status: "in_progress"
    },
    {
      id: "o2",
      title: "Automated AMC Upsell Pipeline",
      description: "Trigger WhatsApp AMC offers instantly to all out-of-warranty customers after booking completion.",
      category: "amc",
      impact_score: 8,
      effort_score: 2,
      status: "open"
    },
    {
      id: "o3",
      title: "Diagnostic Telemetry Integration",
      description: "Auto-trigger inspection bookings when motor or battery temperatures exceed safety thresholds.",
      category: "risk_mitigation",
      impact_score: 9,
      effort_score: 5,
      status: "open"
    },
    {
      id: "o4",
      title: "Bengaluru Service Capacity Expansion",
      description: "Launch secondary mobile technician hubs in Bengaluru East to resolve scheduling backlogs.",
      category: "expansion",
      impact_score: 7,
      effort_score: 6,
      status: "in_progress"
    }
  ];

  const categoryBadgeMap: Record<string, string> = {
    revenue: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amc: "bg-blue-50 text-blue-700 border-blue-200",
    expansion: "bg-purple-50 text-purple-700 border-purple-200",
    fleet: "bg-indigo-50 text-indigo-700 border-indigo-200",
    partnership: "bg-cyan-50 text-cyan-700 border-cyan-200",
    risk_mitigation: "bg-rose-50 text-rose-700 border-rose-200",
    customer_growth: "bg-amber-50 text-amber-700 border-amber-200",
    operational_bottleneck: "bg-orange-50 text-orange-700 border-orange-200"
  };

  const statusBadgeMap: Record<string, string> = {
    open: "bg-slate-50 text-slate-700 border-slate-200",
    in_progress: "bg-amber-50 text-amber-700 border-amber-200 animate-pulse",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    archived: "bg-slate-100 text-slate-400 border-slate-200"
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Strategy Center</h1>
        <p className="text-slate-500 text-sm">Analyze strategic initiatives, evaluate business impact scoring, and orchestrate board growth goals.</p>
      </div>

      {/* High-Level Focus Card */}
      <Card className="border border-slate-100 shadow-sm relative overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-950 text-white">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-blue-500/10 blur-2xl" />
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <Badge className="bg-blue-500/20 text-blue-200 border-blue-400/30 hover:bg-blue-500/30 text-xs">Strategic Priority</Badge>
            <h2 className="text-2xl font-bold">Maximize AMC Revenue &amp; Telemetry Integration</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              For Q2 2026, the executive goal is converting 60% of all synced vehicles to AMC plans, backed by live failure prediction alerts to reduce customer churn.
            </p>
          </div>
          <Link 
            href="/settings"
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 shrink-0"
          >
            Adjust Target Weights
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>

      {/* Metrics and Initiatives Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Side: Growth Strategy Matrix */}
        <Card className="border border-slate-100 shadow-sm md:col-span-2 overflow-hidden flex flex-col">
          <CardHeader className="pb-3 border-b border-slate-50">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-slate-800 text-sm font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  Growth Initiatives Board
                </CardTitle>
                <CardDescription>Opportunity evaluation based on business impact and execution effort.</CardDescription>
              </div>
              <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none text-[10px]">Matrix Evaluation</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="w-[220px]">Opportunity</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Impact (1-10)</TableHead>
                  <TableHead className="text-center">Effort (1-10)</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opportunities.map((opp: any) => (
                  <TableRow key={opp.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell>
                      <div className="font-bold text-xs text-slate-800">{opp.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{opp.description}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[9px] uppercase font-semibold ${categoryBadgeMap[opp.category] || ""}`}>
                        {opp.category?.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-bold text-slate-900 text-xs">{opp.impact_score}/10</TableCell>
                    <TableCell className="text-center font-bold text-slate-500 text-xs">{opp.effort_score}/10</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className={`text-[9px] uppercase font-semibold ${statusBadgeMap[opp.status] || ""}`}>
                        {opp.status?.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Right Side: Strategy Simulation Stats */}
        <div className="space-y-6">
          <Card className="border border-slate-100 shadow-sm bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-800 text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Strategic Scorecard
              </CardTitle>
              <CardDescription>KPI targets and progress towards Q2 milestone.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "B2B Fleet Expansion", progress: 80, val: "8/10 Clients", target: "10 Clients" },
                { label: "Automation Rule Coverage", progress: 88, val: "88 Rules Executed", target: "100%" },
                { label: "Predictive Health Accuracy", progress: 96, val: "96.4% Correct", target: "98% Target" },
              ].map((kpi, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{kpi.label}</span>
                    <span className="text-slate-500">{kpi.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${kpi.progress}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Current: {kpi.val}</span>
                    <span>Target: {kpi.target}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-slate-100 shadow-sm bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-800 text-sm font-semibold flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Strategic Advisories
              </CardTitle>
              <CardDescription>Autonomous strategic alerts generated from system behavior.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-xl border border-rose-100 bg-rose-50/50 flex gap-2.5 items-start">
                <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Preventive backlogs at Bangalore</h4>
                  <p className="text-[10px] text-slate-600 mt-0.5 leading-relaxed">Bookings outpace Bangalore center capacity by 14% this week. Assign a secondary hub immediately.</p>
                </div>
              </div>
              <div className="p-3 rounded-xl border border-blue-100 bg-blue-50/50 flex gap-2.5 items-start">
                <ShieldCheck className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">AMC Renewal Opportunity</h4>
                  <p className="text-[10px] text-slate-600 mt-0.5 leading-relaxed">12 Pune fleet vehicles are without service coverage. Potential revenue lift of $2,880/month.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
