"use client";

import { useState } from "react";
import { 
  LayoutDashboard, Sparkles, Database, FileText, 
  History, ShieldAlert, CheckCircle2, TrendingUp, IndianRupee, 
  HelpCircle, Clock, AlertTriangle, ArrowUpRight, Zap, Loader2, RefreshCw,
  Users, GitBranch, LineChart, Target, Network
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { ContextEngine } from "@/lib/context-engine";

interface CockpitTabsProps {
  overviewTab: React.ReactNode;
  kpis: any[];
  opportunities: any[];
  notes: any[];
  boardDecisions: any[];
  strategicDecisions: any[];
  snapshots: any[];
  templates: any[];
  techDebt: {
    failedSyncs: any[];
    failedEvents: any[];
    syncSuccessRate: number;
    failedSyncCount: number;
    failedEventCount: number;
    placeholderCount: number;
  };
  relationshipInsights: {
    topRevenueCustomers: any[];
    highComplaintCustomers: any[];
    fleetExpansionPotential: any[];
    lowAmcPenetration: any[];
  };
  outcomes: {
    decisionOutcomes: any[];
    campaignOutcomes: any[];
    automationOutcomes: any[];
  };
}

export function CockpitTabs({
  overviewTab,
  kpis,
  opportunities,
  notes,
  boardDecisions,
  strategicDecisions,
  snapshots,
  templates,
  techDebt,
  relationshipInsights,
  outcomes
}: CockpitTabsProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "strategy" | "relationship" | "memory" | "reports" | "outcomes" | "techdebt">("overview");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function triggerOpportunityScan() {
    setLoadingId("opp-scan");
    try {
      const res = await fetch("/api/opportunities/detect", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Scan complete: ${data.report.inserted} new opportunities logged.`);
        window.location.reload();
      } else {
        toast.error(`Scan failed: ${data.error}`);
      }
    } catch (err: any) {
      toast.error(`Scan error: ${err.message}`);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleCompileSnapshot(templateId: string, name: string) {
    setLoadingId(templateId);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, name })
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Snapshot '${name}' compiled.`);
        window.location.reload();
      } else {
        toast.error(`Compilation failed: ${data.error}`);
      }
    } catch (err: any) {
      toast.error(`Compilation error: ${err.message}`);
    } finally {
      setLoadingId(null);
    }
  }

  // Calculate some average success metrics for outcomes
  const calcAvgSuccess = (list: any[]) => {
    if (list.length === 0) return 0;
    const total = list.reduce((acc, curr) => acc + Number(curr.success_score || 0), 0);
    return Math.round(total / list.length);
  };

  const avgDecisionSuccess = calcAvgSuccess(outcomes.decisionOutcomes);
  const avgCampaignSuccess = calcAvgSuccess(outcomes.campaignOutcomes);
  const avgAutomationSuccess = calcAvgSuccess(outcomes.automationOutcomes);

  return (
    <div className="space-y-6">
      {/* Navigation tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 pb-px scrollbar-none">
        {[
          { id: "overview", label: "Executive Cockpit", icon: LayoutDashboard },
          { id: "strategy", label: "Opportunities & KPIs", icon: Sparkles },
          { id: "relationship", label: "Relationship Insights", icon: Network },
          { id: "memory", label: "Executive Memory", icon: History },
          { id: "reports", label: "Reporting Snapshots", icon: FileText },
          { id: "outcomes", label: "Outcome Tracking", icon: Target },
          { id: "techdebt", label: "Platform Health (Tech Debt)", icon: Database, badge: techDebt.failedSyncCount + techDebt.failedEventCount }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap focus:outline-none ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
            }`}
          >
            <tab.icon className="h-4 w-4 shrink-0" />
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <Badge className="bg-red-500 text-white border-none ml-1 px-1.5 py-0 text-[9px] font-bold">
                {tab.badge}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === "overview" && overviewTab}

      {activeTab === "strategy" && (
        <div className="space-y-6">
          {/* Dynamic KPI Registry Grid */}
          <Card className="border border-slate-100 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-50">
              <CardTitle className="text-slate-800 text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Centralized KPI Registry (Context-Enriched)
              </CardTitle>
              <CardDescription>Dynamic corporate KPIs calculated in real-time. Root causes and recommended actions are generated by the Context Engine.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="w-[220px]">Metric Name &amp; Formula</TableHead>
                    <TableHead className="text-center w-[120px]">Current Value</TableHead>
                    <TableHead className="text-center w-[100px]">Target</TableHead>
                    <TableHead className="text-center w-[100px]">Trend</TableHead>
                    <TableHead>Contextual Diagnostics (Context Engine)</TableHead>
                    <TableHead className="text-right w-[150px]">Owner Dept</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kpis.map((kpi) => {
                    const ctx = ContextEngine.getKPIContext(kpi.name, kpi.current_value, kpi.target);
                    return (
                      <TableRow key={kpi.name} className="hover:bg-slate-50/50">
                        <TableCell className="font-bold text-xs text-slate-800 align-top">
                          {kpi.name}
                          <p className="font-mono text-[9px] text-slate-400 mt-1 font-normal">{kpi.formula}</p>
                        </TableCell>
                        <TableCell className="text-center font-bold text-slate-900 text-xs align-top pt-3">
                          {kpi.name.includes("Revenue") ? `₹${kpi.current_value.toLocaleString("en-IN")}` : kpi.current_value}%
                        </TableCell>
                        <TableCell className="text-center font-semibold text-slate-500 text-xs align-top pt-3">
                          {kpi.name.includes("Revenue") ? `₹${kpi.target.toLocaleString("en-IN")}` : kpi.target}%
                        </TableCell>
                        <TableCell className="text-center align-top pt-2">
                          <Badge 
                            variant="outline" 
                            className={`text-[9px] uppercase font-bold ${
                              kpi.trend === "up" 
                                ? "text-green-700 bg-green-50 border-green-200" 
                                : kpi.trend === "stable" 
                                ? "text-blue-700 bg-blue-50 border-blue-200" 
                                : "text-red-700 bg-red-50 border-red-200"
                            }`}
                          >
                            {kpi.trend}
                          </Badge>
                        </TableCell>
                        <TableCell className="align-top py-2">
                          <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[10px] text-slate-600">
                            <div><span className="font-bold text-slate-700">Root Cause:</span> {ctx.rootCause}</div>
                            <div><span className="font-bold text-slate-700">Impact:</span> {ctx.impact}</div>
                            <div><span className="font-bold text-slate-700">Suggested Action:</span> <span className="text-blue-600 font-semibold">{ctx.suggestedAction}</span></div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right align-top pt-3">
                          <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 font-semibold">{kpi.owner_department}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Opportunity Detection Engine */}
          <Card className="border border-slate-100 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-slate-800 text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Opportunity Detection Engine
                </CardTitle>
                <CardDescription>Automatically detects upselling potential, inactive clients, and revenue recovery items.</CardDescription>
              </div>
              <button
                onClick={triggerOpportunityScan}
                disabled={loadingId === "opp-scan"}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shadow-md shadow-blue-500/10 shrink-0"
              >
                {loadingId === "opp-scan" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Scan Opportunities
              </button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead>Opportunity Details</TableHead>
                    <TableHead className="text-center">Impact (1-10)</TableHead>
                    <TableHead className="text-center">Confidence</TableHead>
                    <TableHead className="text-center">Effort (1-10)</TableHead>
                    <TableHead className="text-center">Exp. Revenue</TableHead>
                    <TableHead className="text-center">Priority Score</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {opportunities.map((opp) => (
                    <TableRow key={opp.id} className="hover:bg-slate-50/50">
                      <TableCell className="max-w-[200px]">
                        <div className="font-bold text-xs text-slate-800">{opp.title}</div>
                        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{opp.description}</p>
                      </TableCell>
                      <TableCell className="text-center font-bold text-xs">{opp.impact_score}/10</TableCell>
                      <TableCell className="text-center text-xs text-slate-600 font-semibold">{opp.confidence_score ? `${Math.round(Number(opp.confidence_score) * 100)}%` : "—"}</TableCell>
                      <TableCell className="text-center font-medium text-xs text-slate-500">{opp.effort_score}/10</TableCell>
                      <TableCell className="text-center text-xs font-bold text-slate-900">₹{Number(opp.expected_revenue ?? 250).toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-center text-xs font-extrabold text-blue-600">{opp.priority_score ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className={`text-[9px] uppercase font-semibold border-slate-200`}>
                          {opp.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {opportunities.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-400 text-xs">No opportunities detected. Click Scan Opportunities to run engine.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "relationship" && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Top customers by revenue */}
          <Card className="border border-slate-100 shadow-sm flex flex-col h-[400px]">
            <CardHeader className="pb-3 border-b border-slate-50 shrink-0">
              <CardTitle className="text-slate-800 text-sm font-semibold flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-emerald-500" />
                Top Customers by Revenue (Commercial Value)
              </CardTitle>
              <CardDescription>Top spending clients mapped dynamically from Laravel transactions.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-xs">Client Name</TableHead>
                    <TableHead className="text-center text-xs">Vehicles Owned</TableHead>
                    <TableHead className="text-right text-xs">Total Spent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relationshipInsights.topRevenueCustomers.map((c, idx) => (
                    <TableRow key={idx} className="hover:bg-slate-50/50">
                      <TableCell>
                        <div className="font-bold text-xs text-slate-800">{c.fullName}</div>
                        <p className="text-[9px] text-slate-400 mt-0.5">{c.email} | {c.phone}</p>
                      </TableCell>
                      <TableCell className="text-center font-bold text-xs text-slate-600">{c.vehicleCount}</TableCell>
                      <TableCell className="text-right font-extrabold text-xs text-slate-900">₹{c.totalSpent.toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                  ))}
                  {relationshipInsights.topRevenueCustomers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-12 text-slate-400 text-xs">No billing records found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* High Complaints Customers */}
          <Card className="border border-slate-100 shadow-sm flex flex-col h-[400px]">
            <CardHeader className="pb-3 border-b border-slate-50 shrink-0">
              <CardTitle className="text-slate-800 text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                High Complaint Density Customers (Churn Risk)
              </CardTitle>
              <CardDescription>Identifies clients with repeating operational issues or ticket backlogs.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-xs">Customer</TableHead>
                    <TableHead className="text-center text-xs">Complaint Count</TableHead>
                    <TableHead className="text-right text-xs">Last Complaint Issue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relationshipInsights.highComplaintCustomers.map((c, idx) => (
                    <TableRow key={idx} className="hover:bg-slate-50/50">
                      <TableCell>
                        <div className="font-bold text-xs text-slate-800">{c.fullName}</div>
                        <p className="text-[9px] text-slate-400 mt-0.5">{c.phone}</p>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-rose-500 text-white border-none font-bold text-[10px]">
                          {c.complaintCount} Tickets
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right max-w-[200px] truncate">
                        <Badge variant="outline" className={`text-[8px] uppercase font-bold border-red-200 bg-red-50 text-red-700 mr-2`}>
                          {c.lastComplaintSeverity}
                        </Badge>
                        <span className="text-[10px] text-slate-500 italic" title={c.lastComplaintDescription}>{c.lastComplaintDescription}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {relationshipInsights.highComplaintCustomers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-12 text-slate-400 text-xs">No customer complaints logged.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Fleet expansion potential */}
          <Card className="border border-slate-100 shadow-sm flex flex-col h-[400px]">
            <CardHeader className="pb-3 border-b border-slate-50 shrink-0">
              <CardTitle className="text-slate-800 text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                Fleet Owners with Expansion Potential
              </CardTitle>
              <CardDescription>Commercial accounts utilizing service hubs. Indicates upsell potential.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-xs">Fleet Client</TableHead>
                    <TableHead className="text-center text-xs">Current Vehicles</TableHead>
                    <TableHead className="text-center text-xs">Serviced Bookings</TableHead>
                    <TableHead className="text-right text-xs">Expansion Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relationshipInsights.fleetExpansionPotential.map((c, idx) => (
                    <TableRow key={idx} className="hover:bg-slate-50/50">
                      <TableCell>
                        <div className="font-bold text-xs text-slate-800">{c.fullName}</div>
                        <p className="text-[9px] text-slate-400 mt-0.5">{c.city} | {c.phone}</p>
                      </TableCell>
                      <TableCell className="text-center font-bold text-xs text-slate-700">{c.vehicleCount}</TableCell>
                      <TableCell className="text-center font-semibold text-xs text-slate-500">{c.completedBookingsCount}</TableCell>
                      <TableCell className="text-right font-extrabold text-xs text-blue-600">{c.expansionScore} pts</TableCell>
                    </TableRow>
                  ))}
                  {relationshipInsights.fleetExpansionPotential.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-slate-400 text-xs">No multi-vehicle fleet accounts detected.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Low AMC coverage */}
          <Card className="border border-slate-100 shadow-sm flex flex-col h-[400px]">
            <CardHeader className="pb-3 border-b border-slate-50 shrink-0">
              <CardTitle className="text-slate-800 text-sm font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-orange-500" />
                Unprotected Fleets (Low AMC Penetration)
              </CardTitle>
              <CardDescription>Accounts with multiple active vehicles lacking Q2 AMC care contracts.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-xs">Client Name</TableHead>
                    <TableHead className="text-center text-xs">Total Vehicles</TableHead>
                    <TableHead className="text-center text-xs">AMC Uncovered</TableHead>
                    <TableHead className="text-right text-xs">Penetration Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relationshipInsights.lowAmcPenetration.map((c, idx) => (
                    <TableRow key={idx} className="hover:bg-slate-50/50">
                      <TableCell>
                        <div className="font-bold text-xs text-slate-800">{c.fullName}</div>
                        <p className="text-[9px] text-slate-400 mt-0.5">{c.phone}</p>
                      </TableCell>
                      <TableCell className="text-center font-semibold text-xs text-slate-700">{c.vehicleCount}</TableCell>
                      <TableCell className="text-center font-bold text-xs text-red-500">{c.uncoveredVehicleCount}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className={`text-[10px] font-bold ${c.amcPenetrationRate > 50 ? "text-blue-700 bg-blue-50 border-blue-200" : "text-orange-700 bg-orange-50 border-orange-200"}`}>
                          {c.amcPenetrationRate}% Covered
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {relationshipInsights.lowAmcPenetration.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-slate-400 text-xs">All vehicles are fully covered by AMC plans.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "memory" && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Strategic Initiatives */}
          <Card className="border border-slate-100 shadow-sm md:col-span-2">
            <CardHeader className="pb-3 border-b border-slate-50">
              <CardTitle className="text-slate-800 text-sm font-semibold">Strategic Decisions Registry</CardTitle>
              <CardDescription>Formal records of long-term business restructuring plans and targets.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {strategicDecisions.map((sd) => (
                <div key={sd.id} className="p-4 space-y-2 hover:bg-slate-50/50 transition-colors">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-xs text-slate-900">{sd.title}</h4>
                    <Badge variant="outline" className="text-[9px] uppercase border-blue-200 bg-blue-50 text-blue-700 font-bold">{sd.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{sd.description}</p>
                  <div className="grid gap-2 grid-cols-2 text-[10px] text-slate-400 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div>
                      <span className="font-bold text-slate-500 block">Rationale:</span>
                      {sd.rationale || "—"}
                    </div>
                    <div>
                      <span className="font-bold text-slate-500 block">Expected Impact:</span>
                      {sd.expected_impact || "—"}
                    </div>
                  </div>
                </div>
              ))}
              {strategicDecisions.length === 0 && (
                <p className="text-center text-slate-400 py-8 text-xs">No strategic decisions logged.</p>
              )}
            </CardContent>
          </Card>

          {/* Board Decisions & Notes */}
          <div className="space-y-6 md:col-span-1">
            {/* Board decisions */}
            <Card className="border border-slate-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-800 text-xs font-semibold uppercase tracking-wider">Board Resolutions log</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {boardDecisions.map((bd) => (
                  <div key={bd.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                    <h5 className="font-bold text-xs text-slate-800">{bd.title}</h5>
                    <p className="text-[10px] text-slate-500 mt-1 leading-normal">{bd.description}</p>
                    {bd.resolutions && bd.resolutions.length > 0 && (
                      <ul className="list-disc list-inside text-[9px] text-slate-500 mt-2 space-y-1">
                        {bd.resolutions.map((r: string, idx: number) => (
                          <li key={idx} className="truncate">{r}</li>
                        ))}
                      </ul>
                    )}
                    <span className="text-[9px] text-slate-400 block mt-2">Meeting Date: {bd.meeting_date}</span>
                  </div>
                ))}
                {boardDecisions.length === 0 && (
                  <p className="text-center text-slate-400 py-4 text-xs">No board decisions recorded.</p>
                )}
              </CardContent>
            </Card>

            {/* CEO Notes */}
            <Card className="border border-slate-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-800 text-xs font-semibold uppercase tracking-wider">CEO Observations &amp; Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {notes.map((n) => (
                  <div key={n.id} className="p-3 border border-slate-100 rounded-xl bg-white hover:border-slate-200 transition-all">
                    <h5 className="font-bold text-xs text-slate-800">{n.title}</h5>
                    <p className="text-[10px] text-slate-600 mt-1 leading-normal whitespace-pre-wrap">{n.content}</p>
                    <span className="text-[9px] text-slate-400 block mt-2">Log Date: {new Date(n.created_at).toLocaleDateString("en-IN")}</span>
                  </div>
                ))}
                {notes.length === 0 && (
                  <p className="text-center text-slate-400 py-4 text-xs">No executive notes logged.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "reports" && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Snapshots log */}
          <Card className="border border-slate-100 shadow-sm md:col-span-2">
            <CardHeader className="pb-3 border-b border-slate-50">
              <CardTitle className="text-slate-800 text-sm font-semibold">Historical Report Snapshots</CardTitle>
              <CardDescription>Compiled archives of previous daily, weekly, and monthly aggregate audits.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead>Report Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Compilation Date</TableHead>
                    <TableHead className="text-right">Data Snapshot Preview</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshots.map((s) => (
                    <TableRow key={s.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-bold text-xs text-slate-800">{s.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[9px] uppercase border-slate-200 bg-slate-50 text-slate-700 font-bold">
                          {s.report_templates?.category || "custom"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs">
                        {new Date(s.created_at).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right">
                        <pre className="text-[9px] bg-slate-900 text-green-400 p-2 rounded-lg max-w-[200px] truncate text-left ml-auto font-mono">
                          {JSON.stringify(s.data)}
                        </pre>
                      </TableCell>
                    </TableRow>
                  ))}
                  {snapshots.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-slate-400 text-xs">No report snapshots compiled yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Templates compiler */}
          <Card className="border border-slate-100 shadow-sm md:col-span-1">
            <CardHeader>
              <CardTitle className="text-slate-800 text-sm font-semibold">Snapshot Compiler</CardTitle>
              <CardDescription>Select a reporting template and trigger snapshot archives.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {templates.map((t) => (
                <div key={t.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 flex flex-col gap-2">
                  <div>
                    <h5 className="font-bold text-xs text-slate-800">{t.name}</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">{t.description}</p>
                  </div>
                  <button
                    onClick={() => handleCompileSnapshot(t.id, `${t.name} - ${new Date().toLocaleDateString("en-IN")}`)}
                    disabled={loadingId === t.id}
                    className="self-end flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all disabled:opacity-50"
                  >
                    {loadingId === t.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowUpRight className="h-3 w-3" />}
                    Compile Snapshot
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "outcomes" && (
        <div className="space-y-6">
          {/* Outcome performance summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Decisions Avg Success", value: `${avgDecisionSuccess}%`, icon: Target, desc: "Success rate of approved recommendations" },
              { label: "Campaigns Avg Success", value: `${avgCampaignSuccess}%`, icon: LineChart, desc: "Conversion success score of promotional runs" },
              { label: "Automations Avg Success", value: `${avgAutomationSuccess}%`, icon: Zap, desc: "Resolution rates of background triggers" }
            ].map((stat, idx) => (
              <Card key={idx} className="border border-slate-100 shadow-sm bg-white">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-semibold uppercase">{stat.label}</span>
                    <div className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</div>
                    <span className="text-[10px] text-slate-400 block mt-1">{stat.desc}</span>
                  </div>
                  <div className="h-10 w-10 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center shrink-0">
                    <stat.icon className="h-5 w-5 text-slate-600" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Decision Outcomes */}
            <Card className="border border-slate-100 shadow-sm h-[380px] flex flex-col">
              <CardHeader className="pb-2 border-b border-slate-50 shrink-0">
                <CardTitle className="text-slate-800 text-xs font-bold uppercase tracking-wider">Decision Outcomes</CardTitle>
                <CardDescription>Audit of executed decision recommendations.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-0">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="text-xs">Recommendation</TableHead>
                      <TableHead className="text-right text-xs">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outcomes.decisionOutcomes.map((o) => (
                      <TableRow key={o.id} className="hover:bg-slate-50/50">
                        <TableCell>
                          <div className="font-bold text-xs text-slate-800">{o.decision_recommendations?.title || "Decision"}</div>
                          <p className="text-[9px] text-slate-400 mt-0.5">Exp: {o.expected_result} | Act: {o.actual_result}</p>
                        </TableCell>
                        <TableCell className="text-right align-middle">
                          <Badge className={o.success_score > 70 ? "bg-green-500 text-white" : o.success_score > 40 ? "bg-amber-500 text-white" : "bg-red-500 text-white"}>
                            {o.success_score}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {outcomes.decisionOutcomes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-8 text-slate-400 text-xs">No decision outcomes logged.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Campaign Outcomes */}
            <Card className="border border-slate-100 shadow-sm h-[380px] flex flex-col">
              <CardHeader className="pb-2 border-b border-slate-50 shrink-0">
                <CardTitle className="text-slate-800 text-xs font-bold uppercase tracking-wider">Campaign Outcomes</CardTitle>
                <CardDescription>Track conversions and performance variances.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-0">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="text-xs">Campaign</TableHead>
                      <TableHead className="text-right text-xs">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outcomes.campaignOutcomes.map((o) => (
                      <TableRow key={o.id} className="hover:bg-slate-50/50">
                        <TableCell>
                          <div className="font-bold text-xs text-slate-800">{o.campaign_name}</div>
                          <p className="text-[9px] text-slate-400 mt-0.5" title={o.variance}>Exp: {o.expected_result} | Act: {o.actual_result}</p>
                        </TableCell>
                        <TableCell className="text-right align-middle">
                          <Badge className={o.success_score > 70 ? "bg-green-500 text-white" : o.success_score > 40 ? "bg-amber-500 text-white" : "bg-red-500 text-white"}>
                            {o.success_score}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {outcomes.campaignOutcomes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-8 text-slate-400 text-xs">No campaign outcomes logged.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Automation Outcomes */}
            <Card className="border border-slate-100 shadow-sm h-[380px] flex flex-col">
              <CardHeader className="pb-2 border-b border-slate-50 shrink-0">
                <CardTitle className="text-slate-800 text-xs font-bold uppercase tracking-wider">Automation Outcomes</CardTitle>
                <CardDescription>Tracks background jobs execution outcomes.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-0">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="text-xs">Rule Execution</TableHead>
                      <TableHead className="text-right text-xs">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outcomes.automationOutcomes.map((o) => (
                      <TableRow key={o.id} className="hover:bg-slate-50/50">
                        <TableCell>
                          <div className="font-bold text-xs text-slate-800">{o.automation_executions?.automation_rules?.name || "Automation Rule"}</div>
                          <p className="text-[9px] text-slate-400 mt-0.5">Exp: {o.expected_result} | Act: {o.actual_result}</p>
                        </TableCell>
                        <TableCell className="text-right align-middle">
                          <Badge className={o.success_score > 70 ? "bg-green-500 text-white" : o.success_score > 40 ? "bg-amber-500 text-white" : "bg-red-500 text-white"}>
                            {o.success_score}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {outcomes.automationOutcomes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-8 text-slate-400 text-xs">No automation outcomes logged.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "techdebt" && (
        <div className="space-y-6">
          {/* Tech Debt Stats row */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Data Quality Stubs", value: techDebt.placeholderCount, icon: Clock, desc: "Orphan stubs auto-generated to keep FK integrity" },
              { label: "Failed Automations", value: "0", icon: AlertTriangle, desc: "Downstream TCA rules failures" },
              { label: "Failed Caching Events", value: techDebt.failedEventCount, icon: ShieldAlert, desc: "Events queue writing errors in registry" }
            ].map((stat, idx) => (
              <Card key={idx} className="border border-slate-100 shadow-sm bg-white">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-semibold uppercase">{stat.label}</span>
                    <div className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</div>
                    <span className="text-[10px] text-slate-400 block mt-1">{stat.desc}</span>
                  </div>
                  <div className="h-10 w-10 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center shrink-0">
                    <stat.icon className="h-5 w-5 text-slate-600" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Sync Monitoring Logs */}
            <Card className="border border-slate-100 shadow-sm flex flex-col h-[400px]">
              <CardHeader className="pb-3 border-b border-slate-50 shrink-0">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-slate-800 text-sm font-semibold flex items-center gap-2">
                    <Database className="h-4 w-4 text-indigo-500" />
                    Failed Sync Log Register
                  </CardTitle>
                  <Badge variant="secondary" className="bg-red-50 text-red-700 text-[10px]">
                    {techDebt.failedSyncCount} Failures
                  </Badge>
                </div>
                <CardDescription>Trace integration sync faults in database caches.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-0">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="text-slate-500 text-xs">Entity Type</TableHead>
                      <TableHead className="text-slate-500 text-xs">Error Message</TableHead>
                      <TableHead className="text-slate-500 text-xs text-right">Retries</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {techDebt.failedSyncs.map((row) => (
                      <TableRow key={row.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-bold text-xs uppercase text-slate-700">{row.entity_type}</TableCell>
                        <TableCell className="text-xs text-slate-600 truncate max-w-[200px]" title={row.error_message}>{row.error_message}</TableCell>
                        <TableCell className="text-right font-bold text-xs">{row.retry_count}</TableCell>
                      </TableRow>
                    ))}
                    {techDebt.failedSyncs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-12 text-slate-400 text-xs">No active sync failures registered.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Failed Events Queue Logs */}
            <Card className="border border-slate-100 shadow-sm flex flex-col h-[400px]">
              <CardHeader className="pb-3 border-b border-slate-50 shrink-0">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-slate-800 text-sm font-semibold flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-red-500" />
                    Failed Events queue logs
                  </CardTitle>
                  <Badge variant="secondary" className="bg-red-50 text-red-700 text-[10px]">
                    {techDebt.failedEventCount} Failures
                  </Badge>
                </div>
                <CardDescription>Audit timeline events queue transmission issues.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-0">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="text-slate-500 text-xs">Event Type</TableHead>
                      <TableHead className="text-slate-500 text-xs">Error Description</TableHead>
                      <TableHead className="text-slate-500 text-xs text-right">Retries</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {techDebt.failedEvents.map((row) => (
                      <TableRow key={row.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-bold text-xs text-slate-700">{row.event_type}</TableCell>
                        <TableCell className="text-xs text-slate-600 truncate max-w-[200px]" title={row.error_message}>{row.error_message}</TableCell>
                        <TableCell className="text-right font-bold text-xs">{row.retry_count}</TableCell>
                      </TableRow>
                    ))}
                    {techDebt.failedEvents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-12 text-slate-400 text-xs">No failed events registered.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
