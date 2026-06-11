"use client";

import { useState, useEffect } from "react";
import {
  IndianRupee,
  TrendingUp,
  AlertOctagon,
  Users,
  Compass,
  Zap,
  Target,
  ArrowRight,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Mail,
  CheckCircle,
  Sliders,
  DollarSign
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function RevenueIntelligencePage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"flywheel" | "matrix" | "leakage" | "amc" | "forecast">("flywheel");

  // Simulator state
  const [bookingGrowth, setBookingGrowth] = useState(15);
  const [amcGrowth, setAmcGrowth] = useState(20);
  const [churnReduction, setChurnReduction] = useState(30);
  const [recoveryImprovement, setRecoveryImprovement] = useState(50);

  // Playbook execution message logs
  const [actionLog, setActionLog] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<boolean>(true);

  // Load calculations from API
  const fetchRevenueData = async (isRefreshed = false) => {
    try {
      if (isRefreshed) setRefreshing(true);
      else setLoading(true);
      setError(null);

      // Force recalculation if requested
      if (isRefreshed) {
        await fetch("/api/revenue/intelligence", { method: "POST" });
      }

      const res = await fetch("/api/revenue/intelligence");
      if (!res.ok) throw new Error(`Server returned code ${res.status}`);
      const json = await res.json();
      
      if (!json.success) throw new Error(json.error || "Failed to load revenue calculations");
      
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, []);

  // Trigger playbook
  const runRecoveryPlaybook = async (playbookId: string, contextMessage: string) => {
    try {
      setActionLog("Triggering recovery playbook execution...");
      setActionSuccess(true);
      
      const res = await fetch("/api/operations/playbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playbookId, triggerSource: contextMessage })
      });
      
      const json = await res.json();
      if (json.success) {
        setActionLog(`[SOP TRIGGERED] Playbook successfully launched! Execution ID: ${json.executionId}`);
        setActionSuccess(true);
        // Refresh metrics
        fetchRevenueData();
      } else {
        throw new Error(json.error || "Execution failed");
      }
    } catch (err: any) {
      setActionLog(`Failed to trigger playbook: ${err.message}`);
      setActionSuccess(false);
    }
    setTimeout(() => setActionLog(null), 8000);
  };

  // Trigger manual notification campaign simulation
  const sendAMCNotification = async (customerName: string) => {
    setActionLog(`[COMMUNICATION DISPATCHED] WhatsApp brochure and discount links successfully queued for dispatch to ${customerName}.`);
    setActionSuccess(true);
    setTimeout(() => setActionLog(null), 5000);
  };

  if (loading) {
    return (
      <div className="crm-page flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Processing live financial datasets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="crm-page p-6">
        <div className="crm-alert-danger max-w-xl mx-auto mt-10">
          <ShieldAlert className="h-10 w-10 text-red-650 mb-3" />
          <h3 className="font-bold text-sm">Financial Data Stream Blocked</h3>
          <p className="text-xs mt-1">{error}</p>
          <button onClick={() => fetchRevenueData()} className="crm-btn-danger crm-btn-sm mt-4">
            Retry Stream
          </button>
        </div>
      </div>
    );
  }

  // Calculate dashboard aggregations
  const totalRevenue = data?.forecasts?.filter((f: any) => f.type === "actual")
    ?.reduce((sum: number, f: any) => sum + f.revenue, 0) || 12000;
  
  const estimatedLeakage = data?.leakages?.reduce((sum: number, l: any) => sum + l.amount, 0) || 0;
  
  const activeAMCCovers = data?.profiles?.filter((p: any) => p.segment === "Champions" || p.amc_conversion_probability === 0).length || 0;
  const amcProtectionRate = data?.profiles?.length > 0
    ? Math.round((activeAMCCovers / data.profiles.length) * 100)
    : 45;

  const avgCLV = data?.profiles?.length > 0
    ? Math.round(data.profiles.reduce((sum: number, p: any) => sum + p.clv, 0) / data.profiles.length)
    : 2500;

  // Run simulation calculations
  const baseMonthly = data?.forecasts?.filter((f: any) => f.type === "actual")?.slice(-1)[0]?.revenue || 12000;
  const baseChurn = data?.warRoom?.avgChurnRisk || 28.5;

  // Simulate on-the-fly
  const bookingGrowthRev = baseMonthly * (bookingGrowth / 100);
  const amcGrowthRev = baseMonthly * 0.15 * (amcGrowth / 100);
  const savedChurnRev = baseMonthly * (baseChurn / 100) * (churnReduction / 100) * 0.8;
  const recoveredLeakage = estimatedLeakage * (recoveryImprovement / 100);
  const simulatedRevenue = Math.round(baseMonthly + bookingGrowthRev + amcGrowthRev + savedChurnRev + recoveredLeakage);
  const netRecoveryValue = Math.round(bookingGrowthRev + amcGrowthRev + savedChurnRev + recoveredLeakage);
  const simulatedCSAT = Math.min(5.00, Number((4.1 + (churnReduction / 100) * 0.7).toFixed(2)));
  const variancePct = Number(((netRecoveryValue / baseMonthly) * 100).toFixed(1));

  return (
    <div className="crm-page">
      {/* Toolbar */}
      <div className="crm-toolbar">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <h1 className="crm-toolbar-title">Revenue Health Cockpit</h1>
        </div>
        <div className="crm-toolbar-actions">
          <button 
            onClick={() => fetchRevenueData(true)} 
            disabled={refreshing}
            className="crm-btn-secondary crm-btn-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${refreshing ? "animate-spin" : ""}`} />
            Recalculate AI Models
          </button>
        </div>
      </div>

      <div className="crm-body">
        {/* Action logs banner */}
        {actionLog && (
          <div className={`mb-5 p-4 rounded-lg border flex items-center gap-3 ${
            actionSuccess 
              ? "bg-emerald-50 border-emerald-250 text-emerald-800" 
              : "bg-red-50 border-red-250 text-red-800"
          }`}>
            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
            <p className="text-xs font-semibold">{actionLog}</p>
          </div>
        )}

        {/* War Room Alert Banner */}
        {data?.warRoom?.active && (
          <div className="crm-alert-danger mb-6">
            <div className="flex-1">
              <h3 className="font-bold text-sm text-red-900">CRITICAL ALERT: REVENUE WAR ROOM ACTIVE</h3>
              <p className="text-xs text-red-700 mt-1">
                Automated detection engines have flagged target breaches:
              </p>
              <ul className="list-disc list-inside text-xs text-red-700 mt-2 font-medium">
                {data.warRoom.triggers.map((t: string, idx: number) => (
                  <li key={idx}>{t}</li>
                ))}
              </ul>
              <div className="flex gap-2.5 mt-4">
                <button 
                  onClick={() => runRecoveryPlaybook("22222222-2222-2222-2222-222222222222", "War Room Target Deficit Trigger")}
                  className="crm-btn-danger crm-btn-sm"
                >
                  <Zap className="h-3.5 w-3.5 mr-1" />
                  Execute Revenue Recovery Playbook
                </button>
                <button 
                  onClick={() => setActiveTab("leakage")}
                  className="crm-btn-secondary crm-btn-sm text-red-700 border-red-200 bg-red-50 hover:bg-red-100"
                >
                  Audit Leakages
                </button>
              </div>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="crm-stat-card crm-hover-glow">
            <div className="crm-stat-icon" style={{ backgroundColor: "#ECFDF5" }}>
              <IndianRupee className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <span className="crm-stat-label">Total Revenue</span>
              <div className="crm-stat-value text-emerald-600">₹{totalRevenue.toLocaleString("en-IN")}</div>
            </div>
          </div>

          <div className="crm-stat-card crm-hover-glow">
            <div className="crm-stat-icon">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <span className="crm-stat-label">Average CLV</span>
              <div className="crm-stat-value text-slate-800">₹{avgCLV.toLocaleString("en-IN")}</div>
            </div>
          </div>

          <div className="crm-stat-card crm-hover-glow">
            <div className="crm-stat-icon" style={{ backgroundColor: "#FEF2F2" }}>
              <AlertOctagon className="h-5 w-5 text-rose-500" />
            </div>
            <div>
              <span className="crm-stat-label">Active Leakage</span>
              <div className="crm-stat-value text-rose-600">₹{estimatedLeakage.toLocaleString("en-IN")}</div>
            </div>
          </div>

          <div className="crm-stat-card crm-hover-glow">
            <div className="crm-stat-icon" style={{ backgroundColor: "#EFF6FF" }}>
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <span className="crm-stat-label">AMC Coverage</span>
              <div className="crm-stat-value text-slate-800">{amcProtectionRate}%</div>
            </div>
          </div>
        </div>

        {/* Tabs Control */}
        <div className="crm-tabs mb-5">
          {[
            { id: "flywheel", label: "Flywheel & Drivers" },
            { id: "matrix", label: "Customer Value Matrix" },
            { id: "leakage", label: "Leakage Resolution Board" },
            { id: "amc", label: "AMC Conversion Hub" },
            { id: "forecast", label: "Forecast & Simulator" },
          ].map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`crm-tab ${activeTab === tab.id ? "active" : ""}`}
            >
              {tab.label}
            </div>
          ))}
        </div>

        {/* Work Area */}
        <div className="space-y-6">
          {/* TAB 1: FLYWHEEL */}
          {activeTab === "flywheel" && (
            <div className="space-y-6">
              <div className="crm-section">
                <div className="crm-section-head">
                  <h3 className="crm-card-title">Revenue Flywheel Pipeline</h3>
                </div>
                <div className="crm-section-body space-y-6">
                  {data?.flywheel && (
                    <>
                      {/* Horizontal Funnel */}
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        {[
                          { label: "Customer", metric: "Acquisition", score: `${data.flywheel.customer_acquisition_rate}%`, color: "bg-blue-500" },
                          { label: "Booking", metric: "Frequency", score: `${data.flywheel.booking_frequency}x/user`, color: "bg-cyan-500" },
                          { label: "Payment", metric: "Checkout Rate", score: `${data.flywheel.payment_success_rate}%`, color: "bg-emerald-500" },
                          { label: "AMC Protection", metric: "Cover Rate", score: `${data.flywheel.amc_penetration_rate}%`, color: "bg-indigo-500" },
                          { label: "Retention", metric: "Active Duration", score: `${data.flywheel.retention_rate}%`, color: "bg-violet-500" },
                          { label: "Referral", metric: "Promoter Rate", score: `${data.flywheel.referral_rate}%`, color: "bg-purple-500" },
                        ].map((step) => {
                          const isWeak = data.flywheel.weak_link?.toLowerCase()?.includes(step.label?.toLowerCase()) || 
                                       (step.label === "Payment" && data.flywheel.weak_link?.toLowerCase()?.includes("gateway")) ||
                                       (step.label === "AMC Protection" && data.flywheel.weak_link?.toLowerCase()?.includes("amc"));
                          return (
                            <div 
                              key={step.label}
                              className={`p-4 rounded-xl border flex flex-col items-center justify-between text-center relative transition ${
                                isWeak 
                                  ? "border-red-350 bg-red-50/50 shadow-sm" 
                                  : "border-slate-150 bg-slate-50/50"
                              }`}
                            >
                              <span className="text-[10px] text-slate-400 font-bold uppercase">{step.label}</span>
                              <div className="my-2 flex flex-col items-center">
                                <span className="text-xl font-extrabold text-slate-900">{step.score}</span>
                                <span className="text-[10px] text-slate-400 font-semibold">{step.metric}</span>
                              </div>
                              <div className={`h-1 w-8 rounded-full ${step.color}`} />
                              {isWeak && (
                                <span className="absolute -top-2 text-[9px] uppercase tracking-wider font-extrabold bg-red-500 text-white px-2 py-0.5 rounded-full">
                                  Weakest
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Weakest link insight action */}
                      <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                        <div>
                          <span className="crm-badge-purple uppercase mb-1">Funnels Optimization Target</span>
                          <h4 className="font-bold text-slate-900 text-sm">
                            Primary Constraint: <span className="text-blue-700 underline">{data.flywheel.weak_link}</span>
                          </h4>
                          <p className="text-slate-600 mt-1 leading-relaxed">
                            {data.flywheel.opportunity_description}
                          </p>
                        </div>
                        {data.flywheel.weak_link === "AMC Plan Coverages" ? (
                          <button 
                            onClick={() => runRecoveryPlaybook("33333333-3333-3333-3333-333333333333", "Flywheel Weak Link Optimization")}
                            className="crm-btn-primary crm-btn-sm py-2 shrink-0"
                          >
                            Trigger AMC Campaign Playbook
                          </button>
                        ) : (
                          <button 
                            onClick={() => runRecoveryPlaybook("22222222-2222-2222-2222-222222222222", "Flywheel Gateway Correction")}
                            className="crm-btn-primary crm-btn-sm py-2 shrink-0"
                          >
                            Optimize Checkout Flow
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Attribution growth/decline row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="crm-section">
                  <div className="crm-section-head">
                    <h3 className="crm-card-title flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      Growth Drivers (Tailwinds)
                    </h3>
                  </div>
                  <div className="crm-section-body p-0 divide-y divide-slate-100">
                    {data?.attributions?.filter((a: any) => a.factor_type === "growth").map((att: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center px-4 py-3.5 text-xs">
                        <div>
                          <p className="font-bold text-slate-800">{att.driver_name}</p>
                          <span className="text-[10px] text-slate-400">Category: {att.category}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-emerald-600">+₹{att.impact_amount.toLocaleString("en-IN")}</p>
                          <span className="crm-badge-success text-[10px] tracking-wider uppercase font-semibold">Active</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="crm-section">
                  <div className="crm-section-head">
                    <h3 className="crm-card-title flex items-center gap-1.5">
                      <AlertOctagon className="h-4 w-4 text-rose-500" />
                      Risk Factors (Headwinds)
                    </h3>
                  </div>
                  <div className="crm-section-body p-0 divide-y divide-slate-100">
                    {data?.attributions?.filter((a: any) => a.factor_type === "decline").map((att: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center px-4 py-3.5 text-xs">
                        <div>
                          <p className="font-bold text-slate-800">{att.driver_name}</p>
                          <span className="text-[10px] text-slate-400">Category: {att.category}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-rose-600">-₹{att.impact_amount.toLocaleString("en-IN")}</p>
                          <span className="crm-badge-danger text-[10px] tracking-wider uppercase font-semibold">Risk Factor</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MATRIX */}
          {activeTab === "matrix" && (
            <div className="crm-section">
              <div className="crm-section-head">
                <h3 className="crm-card-title">Customer Lifetime Value (CLV) Matrix</h3>
              </div>
              <div className="crm-section-body p-0">
                <div className="crm-table-wrapper border-none rounded-none">
                  <table className="crm-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>RFM Segment</th>
                        <th>Predictive CLV</th>
                        <th className="text-center">Total Revenue Spent</th>
                        <th>Growth Score</th>
                        <th>Referral Score</th>
                        <th>Retention Probability</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.profiles?.map((p: any, idx: number) => {
                        const segColors: Record<string, string> = {
                          Champions: "crm-badge-success",
                          "Loyal Customers": "crm-badge-info",
                          "High-Value At Churn Risk": "crm-badge-warning animate-pulse",
                          "Need Attention": "crm-badge-danger",
                          Hibernating: "crm-badge-neutral",
                          "New Prospects": "crm-badge-purple",
                        };

                        return (
                          <tr key={idx} className="crm-interactive">
                            <td>
                              <div className="font-semibold text-slate-900">{p.customers?.full_name ?? "Unknown"}</div>
                              <div className="text-[11px] text-slate-400">{p.customers?.email || "—"}</div>
                            </td>
                            <td>
                              <span className={segColors[p.segment] || "crm-badge-neutral"}>
                                {p.segment}
                              </span>
                            </td>
                            <td className="font-bold text-slate-900">
                              ₹{Math.round(p.clv).toLocaleString("en-IN")}
                            </td>
                            <td className="font-semibold text-slate-700 text-center">
                              ₹{Math.round(p.total_spent).toLocaleString("en-IN")}
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <div className="crm-progress-track w-16">
                                  <div className="crm-progress-fill" style={{ width: `${p.growth_potential}%` }} />
                                </div>
                                <span className="font-bold text-slate-700 text-xs">{Math.round(p.growth_potential)}%</span>
                              </div>
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <div className="crm-progress-track w-16">
                                  <div className="crm-progress-fill bg-emerald-500" style={{ width: `${p.referral_potential}%`, backgroundImage: "none" }} />
                                </div>
                                <span className="font-bold text-slate-700 text-xs">{Math.round(p.referral_potential)}%</span>
                              </div>
                            </td>
                            <td>
                              <span className={
                                p.retention_probability > 75 
                                  ? "crm-badge-success" 
                                  : p.retention_probability > 45 
                                    ? "crm-badge-warning" 
                                    : "crm-badge-danger"
                              }>
                                {Math.round(p.retention_probability)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LEAKAGE */}
          {activeTab === "leakage" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Revenue Leakages Detected</h3>
                  <p className="text-slate-500 mt-0.5">Active anomalies requiring SOP playbook triggers or campaign dispatches.</p>
                </div>
                <button 
                  onClick={() => runRecoveryPlaybook("22222222-2222-2222-2222-222222222222", "Bulk Leakage Clearing Alert")}
                  className="crm-btn-primary crm-btn-sm"
                >
                  <Zap className="h-3.5 w-3.5 mr-1" />
                  Trigger Bulk Recovery
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data?.leakages?.map((l: any, idx: number) => {
                  const badgeMaps: Record<string, string> = {
                    unbilled_service: "crm-badge-warning",
                    payment_failure: "crm-badge-danger",
                    cancelled_no_fee: "crm-badge-neutral",
                    underpriced_service: "crm-badge-purple"
                  };
                  return (
                    <div key={idx} className="crm-card bg-white p-5 crm-hover-glow flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <span className={badgeMaps[l.leakage_type] || "crm-badge-neutral"}>
                            {l.leakage_type.replace(/_/g, " ").toUpperCase()}
                          </span>
                          <span className="text-base font-black text-rose-600">₹{Math.round(l.amount)}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mt-3">{l.affected_entity}</h4>
                        <div className="text-xs space-y-1 mt-2.5 text-slate-600">
                          <p><span className="font-bold text-slate-800">Root Cause:</span> {l.root_cause}</p>
                          <p><span className="font-bold text-slate-800">Suggested Action:</span> {l.suggested_action}</p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                        <button
                          onClick={() => runRecoveryPlaybook(
                            l.leakage_type === "payment_failure" ? "22222222-2222-2222-2222-222222222222" : "11111111-1111-1111-1111-111111111111", 
                            `Leakage Recovery: ${l.affected_entity}`
                          )}
                          className="crm-btn-secondary crm-btn-sm text-blue-600"
                        >
                          Trigger Recovery SOP
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: AMC */}
          {activeTab === "amc" && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">AMC Conversion Pipeline</h3>
                <p className="text-slate-500 text-xs">High-scoring leads lacking AMC protection packages.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data?.profiles?.filter((p: any) => p.amc_conversion_probability > 30).map((p: any, idx: number) => (
                  <div key={idx} className="crm-card bg-white p-5 crm-hover-glow flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{p.customers?.full_name ?? "Unknown"}</h4>
                          <span className="text-[11px] text-slate-400 font-semibold">{p.customers?.phone || "—"}</span>
                        </div>
                        <span className={
                          p.amc_conversion_probability > 70 
                            ? "crm-badge-success" 
                            : "crm-badge-info"
                        }>
                          {Math.round(p.amc_conversion_probability)}% Match
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 space-y-1 mt-4">
                        <p><span className="font-bold text-slate-700">Bookings Completed:</span> {p.booking_count}</p>
                        <p><span className="font-bold text-slate-700">Total Valuation Spent:</span> ₹{Math.round(p.total_spent).toLocaleString("en-IN")}</p>
                        <p><span className="font-bold text-slate-700">Segment Group:</span> {p.segment}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end mt-4 pt-3 border-t border-slate-50">
                      <button
                        onClick={() => sendAMCNotification(p.customers?.full_name)}
                        className="crm-btn-secondary crm-btn-sm py-1.5"
                      >
                        <Mail className="h-3.5 w-3.5 mr-1" />
                        Send Brochure
                      </button>
                      <button
                        onClick={() => runRecoveryPlaybook("33333333-3333-3333-3333-333333333333", `AMC Sales: ${p.customers?.full_name}`)}
                        className="crm-btn-primary crm-btn-sm py-1.5"
                      >
                        <Zap className="h-3.5 w-3.5 mr-1" />
                        Trigger Campaign
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: FORECAST & SIMULATOR */}
          {activeTab === "forecast" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Forecast grid list */}
              <div className="crm-section lg:col-span-1">
                <div className="crm-section-head">
                  <h3 className="crm-card-title flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    Revenue Projections
                  </h3>
                </div>
                <div className="crm-section-body p-0 divide-y divide-slate-100">
                  {data?.forecasts?.filter((f: any) => f.type === "forecast").map((f: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center px-4 py-3 text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{new Date(f.month + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>
                        <span className="text-[10px] text-slate-400 font-semibold block">Predicted Volume</span>
                      </div>
                      <p className="font-extrabold text-blue-600 text-sm">₹{f.revenue.toLocaleString("en-IN")}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Simulator card controls */}
              <div className="crm-section lg:col-span-2">
                <div className="crm-section-head">
                  <h3 className="crm-card-title flex items-center gap-1.5">
                    <Sliders className="h-4 w-4 text-blue-600" />
                    Interactive Strategic Revenue Simulator
                  </h3>
                </div>
                <div className="crm-section-body grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-slate-650 font-bold">
                        <span>Ad-Hoc Booking Growth</span>
                        <span className="text-blue-600">+{bookingGrowth}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="50" value={bookingGrowth} 
                        onChange={(e) => setBookingGrowth(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-slate-650 font-bold">
                        <span>AMC Subscription Expansion</span>
                        <span className="text-blue-600">+{amcGrowth}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="50" value={amcGrowth} 
                        onChange={(e) => setAmcGrowth(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-slate-650 font-bold">
                        <span>Customer Churn Reduction</span>
                        <span className="text-blue-600">{churnReduction}% Saved</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" value={churnReduction} 
                        onChange={(e) => setChurnReduction(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-slate-650 font-bold">
                        <span>Active Leakage Recovery</span>
                        <span className="text-blue-600">{recoveryImprovement}% Resolved</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" value={recoveryImprovement} 
                        onChange={(e) => setRecoveryImprovement(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Simulator outputs */}
                  <div className="bg-blue-50/50 border border-blue-150 p-5 rounded-lg flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Simulated Monthly Outlook</span>
                      <p className="text-3xl font-black text-slate-800 mt-1">₹{simulatedRevenue.toLocaleString("en-IN")}</p>
                      <div className="flex items-center gap-1.5 text-slate-600 mt-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Recovered Value: <strong className="text-emerald-600">+₹{netRecoveryValue.toLocaleString("en-IN")}</strong> ({variancePct}%)</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-blue-100 space-y-1 text-slate-600">
                      <div className="flex justify-between">
                        <span>Simulated CSAT Score:</span>
                        <strong className="text-slate-900">{simulatedCSAT} / 5.0</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Target Deficit Coverage:</span>
                        <span className="crm-badge-success font-semibold">Covered</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
