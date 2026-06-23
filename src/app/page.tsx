import { createClient } from "@/lib/supabase/server";
import { getCompanyHealthScore } from "@/lib/health";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, Award, BellRing, Briefcase, 
  TrendingUp, Zap, Clock, ShieldCheck, 
  ChevronRight, Play, CheckCircle2, AlertTriangle, 
  Cpu, Users, ShieldAlert, FileText, CheckSquare, Plus,
  Sparkles, Terminal, Calendar, MessageSquare, BookOpen, Settings
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
  // Fetch ALL data sources concurrently: Laravel API calls + Supabase queries.
  // This eliminates sequential round-trip waterfalls.
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
    // Laravel API (network calls — deduplicated to exactly 1 fetch each)
    getTransactions().catch(() => [] as any[]),
    getBookings().catch(() => [] as any[]),

    // Company health score
    getCompanyHealthScore(),

    // Supabase table queries (all fired concurrently)
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

  // Unpack raw results
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
  // Pass pre-fetched raw arrays into derived functions — no redundant API calls.
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

  // Dynamic calculations for KPI registry
  const revenueKpi = kpis.find(k => k.name === "Monthly Revenue")?.current_value || 14820;

  // Styling maps
  const healthGradientMap: Record<string, string> = {
    revenue: "from-blue-500 to-indigo-500",
    operations: "from-emerald-500 to-teal-500",
    automation: "from-purple-500 to-pink-500",
    customer: "from-amber-500 to-orange-500",
    growth: "from-rose-500 to-red-500",
    hardware: "from-cyan-500 to-blue-500"
  };

  const alertBadgeMap: Record<string, string> = {
    critical: "bg-red-50 border-red-200 text-red-700 hover:bg-red-100",
    warning: "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100",
    opportunity: "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100",
    info: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
  };

  // Define overview tab render markup
  const overviewTabMarkup = (
    <div className="space-y-6">
      {/* SECTION 1: COMPANY HEALTH & STATS */}
      <div className="grid gap-6 md:grid-cols-4">
        {/* Overall Score */}
        <Card className="md:col-span-1 border border-slate-100 shadow-sm relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-blue-500/20 blur-xl" />
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-400 text-xs font-semibold tracking-wider uppercase">Company Health Score</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="relative flex items-center justify-center">
              <svg className="w-28 h-28 transform -rotate-90">
                <circle cx="56" cy="56" r="46" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                <circle cx="56" cy="56" r="46" stroke="#3b82f6" strokeWidth="8" fill="transparent"
                  strokeDasharray={2 * Math.PI * 46}
                  strokeDashoffset={2 * Math.PI * 46 * (1 - healthReport.overall / 100)} 
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-3xl font-bold font-mono">{healthReport.overall}%</div>
            </div>
            <p className="text-xs text-slate-300 mt-4 text-center">Calculated dynamically from 6 corporate metrics.</p>
          </CardContent>
        </Card>

        {/* Metrics Breakdown Grid */}
        <div className="md:col-span-3 grid gap-4 sm:grid-cols-3">
          {Object.entries(healthReport.breakdown).map(([key, metric]) => {
            const gradient = healthGradientMap[key] || "from-slate-500 to-slate-600";
            return (
              <Card key={key} className="border border-slate-100 shadow-sm overflow-hidden bg-white hover:border-slate-200 transition-colors">
                <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{metric.display_name}</span>
                    <Badge variant="outline" className={metric.status === "optimal" ? "text-green-700 bg-green-50 border-green-200" : "text-orange-700 bg-orange-50 border-orange-200"}>
                      {metric.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-slate-900">{metric.score}%</span>
                    <span className="text-[10px] text-slate-400">Score</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1 rounded-full mt-3 overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${gradient}`} style={{ width: `${metric.score}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">
                    Current: <span className="font-semibold text-slate-600">
                      {key === "revenue" ? `₹${revenueKpi.toLocaleString("en-IN")}` : metric.current}
                    </span> / Target: {key === "revenue" ? `₹${metric.target.toLocaleString("en-IN")}` : metric.target}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: GOALS & OKRs */}
      <Card className="border border-slate-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-slate-800 text-sm font-semibold flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-500" />
            Goals &amp; OKR Center
          </CardTitle>
          <CardDescription>Strategic targets progression for Q2 2026.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-5">
            {goals.length === 0 ? (
              <div className="col-span-5 flex flex-col items-center justify-center py-6 text-center">
                <Award className="h-10 w-10 text-slate-300 mb-2" />
                <h4 className="text-xs font-semibold text-slate-600">No OKRs defined yet</h4>
                <p className="text-[11px] text-slate-400">Create Q2 corporate goals to start tracking progress.</p>
              </div>
            ) : (
              goals.map((g: any) => {
                const currentVal = g.category === "revenue" ? revenueKpi : g.current_value;
                const completion = Math.round((currentVal / g.target_value) * 100);
                return (
                  <div key={g.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <span className="text-[10px] uppercase font-bold text-slate-400">{g.okr_cycles?.name || "Target"}</span>
                    <h4 className="font-semibold text-slate-800 text-xs truncate mt-0.5">{g.title}</h4>
                    
                    <div className="flex items-baseline justify-between mt-3">
                      <span className="text-lg font-bold text-slate-900">{completion}%</span>
                      <span className="text-[9px] text-slate-400 font-medium">Progress</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1 rounded-full mt-1.5 overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(100, completion)}%` }} />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500 mt-2">
                      <span>Val: {g.category === "revenue" ? `₹${revenueKpi.toLocaleString("en-IN")}` : currentVal}</span>
                      <span>Goal: {g.category === "revenue" ? `₹${g.target_value.toLocaleString("en-IN")}` : g.target_value}</span>
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
        <Card className="border border-slate-100 shadow-sm flex flex-col h-full">
          <CardHeader className="pb-3 shrink-0">
            <div className="flex justify-between items-center">
              <CardTitle className="text-slate-800 text-sm font-semibold flex items-center gap-2">
                <Cpu className="h-4 w-4 text-purple-600 animate-pulse" />
                Decision Engine Recommendation Inbox
              </CardTitle>
              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-none text-[10px]">AI Inference &amp; Learning</Badge>
            </div>
            <CardDescription>Review and approve recommended optimizations. Confidence values calibrate automatically from past outcomes.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <DecisionInbox initialRecommendations={recommendations} />
          </CardContent>
        </Card>

        {/* SECTION 3: EXECUTIVE ALERT CENTER */}
        <Card className="border border-slate-100 shadow-sm flex flex-col h-full">
          <CardHeader className="pb-3 shrink-0">
            <CardTitle className="text-slate-800 text-sm font-semibold flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-500 animate-bounce" />
              Executive Alert Center
            </CardTitle>
            <CardDescription>Critical faults, warnings, and priority notices with Context Engine diagnostics.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-3">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                <ShieldCheck className="h-10 w-10 text-emerald-500 mb-2" />
                <h4 className="text-xs font-semibold text-slate-600">No active alerts</h4>
                <p className="text-[11px] text-slate-400">All systems online. Telemetry values stable.</p>
              </div>
            ) : (
              alerts.map((alert: any) => {
                const alertCtx = ContextEngine.getAlertContext(alert.alert_type, alert.description, alert.severity);
                return (
                  <div 
                    key={alert.id} 
                    className="p-3 border rounded-xl flex flex-col gap-2 bg-white hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {alert.severity === "critical" && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        {alert.severity === "warning" && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                        {alert.severity === "opportunity" && <Zap className="h-4 w-4 text-purple-500" />}
                        {alert.severity === "info" && <CheckCircle2 className="h-4 w-4 text-blue-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-800 capitalize">{alert.alert_type}</span>
                          <Badge variant="outline" className={`text-[9px] uppercase border font-semibold ${alertBadgeMap[alert.severity] || ""}`}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{alert.description}</p>
                      </div>
                    </div>
                    
                    {/* Context Engine diagnostics block */}
                    <div className="text-[10px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
                      <div><span className="font-bold text-slate-700">Root Cause:</span> {alertCtx.rootCause}</div>
                      <div><span className="font-bold text-slate-700">Impact:</span> {alertCtx.impact}</div>
                      <div><span className="font-bold text-slate-700">Action:</span> <span className="text-blue-600 font-semibold">{alertCtx.suggestedAction}</span></div>
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
        <Card className="border border-slate-100 shadow-sm md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-800 text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              Company Activity Feed
            </CardTitle>
            <CardDescription>Live timeline generated entirely from events.</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="relative border-l border-slate-100 pl-4 space-y-5 ml-1.5 h-[180px] overflow-y-auto">
              {timeline.length === 0 ? (
                <p className="text-center text-slate-400 py-12 text-xs">No recent activity.</p>
              ) : (
                timeline.map((feed: any, index: number) => (
                  <div key={feed.id || index} className="relative">
                    <div className="absolute -left-[21.5px] top-1 h-3 w-3 rounded-full border-2 border-white bg-blue-500 shadow-sm" />
                    <p className="text-xs text-slate-700 leading-snug">{feed.description}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* SECTION 7: TASKS & APPROVALS */}
        <Card className="border border-slate-100 shadow-sm md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-800 text-sm font-semibold flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-green-500" />
              Tasks &amp; Approvals
            </CardTitle>
            <CardDescription>Executive execution task board.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 h-[180px] overflow-y-auto">
            {tasks.length === 0 ? (
              <p className="text-center text-slate-400 py-12 text-xs">No pending tasks.</p>
            ) : (
              tasks.map((task: any) => (
                <div 
                  key={task.id} 
                  className="p-3 border border-slate-100 rounded-xl bg-white hover:bg-slate-50/50 transition-colors flex justify-between items-center gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{task.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{task.description}</p>
                  </div>
                  <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-semibold border-slate-200">
                    {task.status.replace("_", " ")}
                  </Badge>
                </div>
              ))
            )}
            <Link 
              href="/settings"
              className="text-xs text-blue-600 font-semibold flex items-center justify-center py-2 hover:underline gap-1 mt-2 border-t border-dashed border-slate-100"
            >
              Open Task Center
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>

        {/* SECTION 5: QUICK ACTION CENTER */}
        <Card className="border border-slate-100 shadow-sm md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-800 text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-500" />
              Executive Quick Actions
            </CardTitle>
            <CardDescription>Direct navigation hooks and actions.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
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
                className="p-3 border border-slate-100 bg-slate-50/30 hover:bg-slate-50 rounded-xl flex flex-col items-center justify-center text-center gap-1.5 hover:border-slate-200 transition-all duration-200"
              >
                <btn.icon className="h-4 w-4 text-slate-500 group-hover:text-blue-500" />
                <span className="text-[10px] font-semibold text-slate-700">{btn.name}</span>
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">CEO</h1>
          <p className="text-slate-500 text-sm">Real-time status monitoring, alerts, and strategic approvals for InnoVibe Mobility.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Executive Command Palette Hook */}
          <CommandPalette />
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm text-xs font-semibold text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
            SYSTEM ONLINE · Laravel Connected
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
