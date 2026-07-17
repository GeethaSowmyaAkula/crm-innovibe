import { createClient } from "@/lib/supabase/server";
import { getCompanyHealthScore } from "@/lib/health";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, Award, BellRing, Briefcase, 
  TrendingUp, Zap, Clock, ShieldCheck, 
  ChevronRight, Play, CheckCircle2, AlertTriangle, 
  Cpu, Users, ShieldAlert, FileText, CheckSquare, Plus,
  Sparkles, Terminal, Calendar, MessageSquare, BookOpen, Settings,
  ArrowUpRight, ArrowDownRight, Compass, Shield, Layers
} from "lucide-react";
import Link from "next/link";
import { DecisionInbox, type Recommendation } from "@/components/dashboard/decision-inbox";
import { getOrCreateExecutiveBriefing } from "@/lib/briefing";
import { getDynamicKPIs } from "@/lib/kpi";
import { getTransactions, getBookings } from "@/lib/laravel/api";
import { CommandPalette } from "@/components/dashboard/command-palette";
import { CockpitTabs } from "@/components/dashboard/cockpit-tabs";
import { BriefingCard } from "@/components/dashboard/briefing-card";
import { ContextEngine } from "@/lib/context-engine";

export const dynamic = "force-dynamic";

export default async function CEOCockpitPage() {
  const supabase = await createClient();

  // ─── STEP 1: PARALLEL RAW FETCH ───────────────────────────────────────────
  const [
    rawTransactions,
    rawBookings,
    healthReport,
    goalsDbRes,
    alertsRes,
    feedRes,
    recsRes,
    tasksRes,
    oppsRes,
    notesRes,
    boardRes,
    strategyRes,
    snapshotsRes,
    templatesRes,
    failedSyncsRes,
    failedEventsRes,
    orphanCustomersRes,
    orphanVehiclesRes,
    decisionOutcomesRes,
    campaignOutcomesRes,
    automationOutcomesRes,
  ] = await Promise.all([
    getTransactions().catch(() => [] as any[]),
    getBookings().catch(() => [] as any[]),
    getCompanyHealthScore(),
    supabase.from("goals").select("*, okr_cycles(name)").limit(5),
    supabase.from("device_alerts").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(4),
    supabase.from("activity_feed").select("*").order("created_at", { ascending: false }).limit(5),
    supabase.from("decision_recommendations").select("*").eq("status", "pending").limit(3),
    supabase.from("tasks").select("*").order("created_at", { ascending: false }).limit(4),
    supabase.from("strategy_opportunities").select("*").order("priority_score", { ascending: false }),
    supabase.from("executive_notes").select("*").order("created_at", { ascending: false }),
    supabase.from("board_decisions").select("*").order("created_at", { ascending: false }),
    supabase.from("strategic_decisions").select("*").order("created_at", { ascending: false }),
    supabase.from("report_snapshots").select("*, report_templates(name, category)").order("created_at", { ascending: false }),
    supabase.from("report_templates").select("*"),
    supabase.from("failed_sync_records").select("*").eq("status", "failed").order("created_at", { ascending: false }),
    supabase.from("failed_events").select("*").eq("status", "failed").order("created_at", { ascending: false }),
    supabase.from("customers").select("id", { count: "exact", head: true }).like("full_name", "%Orphan%"),
    supabase.from("vehicles").select("id", { count: "exact", head: true }).like("registration_number", "%ORPHAN%"),
    supabase.from("decision_outcomes").select("*, decision_recommendations(title)").order("created_at", { ascending: false }),
    supabase.from("campaign_outcomes").select("*").order("created_at", { ascending: false }),
    supabase.from("automation_outcomes").select("*, automation_executions(automation_rules(name))").order("created_at", { ascending: false }),
  ]);

  const goals = goalsDbRes.data || [];
  const alerts = alertsRes.data || [];
  const timeline = feedRes.data || [];
  const baseRecommendations = recsRes.data || [];
  const tasks = tasksRes.data || [];
  const opportunities = oppsRes.data || [];
  const notes = notesRes.data || [];
  const boardDecisions = boardRes.data || [];
  const strategicDecisions = strategyRes.data || [];
  const snapshots = snapshotsRes.data || [];
  const templates = templatesRes.data || [];
  const failedSyncsList = failedSyncsRes.data || [];
  const failedEventsList = failedEventsRes.data || [];
  const placeholderCount = ((orphanCustomersRes as any).count || 0) + ((orphanVehiclesRes as any).count || 0);
  const rawDecisionOutcomes = decisionOutcomesRes.data || [];
  const rawCampaignOutcomes = campaignOutcomesRes.data || [];
  const rawAutomationOutcomes = automationOutcomesRes.data || [];

  const outcomes = {
    decisionOutcomes: rawDecisionOutcomes,
    campaignOutcomes: rawCampaignOutcomes,
    automationOutcomes: rawAutomationOutcomes,
  };

  // ─── STEP 2: PARALLEL DERIVED COMPUTATIONS ────────────────────────────────
  const { getRelationshipInsights } = await import("@/lib/relationship-engine");
  const { applyRecommendationLearning } = await import("@/lib/recommendation-learning");

  const [dailyBrief, weeklyBrief, monthlyBrief, kpis, relationshipInsights, recommendations] =
    await Promise.all([
      getOrCreateExecutiveBriefing("daily", rawTransactions, rawBookings).catch(() => ({
        summary: "CEO Daily Briefing compiling...",
        revenue_summary: "Calculating revenue aggregates...",
        booking_summary: "Calculating booking details...",
        complaint_summary: "Unresolved complaints pending...",
        goal_summary: "Targets details...",
        alerts_summary: "System alerts details...",
        opps_summary: "Strategic opportunities details...",
      })),
      getOrCreateExecutiveBriefing("weekly", rawTransactions, rawBookings).catch(() => ({
        summary: "CEO Weekly Briefing compiling...",
        revenue_summary: "Calculating weekly revenue aggregates...",
        booking_summary: "Calculating weekly booking details...",
        complaint_summary: "Unresolved complaints pending...",
        goal_summary: "Targets details...",
        alerts_summary: "System alerts details...",
        opps_summary: "Strategic opportunities details...",
      })),
      getOrCreateExecutiveBriefing("monthly", rawTransactions, rawBookings).catch(() => ({
        summary: "CEO Monthly Briefing compiling...",
        revenue_summary: "Calculating monthly revenue aggregates...",
        booking_summary: "Calculating monthly booking details...",
        complaint_summary: "Unresolved complaints pending...",
        goal_summary: "Targets details...",
        alerts_summary: "System alerts details...",
        opps_summary: "Strategic opportunities details...",
      })),
      getDynamicKPIs(rawTransactions),
      getRelationshipInsights(rawTransactions, rawBookings),
      applyRecommendationLearning(
        baseRecommendations,
        rawDecisionOutcomes,
        rawCampaignOutcomes,
        rawAutomationOutcomes
      ) as Promise<Recommendation[]>,
    ]);

  const revenueKpi = kpis.find(k => k.name === "Monthly Revenue")?.current_value || 14820;

  // Icon mapping for metrics breakdown cards
  const metricIconMap: Record<string, any> = {
    revenue: TrendingUp,
    operations: Activity,
    automation: Zap,
    customer: Users,
    growth: Award,
    hardware: ShieldCheck
  };

  const healthBorderMap: Record<string, string> = {
    optimal: "border-l-[5px] border-l-emerald-500",
    warning: "border-l-[5px] border-l-amber-500",
    critical: "border-l-[5px] border-l-rose-500"
  };

  const alertCardMap: Record<string, string> = {
    critical: "border-l-4 border-l-rose-500 bg-rose-50/20",
    warning: "border-l-4 border-l-amber-500 bg-amber-50/20",
    opportunity: "border-l-4 border-l-indigo-500 bg-indigo-50/20",
    info: "border-l-4 border-l-blue-500 bg-blue-50/20"
  };

  const alertBadgeMap: Record<string, string> = {
    critical: "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100",
    warning: "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100",
    opportunity: "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100",
    info: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
  };

  const overviewTabMarkup = (
    <div className="space-y-6">
      {/* SECTION 1: COMPANY HEALTH & STATS */}
      <div className="grid gap-6 md:grid-cols-4">
        {/* Overall Score Card */}
        <Card className="md:col-span-1 border border-slate-200/80 shadow-md relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-blue-500/20 blur-xl animate-pulse" />
          <CardHeader className="pb-1 pt-6 px-6">
            <CardTitle className="text-slate-400 text-[10px] font-extrabold tracking-wider uppercase">Company Health Index</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="relative flex items-center justify-center">
              <svg className="w-28 h-28 transform -rotate-90">
                <circle cx="56" cy="56" r="46" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                <circle cx="56" cy="56" r="46" stroke="#2563EB" strokeWidth="8" fill="transparent"
                  strokeDasharray={2 * Math.PI * 46}
                  strokeDashoffset={2 * Math.PI * 46 * (1 - healthReport.overall / 100)} 
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  style={{ filter: "drop-shadow(0 0 6px rgba(37, 99, 235, 0.6))" }}
                />
              </svg>
              <div className="absolute text-3xl font-extrabold font-heading tracking-tight">{healthReport.overall}%</div>
            </div>
            <p className="text-[11px] text-slate-300 mt-4 text-center px-4 leading-normal">Operational telemetry synthesized dynamically from 6 corporate metrics.</p>
          </CardContent>
        </Card>

        {/* Metrics Breakdown Grid */}
        <div className="md:col-span-3 grid gap-4 sm:grid-cols-3">
          {Object.entries(healthReport.breakdown).map(([key, metric]) => {
            const IconComponent = metricIconMap[key] || Activity;
            const borderStyle = healthBorderMap[metric.status] || "border-l-[5px] border-l-slate-400";
            return (
              <Card key={key} className={`border border-slate-200/60 shadow-sm overflow-hidden bg-white hover:border-slate-300/80 transition-all duration-200 rounded-xl ${borderStyle} flex flex-col justify-between`}>
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{metric.display_name}</span>
                    <Badge variant="outline" className={`text-[9px] font-bold uppercase tracking-wider ${metric.status === "optimal" ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-amber-700 bg-amber-50 border-amber-200"}`}>
                      {metric.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-1 flex flex-col justify-end">
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 shrink-0">
                      <IconComponent className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{metric.score}%</span>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Score</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full" style={{ width: `${metric.score}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2.5 flex justify-between font-medium">
                    <span>Cur: <span className="font-semibold text-slate-700">{key === "revenue" ? `₹${revenueKpi.toLocaleString("en-IN")}` : metric.current}</span></span>
                    <span>Tgt: <span className="font-semibold text-slate-700">{key === "revenue" ? `₹${metric.target.toLocaleString("en-IN")}` : metric.target}</span></span>
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: GOALS & OKRs */}
      <Card className="border border-slate-200/80 shadow-md rounded-2xl">
        <CardHeader className="pb-3 pt-5 px-6 border-b border-slate-100 bg-slate-50/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-slate-900 text-sm font-bold flex items-center gap-2 font-heading">
                <Award className="h-4.5 w-4.5 text-amber-500" />
                Goals &amp; OKR Center
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs mt-0.5">Strategic targets progression for cycles under management.</CardDescription>
            </div>
            <Badge className="bg-blue-50 text-blue-700 border border-blue-100 font-bold text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full">Q2 2026</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4 sm:grid-cols-5">
            {goals.length === 0 ? (
              <div className="col-span-5 flex flex-col items-center justify-center py-6 text-center">
                <Award className="h-10 w-10 text-slate-350 mb-2" />
                <h4 className="text-xs font-bold text-slate-700">No active goals</h4>
                <p className="text-[11px] text-slate-400">Define strategic milestones in the target center.</p>
              </div>
            ) : (
              goals.map((g: any) => {
                const currentVal = g.category === "revenue" ? revenueKpi : g.current_value;
                const completion = Math.round((currentVal / g.target_value) * 100);
                return (
                  <div key={g.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/20 hover:bg-slate-50/50 transition-all duration-200 hover:shadow-sm">
                    <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">{g.okr_cycles?.name || "Corporate target"}</span>
                    <h4 className="font-bold text-slate-800 text-[12px] truncate mt-1 leading-tight">{g.title}</h4>
                    
                    <div className="flex items-baseline justify-between mt-4">
                      <span className="text-xl font-extrabold text-slate-900 leading-none">{completion}%</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Progress</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full" style={{ width: `${Math.min(100, completion)}%` }} />
                    </div>
                    <div className="flex flex-col gap-0.5 text-[10px] text-slate-500 mt-3 font-medium border-t border-slate-100/50 pt-2">
                      <div className="flex justify-between">
                        <span>Actual:</span>
                        <span className="text-slate-700 font-bold">{g.category === "revenue" ? `₹${revenueKpi.toLocaleString("en-IN")}` : currentVal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Goal:</span>
                        <span className="text-slate-700 font-semibold">{g.category === "revenue" ? `₹${g.target_value.toLocaleString("en-IN")}` : g.target_value}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* MID-GRID: DECISION INBOX & CRITICAL ALERTS */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* SECTION 6: DECISION ENGINE PANEL */}
        <Card className="border border-slate-200/80 shadow-md flex flex-col h-[460px] rounded-2xl">
          <CardHeader className="pb-3 pt-5 px-6 border-b border-slate-100 bg-slate-50/30 shrink-0">
            <div className="flex justify-between items-start gap-4">
              <div>
                <CardTitle className="text-slate-900 text-sm font-bold flex items-center gap-2 font-heading">
                  <Cpu className="h-4.5 w-4.5 text-indigo-600 animate-pulse" />
                  Decision Inbox
                </CardTitle>
                <CardDescription className="text-slate-500 text-xs mt-0.5">Approve or flag machine learning recommendation vectors.</CardDescription>
              </div>
              <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold text-[9px] tracking-wider uppercase px-2 py-0.5 shrink-0 rounded-full">AI Pipeline</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-6">
            <DecisionInbox initialRecommendations={recommendations} />
          </CardContent>
        </Card>

        {/* SECTION 3: EXECUTIVE ALERT CENTER */}
        <Card className="border border-slate-200/80 shadow-md flex flex-col h-[460px] rounded-2xl">
          <CardHeader className="pb-3 pt-5 px-6 border-b border-slate-100 bg-slate-50/30 shrink-0">
            <div className="flex justify-between items-start gap-4">
              <div>
                <CardTitle className="text-slate-900 text-sm font-bold flex items-center gap-2 font-heading">
                  <ShieldAlert className="h-4.5 w-4.5 text-rose-500 animate-bounce" />
                  Executive Alert Center
                </CardTitle>
                <CardDescription className="text-slate-500 text-xs mt-0.5">Critical exceptions requiring executive sign-off.</CardDescription>
              </div>
              <Badge className="bg-rose-50 text-rose-700 border border-rose-100 font-bold text-[9px] tracking-wider uppercase px-2 py-0.5 shrink-0 rounded-full">Real-Time</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-4 p-6">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                <ShieldCheck className="h-10 w-10 text-emerald-500 mb-2 animate-pulse" />
                <h4 className="text-xs font-bold text-slate-700">No anomalies detected</h4>
                <p className="text-[11px] text-slate-400">All gateway connections and databases report healthy status.</p>
              </div>
            ) : (
              alerts.map((alert: any) => {
                const alertCtx = ContextEngine.getAlertContext(alert.alert_type, alert.description, alert.severity);
                const cardStyle = alertCardMap[alert.severity] || "border border-slate-150 bg-slate-50/50";
                return (
                  <div 
                    key={alert.id} 
                    className={`p-4 border border-slate-150/70 rounded-xl flex flex-col gap-3 shadow-sm hover:shadow transition-all duration-200 ${cardStyle}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {alert.severity === "critical" && <AlertTriangle className="h-4.5 w-4.5 text-rose-500" />}
                        {alert.severity === "warning" && <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />}
                        {alert.severity === "opportunity" && <Zap className="h-4.5 w-4.5 text-indigo-500" />}
                        {alert.severity === "info" && <CheckCircle2 className="h-4.5 w-4.5 text-blue-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {alert.severity === "critical" && (
                              <span className="crm-pulse-dot-red" />
                            )}
                            <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wide truncate">{alert.alert_type}</span>
                          </div>
                          <Badge variant="outline" className={`text-[9px] uppercase border font-bold ${alertBadgeMap[alert.severity] || ""}`}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-[12px] text-slate-700 mt-1.5 leading-normal font-medium">{alert.description}</p>
                      </div>
                    </div>
                    
                    {/* Context Engine diagnostics block */}
                    <div className="text-[10px] text-slate-600 bg-white/70 backdrop-blur-sm p-3 rounded-lg border border-slate-200/50 space-y-1.5 font-medium">
                      <div><span className="font-bold text-slate-800">Root Cause:</span> {alertCtx.rootCause}</div>
                      <div><span className="font-bold text-slate-800">Impact:</span> {alertCtx.impact}</div>
                      <div className="flex items-center gap-1"><span className="font-bold text-slate-800">Action Plan:</span> <span className="text-blue-700 font-bold">{alertCtx.suggestedAction}</span></div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* LOWER-GRID: TIMELINE, TASK CENTER, QUICK ACTIONS */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* SECTION 4: REAL-TIME COMPANY TIMELINE */}
        <Card className="border border-slate-200/80 shadow-md md:col-span-1 rounded-2xl">
          <CardHeader className="pb-3 pt-5 px-6 border-b border-slate-100 bg-slate-50/30">
            <CardTitle className="text-slate-900 text-sm font-bold flex items-center gap-2 font-heading">
              <Clock className="h-4.5 w-4.5 text-blue-500 animate-spin-slow" />
              Real-Time Timeline
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs mt-0.5">Live operational events ledger.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="relative border-l border-slate-100 pl-4 space-y-5 ml-1.5 h-[190px] overflow-y-auto">
              {timeline.length === 0 ? (
                <p className="text-center text-slate-400 py-12 text-xs">No recent events logged.</p>
              ) : (
                timeline.map((feed: any, index: number) => (
                  <div key={feed.id || index} className="relative group/time">
                    <div className="absolute -left-[21.5px] top-1.5 h-2.5 w-2.5 rounded-full border border-white bg-blue-600 shadow-sm transition-transform duration-200 group-hover/time:scale-125" />
                    <p className="text-[12px] text-slate-700 leading-normal font-medium">{feed.description}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* SECTION 7: TASKS & APPROVALS */}
        <Card className="border border-slate-200/80 shadow-md md:col-span-1 rounded-2xl">
          <CardHeader className="pb-3 pt-5 px-6 border-b border-slate-100 bg-slate-50/30">
            <CardTitle className="text-slate-900 text-sm font-bold flex items-center gap-2 font-heading">
              <CheckSquare className="h-4.5 w-4.5 text-emerald-500" />
              Approvals &amp; Tasks
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs mt-0.5">Actionable board cards needing signoff.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex flex-col justify-between h-[230px]">
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {tasks.length === 0 ? (
                <p className="text-center text-slate-400 py-12 text-xs">No outstanding approvals.</p>
              ) : (
                tasks.map((task: any) => (
                  <div 
                    key={task.id} 
                    className="p-3 border border-slate-150/60 rounded-xl bg-white hover:bg-slate-50/50 hover:shadow-sm transition-all duration-200 flex justify-between items-center gap-3 border-l-4 border-l-slate-300"
                  >
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-slate-800 truncate">{task.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{task.description}</p>
                    </div>
                    <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-extrabold border-slate-200 px-2 shrink-0 bg-slate-50 text-slate-600">
                      {task.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))
              )}
            </div>
            <Link 
              href="/settings"
              className="text-[11px] text-blue-600 hover:text-blue-700 font-bold flex items-center justify-center py-2.5 hover:underline gap-1 mt-3 border-t border-dashed border-slate-250/70"
            >
              Open Settings Center
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>

        {/* SECTION 5: QUICK ACTION CENTER */}
        <Card className="border border-slate-200/80 shadow-md md:col-span-1 rounded-2xl">
          <CardHeader className="pb-3 pt-5 px-6 border-b border-slate-100 bg-slate-50/30">
            <CardTitle className="text-slate-900 text-sm font-bold flex items-center gap-2 font-heading">
              <Zap className="h-4.5 w-4.5 text-blue-600 animate-pulse" />
              Quick Action Terminal
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs mt-0.5">Dynamic hotlinks to dashboard control endpoints.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 p-6">
            {[
              { name: "Create Goal", href: "/goals", icon: Award },
              { name: "Create AMC Plan", href: "/amc", icon: ShieldCheck },
              { name: "Launch Campaign", href: "/announcements", icon: TrendingUp },
              { name: "Generate Report", href: "/sales", icon: FileText },
              { name: "Create Automation", href: "/reminders", icon: Zap },
              { name: "Review Tasks", href: "/settings", icon: CheckSquare },
              { name: "Add Fleet Client", href: "/fleet", icon: Users },
              { name: "Add Technician", href: "/technicians", icon: Plus }
            ].map((btn, i) => (
              <Link 
                key={i} 
                href={btn.href}
                className="p-3 border border-slate-150/60 bg-white hover:bg-slate-50 rounded-xl flex flex-col items-center justify-center text-center gap-2 hover:border-blue-400 hover:shadow-md transition-all duration-200 group/act"
              >
                <btn.icon className="h-4.5 w-4.5 text-slate-400 group-hover/act:text-blue-650 transition-colors" />
                <span className="text-[10px] font-bold text-slate-700 tracking-tight leading-none">{btn.name}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-heading leading-tight flex items-center gap-2">
            CEO Cockpit
          </h1>
          <p className="text-slate-500 text-sm mt-1 leading-normal">Dynamic corporate diagnostics, alerts queue, and recommendation matrices for InnoVibe Mobility.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Executive Command Palette Hook */}
          <CommandPalette />
          <div className="flex items-center gap-2.5 bg-white px-3.5 py-2 rounded-lg border border-slate-200/80 shadow-sm text-xs font-bold text-slate-650">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            GATEWAY ONLINE · Laravel 11.x
          </div>
        </div>
      </div>

      {/* CEO Multi-Scale Briefings Carousel */}
      <BriefingCard daily={dailyBrief} weekly={weeklyBrief} monthly={monthlyBrief} />

      {/* Tabbed Navigation Grid */}
      <CockpitTabs 
        overviewTab={overviewTabMarkup}
        kpis={kpis}
        opportunities={opportunities}
        notes={notes}
        boardDecisions={boardDecisions}
        strategicDecisions={strategicDecisions}
        snapshots={snapshots}
        templates={templates}
        techDebt={{
          failedSyncs: failedSyncsList,
          failedEvents: failedEventsList,
          syncSuccessRate: kpis.find(k => k.name === "System Sync Success Rate")?.current_value || 98.4,
          failedSyncCount: failedSyncsList.length,
          failedEventCount: failedEventsList.length,
          placeholderCount
        }}
        relationshipInsights={relationshipInsights}
        outcomes={outcomes}
      />
    </div>
  );
}
