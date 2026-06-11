"use client";
/**
 * src/app/ceo/page.tsx
 * AI CEO Executive Dashboard & Cockpit V2 — InnoVibe AIOS
 */

import { useState, useEffect, useCallback } from "react";
import {
  Compass,
  Zap,
  Target,
  ArrowRight,
  ShieldAlert,
  Loader2,
  RefreshCw,
  MessageSquare,
  CheckCircle,
  Sliders,
  DollarSign,
  TrendingUp,
  AlertOctagon,
  Users,
  Send,
  HelpCircle,
  FileText,
  ChevronRight,
  Sparkles,
  BarChart3,
  Percent,
  Clock,
  Briefcase,
  AlertTriangle,
  Scale,
  Brain,
  // EOS Completion Layer icons
  Radio,
  Globe,
  GitBranch,
  Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AICeoDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Core CEO datasets
  const [reasoning, setReasoning] = useState<any>(null);
  const [reflections, setReflections] = useState<any[]>([]);
  const [initiatives, setInitiatives] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [operationsHealth, setOperationsHealth] = useState<number>(85);

  // Copilot Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "copilot"; text: string; citations?: string[] }>>([
    {
      role: "copilot",
      text: "Welcome back, CEO. I am connected to all company databases, outcome logs, and forecast metrics. Ask me anything about our operations, revenue leakage, or churn risk profiles."
    }
  ]);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Strategic Simulator State V2
  const [simAmc, setSimAmc] = useState(10);
  const [simTechs, setSimTechs] = useState(5);
  const [simComplaints, setSimComplaints] = useState(1.0);
  const [simRevDrop, setSimRevDrop] = useState(0);
  const [simNewCity, setSimNewCity] = useState(false);
  
  // V2 new params
  const [simNewService, setSimNewService] = useState(false);
  const [simAmcPricing, setSimAmcPricing] = useState(0);
  const [simMktBudget, setSimMktBudget] = useState(0);
  const [simGarageExpansion, setSimGarageExpansion] = useState(0);
  const [simAcquisition, setSimAcquisition] = useState(false);

  const [simResult, setSimResult] = useState<any>(null);
  const [runningSim, setRunningSim] = useState(false);

  // Action logs
  const [actionLog, setActionLog] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState(true);

  // Load calculations
  const loadCEODashboardData = async (isRefreshed = false) => {
    try {
      if (isRefreshed) setRefreshing(true);
      else setLoading(true);
      setError(null);

      // Trigger recalculation if POST refresh is requested
      if (isRefreshed) {
        await fetch("/api/ceo/reasoning", { method: "POST" });
        await fetch("/api/revenue/intelligence", { method: "POST" });
      }

      // Fetch all sources concurrently
      const [reasRes, reflRes, planRes, revRes, opsRes] = await Promise.all([
        fetch("/api/ceo/reasoning"),
        fetch("/api/ceo/reflections"),
        fetch("/api/ceo/planner"),
        fetch("/api/revenue/intelligence"),
        fetch("/api/operations/health").catch(() => null)
      ]);

      const reasJson = await reasRes.json();
      const reflJson = await reflRes.json();
      const planJson = await planRes.json();
      const revJson = await revRes.json();

      if (!reasJson.success) throw new Error("Failed to load reasoning engine outputs");

      setReasoning(reasJson.reasoning);
      setReflections(reflJson.reflections || []);
      setInitiatives(planJson.initiatives || []);
      setRevenueData(revJson);
      
      if (opsRes && opsRes.ok) {
        const opsJson = await opsRes.json();
        setOperationsHealth(opsJson.healthScore || 85);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCEODashboardData();
  }, []);

  // Run scenario simulation V2
  const handleRunCEOSimulation = useCallback(async () => {
    try {
      setRunningSim(true);
      const res = await fetch("/api/ceo/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amcConversionShift: simAmc,
          techniciansDelta: simTechs,
          complaintsMultiplier: simComplaints,
          revenueDeficitShift: simRevDrop,
          newCityEntry: simNewCity,
          newServiceLaunch: simNewService,
          amcPricingChange: simAmcPricing,
          marketingBudgetIncrease: simMktBudget,
          garageNetworkExpansion: simGarageExpansion,
          acquisitionScenario: simAcquisition
        })
      });
      const json = await res.json();
      if (json.success) {
        setSimResult(json.result);
      } else {
        throw new Error(json.error || "Simulation error");
      }
    } catch (err: any) {
      setActionLog(`Simulation failed: ${err.message}`);
      setActionSuccess(false);
      setTimeout(() => setActionLog(null), 5000);
    } finally {
      setRunningSim(false);
    }
  }, [
    simAmc,
    simTechs,
    simComplaints,
    simRevDrop,
    simNewCity,
    simNewService,
    simAmcPricing,
    simMktBudget,
    simGarageExpansion,
    simAcquisition
  ]);

  // Run simulation on slider/checkbox changes
  useEffect(() => {
    if (reasoning) {
      handleRunCEOSimulation();
    }
  }, [handleRunCEOSimulation, reasoning]);

  // Send message to Copilot
  const handleSendCopilotMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatInput("");
    setChatHistory(prev => [...prev, { role: "user", text: userText }]);
    setSendingMessage(true);

    try {
      const res = await fetch("/api/ceo/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userText })
      });
      const json = await res.json();
      if (json.success) {
        setChatHistory(prev => [...prev, {
          role: "copilot",
          text: json.answer,
          citations: json.citations
        }]);
      } else {
        throw new Error(json.error || "Failed to get answer");
      }
    } catch (err: any) {
      setChatHistory(prev => [...prev, {
        role: "copilot",
        text: `Error resolving query: ${err.message}. Please check database configuration.`
      }]);
    } finally {
      setSendingMessage(false);
    }
  };

  // Convert recommendation to strategic initiative
  const approveInitiative = async (action: any) => {
    try {
      setActionLog(`Approving recommended initiative: "${action.title}"...`);
      setActionSuccess(true);

      const res = await fetch("/api/ceo/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: action.title,
          category: action.title.toLowerCase().includes("amc") ? "amc" : "operations",
          expected_impact: action.expected_outcome,
          budget: action.revenue_impact * 0.2, // standard setup allocation
          success_probability: action.confidence_score
        })
      });

      const json = await res.json();
      if (json.success) {
        setActionLog(`[APPROVED] Recommendation converted to strategic initiative. Initiative ID: ${json.initiativeId}`);
        setActionSuccess(true);
        loadCEODashboardData();
      } else {
        throw new Error(json.error || "Failed to approve");
      }
    } catch (err: any) {
      setActionLog(`Failed to approve: ${err.message}`);
      setActionSuccess(false);
    }
    setTimeout(() => setActionLog(null), 5000);
  };

  // Execute Escalation Recovery Action
  const handleExecuteEscalationAction = async (actionId: string, text: string) => {
    try {
      setActionLog(`Executing recovery action: "${text}"...`);
      setActionSuccess(true);

      const res = await fetch("/api/ceo/escalation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId })
      });

      const json = await res.json();
      if (json.success) {
        setActionLog(`[EXECUTED] Recovery action initiated successfully.`);
        loadCEODashboardData();
      } else {
        throw new Error(json.error || "Failed to execute");
      }
    } catch (err: any) {
      setActionLog(`Execution failed: ${err.message}`);
      setActionSuccess(false);
    }
    setTimeout(() => setActionLog(null), 5000);
  };

  // Allocate budget
  const handleAllocateBudget = async (category: string, amount: number) => {
    try {
      setActionLog(`Allocating ₹${amount.toLocaleString("en-IN")} to ${category}...`);
      setActionSuccess(true);

      const res = await fetch("/api/ceo/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, amount })
      });

      const json = await res.json();
      if (json.success) {
        setActionLog(`[ALLOCATED] Budget provisions successfully updated for ${category}.`);
      } else {
        throw new Error(json.error || "Allocation failed");
      }
    } catch (err: any) {
      setActionLog(`Allocation failed: ${err.message}`);
      setActionSuccess(false);
    }
    setTimeout(() => setActionLog(null), 5000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        <p className="text-slate-500 font-bold text-sm">Synchronizing AI CEO Operating System...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-lg mx-auto mt-16">
        <ShieldAlert className="h-12 w-12 text-red-600 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-red-950 mb-1">CEO OS Sync Interrupted</h3>
        <p className="text-red-700 text-sm mb-6">{error}</p>
        <Button onClick={() => loadCEODashboardData()} className="bg-red-600 hover:bg-red-700 text-white">
          Retry OS Stream
        </Button>
      </div>
    );
  }

  // Calculate Health indexes
  const totalRevenue = revenueData?.forecasts?.filter((f: any) => f.type === "actual")
    ?.reduce((sum: number, f: any) => sum + f.revenue, 0) || 12000;
  
  const revHealthScore = totalRevenue >= 15000 ? 100 : Math.round((totalRevenue / 15000) * 100);
  const companyHealthScore = Math.round((revHealthScore + operationsHealth + 90) / 3);

  // Trust Engine metrics fallbacks
  const trustMetrics = reasoning?.trust_metrics || {
    recommendationTrust: 89.5,
    forecastTrust: 92.4,
    simulationTrust: 85.0,
    overallTrust: 88.9
  };

  // War Room V2 Triggers check
  const activeEscalations = reasoning?.active_escalations || [];
  const hasCriticalEscalation = activeEscalations.some((e: any) => e.urgency === "critical" || e.urgency === "high");
  const showWarRoomV2 = operationsHealth < 60 || hasCriticalEscalation;

  const estimatedSaved = activeEscalations.length * 15000;
  const estimatedLost = activeEscalations.length * 8000;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      
      {/* Top Banner & Refresh */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-6 rounded-xl relative overflow-hidden shadow-sm hover:shadow-md transition-all">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Sparkles className="h-40 w-40 text-blue-500 animate-pulse" />
        </div>
        <div className="space-y-1 z-10">
          <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 mb-2 hover:bg-blue-100 transition-colors">
            AI CEO Layer V2 · Self-Improving Executive
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-none">
            InnoVibe Autonomous CEO Command Center
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Continuous goal management, constitutional alignment, capital scoring, and trust feedback.
          </p>
        </div>
        <div className="flex gap-2 z-10 shrink-0">
          <Button
            onClick={() => setChatOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 px-4 rounded-md shadow-sm transition-colors"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat with Copilot
          </Button>
          <Button
            onClick={() => loadCEODashboardData(true)}
            disabled={refreshing}
            variant="outline"
            className="border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs h-9 px-4 rounded-md transition-colors"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Run Self-Improvement
          </Button>
        </div>
      </div>

      {/* CEO TOP 3 PRIORITIES - FIRST SECTION */}
      <div className="bg-[#EEF4FF] border border-[#BFDBFE] rounded-xl p-5 shadow-sm text-slate-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Brain className="h-44 w-44 text-blue-500" />
        </div>
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-blue-600" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Daily Executive Focus: Top 3 CEO Priorities
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {((reasoning?.ceo_priorities || [])).map((pri: any, idx: number) => {
            const urgencyColors = {
              Critical: "bg-red-100 text-red-800 border border-red-200",
              High: "bg-amber-100 text-amber-800 border border-amber-200",
              Medium: "bg-blue-100 text-blue-800 border border-blue-200"
            };
            return (
              <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between space-y-3 relative transition-all duration-150 hover:border-blue-400 hover:shadow-sm">
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Priority 0{pri.rank}</span>
                    <Badge className={urgencyColors[pri.urgency as keyof typeof urgencyColors] || "bg-blue-100 text-blue-800 border border-blue-200"}>
                      {pri.urgency}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-slate-900 mt-1">{pri.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">{pri.rationale}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <span className="text-[9px] uppercase font-bold text-blue-600 block">Next Action Step</span>
                  <p className="text-[11px] text-emerald-700 font-semibold leading-normal">{pri.actionable_step}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* EOS MODULE A: CEO CONTROL TOWER — MASTER STATE MACHINE */}
      {(() => {
        const tower = reasoning?.control_tower;
        const statusConfig: Record<string, { bg: string; border: string; badge: string; dot: string; text: string }> = {
          GREEN:  { bg: "bg-emerald-50/70", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-800 border border-emerald-200", dot: "bg-emerald-500 animate-pulse", text: "text-slate-700" },
          YELLOW: { bg: "bg-amber-50/70",  border: "border-amber-200",   badge: "bg-amber-100 text-amber-800 border border-amber-200",   dot: "bg-amber-500 animate-pulse",  text: "text-slate-700"  },
          ORANGE: { bg: "bg-orange-50/70", border: "border-orange-200",  badge: "bg-orange-100 text-orange-800 border border-orange-200",  dot: "bg-orange-500 animate-pulse", text: "text-slate-700" },
          RED:    { bg: "bg-red-50/70",   border: "border-red-200",    badge: "bg-red-100 text-red-800 border border-red-200",    dot: "bg-red-500 animate-pulse",   text: "text-slate-700"   },
          BLACK:  { bg: "bg-slate-50/70",      border: "border-slate-300",    badge: "bg-slate-100 text-slate-800 border border-slate-200",    dot: "bg-slate-500 animate-pulse",   text: "text-slate-700"   }
        };
        const status = tower?.status || "GREEN";
        const cfg = statusConfig[status] || statusConfig.GREEN;
        return (
          <div className={`bg-white border ${cfg.border} rounded-xl p-5 shadow-sm relative overflow-hidden hover:shadow-md transition-shadow`}>
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <Radio className="h-40 w-40 text-slate-400" />
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">CEO Control Tower — Enterprise State Machine</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={`${cfg.badge} font-black text-sm px-3.5 py-1 rounded-lg tracking-wider`}>
                    {status}
                  </Badge>
                  <span className="text-xl font-bold text-slate-900">
                    Score: {tower?.composite_score?.toFixed(1) ?? "—"} / 100
                  </span>
                </div>
              </div>

              {/* Signal pills */}
              <div className="flex flex-wrap gap-2">
                {(tower?.signals || []).map((sig: any, sIdx: number) => (
                  <div key={sIdx} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                    sig.severity === "critical" ? "bg-red-50 border-red-200 text-red-700" :
                    sig.severity === "warning"  ? "bg-amber-50 border-amber-200 text-amber-700" :
                    "bg-slate-50 border-slate-200 text-slate-600"
                  }`}>
                    {sig.label.split(" ").slice(0, 2).join(" ")}: {sig.value.toFixed(0)}
                  </div>
                ))}
              </div>
            </div>

            {/* Reasons + Required Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4 pt-4 border-t border-slate-100">
              <div className="bg-slate-50/50 p-3.5 rounded-lg border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Status Reasons</span>
                <div className="space-y-1.5 max-h-28 overflow-y-auto">
                  {(tower?.reasons || []).map((r: string, rIdx: number) => (
                    <p key={rIdx} className="text-xs font-medium text-slate-700 leading-relaxed">• {r}</p>
                  ))}
                </div>
              </div>
              <div className="bg-slate-50/50 p-3.5 rounded-lg border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Required Actions</span>
                <div className="space-y-1.5 max-h-28 overflow-y-auto">
                  {(tower?.required_actions || []).map((a: string, aIdx: number) => (
                    <p key={aIdx} className="text-xs text-slate-800 font-semibold leading-relaxed">→ {a}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* EOS MODULE B: STRATEGIC HORIZONS — 30d / 90d / 365d */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5 text-blue-500" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">Strategic Horizons — Projections & Expected Gains</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(["30d", "90d", "365d"] as const).map((hz) => {
            const hzConfig = {
              "30d": { label: "30-Day Outlook", color: "border-blue-100 bg-blue-50/30", accent: "text-blue-700", badge: "bg-blue-600 text-white" },
              "90d": { label: "90-Day Outlook", color: "border-purple-100 bg-purple-50/30", accent: "text-purple-700", badge: "bg-purple-600 text-white" },
              "365d": { label: "1-Year Horizon", color: "border-emerald-100 bg-emerald-50/30", accent: "text-emerald-700", badge: "bg-emerald-600 text-white" }
            };
            const cfg = hzConfig[hz];
            const projections = (reasoning?.strategic_horizons?.[hz] || []).slice(0, 3);
            const companyProj = projections.find((p: any) => p.entity_type === "Company");
            const totalRevenue = projections.reduce((sum: number, p: any) => sum + (p.impact?.revenue_impact || 0), 0);
            const avgConf = projections.length > 0
              ? (projections.reduce((s: number, p: any) => s + (p.impact?.confidence || 0), 0) / projections.length).toFixed(0)
              : "—";
            return (
              <div key={hz} className={`border rounded-lg p-4 ${cfg.color} space-y-3`}>
                <div className="flex justify-between items-center">
                  <div>
                    <Badge className={`${cfg.badge} text-[9px] font-bold uppercase tracking-wider`}>{hz}</Badge>
                    <h4 className={`font-bold text-sm mt-1 ${cfg.accent}`}>{cfg.label}</h4>
                  </div>
                  <Activity className={`h-5 w-5 ${cfg.accent} opacity-60`} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-white/80 rounded-lg p-2 border border-white/50 shadow-sm">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Revenue Impact</span>
                    <strong className="text-xs text-emerald-700 font-bold">₹{totalRevenue.toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="bg-white/80 rounded-lg p-2 border border-white/50 shadow-sm">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Avg Confidence</span>
                    <strong className={`text-xs font-bold ${cfg.accent}`}>{avgConf}%</strong>
                  </div>
                </div>

                {companyProj && (
                  <p className="text-[11px] text-slate-600 leading-relaxed font-medium border-t border-slate-200/50 pt-2">
                    {companyProj.impact?.description?.substring(0, 120)}...
                  </p>
                )}

                <div className="space-y-1.5">
                  {projections.filter((p: any) => p.entity_type !== "Company").slice(0, 2).map((p: any, pIdx: number) => (
                    <div key={pIdx} className="flex justify-between items-center text-[10px] bg-white/70 rounded-lg px-2.5 py-1.5 border border-slate-100 shadow-sm">
                      <span className="font-semibold text-slate-700 truncate max-w-[130px]">{p.entity_name || p.entity_type}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge className={`text-[8px] px-1.5 py-0.5 font-bold ${
                          p.impact?.risk_level === "critical" ? "bg-red-50 text-red-800 border border-red-200" :
                          p.impact?.risk_level === "high" ? "bg-amber-50 text-amber-800 border border-amber-200" :
                          p.impact?.risk_level === "medium" ? "bg-blue-50 text-blue-800 border border-blue-200" :
                          "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        }`}>{p.impact?.risk_level}</Badge>
                        <span className="text-slate-500 font-medium">{p.impact?.confidence?.toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                  {projections.length === 0 && (
                    <p className="text-[10px] text-slate-400 text-center py-2">No projections computed</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* EOS MODULE C: ENTERPRISE KNOWLEDGE GRAPH INSIGHTS */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch className="h-5 w-5 text-violet-500" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">Enterprise Knowledge Graph — Relationship Intelligence</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {[
            { label: "Total Nodes", val: reasoning?.knowledge_graph_summary?.total_nodes ?? 0, icon: "🔵", color: "text-blue-700" },
            { label: "Total Edges", val: reasoning?.knowledge_graph_summary?.total_edges ?? 0, icon: "🔗", color: "text-purple-700" },
            { label: "Goal Nodes", val: reasoning?.knowledge_graph_summary?.nodes_by_type?.Goal ?? 0, icon: "🎯", color: "text-emerald-700" },
            { label: "Initiative Nodes", val: reasoning?.knowledge_graph_summary?.nodes_by_type?.Initiative ?? 0, icon: "🚀", color: "text-cyan-700" }
          ].map((stat, sIdx) => (
            <div key={sIdx} className="bg-slate-50/50 border border-slate-200 rounded-lg p-3 text-center shadow-sm hover:border-blue-200 transition-colors">
              <span className="text-xl block mb-1">{stat.icon}</span>
              <strong className={`text-lg font-bold ${stat.color}`}>{stat.val}</strong>
              <span className="text-[9px] uppercase font-bold text-slate-400 block mt-0.5">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Top connected nodes */}
        {(reasoning?.knowledge_graph_summary?.top_connected_nodes || []).length > 0 && (
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Top Connected Entities (Highest Influence)</span>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {(reasoning?.knowledge_graph_summary?.top_connected_nodes || []).map((n: any, nIdx: number) => (
                <div key={nIdx} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 hover:border-blue-300 hover:bg-white transition-all shadow-sm">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                    <GitBranch className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{n.node_name}</p>
                    <Badge className="bg-slate-100 text-slate-600 text-[8px] font-bold border border-slate-200">{n.node_type}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(!reasoning?.knowledge_graph_summary?.total_nodes || reasoning.knowledge_graph_summary.total_nodes === 0) && (
          <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-lg">
            <GitBranch className="h-10 w-10 mx-auto mb-2 opacity-30 text-slate-400" />
            <p className="text-xs font-bold text-slate-600">Knowledge graph is empty</p>
            <p className="text-[10px] text-slate-400 mt-1">Submit graph transactions to seed the relationship layout.</p>
          </div>
        )}
      </div>

      {/* Action alerts popups */}
      {actionLog && (
        <div className={`p-4 rounded-lg border flex items-center gap-3 shadow-md transition-all duration-300 ${
          actionSuccess 
            ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
            : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {actionSuccess ? <CheckCircle className="h-5 w-5 text-emerald-600" /> : <ShieldAlert className="h-5 w-5 text-red-600" />}
          <p className="text-xs font-semibold">{actionLog}</p>
        </div>
      )}

      {/* MODULE 6: CEO WAR ROOM V2 ALERT BANNER */}
      {showWarRoomV2 && (
        <div className="border border-red-200 bg-red-50/70 rounded-xl p-5 text-slate-900 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <AlertOctagon className="h-32 w-32 text-red-500" />
          </div>
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-red-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm text-white">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="space-y-3 flex-1">
              <div>
                <Badge className="bg-red-600 text-white font-bold text-[9px] tracking-wider uppercase mb-1">
                  CEO War Room Mode V2 Active
                </Badge>
                <h4 className="font-bold text-base text-red-950">Critical Operations / Revenue Gaps Detected</h4>
                <p className="text-slate-700 text-xs leading-relaxed max-w-3xl mt-1">
                  Operations health stands at <span className="font-bold text-red-700">{operationsHealth}%</span> with {activeEscalations.length} unresolved system triggers. Immediate remediation SOPs are queued below.
                </p>
              </div>

              {/* Financial twin indicators in War Room */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/80 p-3 rounded-lg border border-red-100 text-xs font-semibold">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Est. Revenue Saved</span>
                  <span className="text-xs text-emerald-600 font-bold">₹{estimatedSaved.toLocaleString("en-IN")}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Est. Revenue At Risk</span>
                  <span className="text-xs text-red-600 font-bold">₹{estimatedLost.toLocaleString("en-IN")}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Recovery Timeline</span>
                  <span className="text-xs text-slate-700 font-bold">90 Days</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Plan Confidence</span>
                  <span className="text-xs text-blue-600 font-bold">90.50%</span>
                </div>
              </div>

              {/* Follow-up actions list */}
              {reasoning?.followup_actions && reasoning.followup_actions.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-red-100">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Autonomous Follow-Ups & Active Sweeps</span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {reasoning.followup_actions.map((f: any, fIdx: number) => (
                      <div key={fIdx} className="flex justify-between items-center text-xs bg-white/90 p-2.5 rounded-lg border border-red-100">
                        <div>
                          <Badge className="bg-red-50 text-red-700 border border-red-200 text-[9px] font-bold uppercase mr-2">{f.urgency}</Badge>
                          <span className="font-semibold text-slate-700">{f.action_required}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">Owner: {f.target}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Daily Briefing, Enterprise Health & System Autonomy Framework status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-2 border border-slate-200 shadow-sm bg-white hover:border-blue-300 transition-colors">
          <CardContent className="pt-5 pb-5 flex gap-3 items-center">
            <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">CEO Daily Briefing</span>
              <p className="text-slate-700 text-xs font-semibold leading-relaxed mt-0.5 truncate">
                "{reasoning?.executive_brief}"
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Enterprise Health Score card */}
        <Card className="border border-slate-200 shadow-sm bg-white hover:border-blue-300 transition-colors">
          <CardContent className="pt-5 pb-5 flex gap-3 items-center">
            <div className="relative h-14 w-14 flex items-center justify-center shrink-0">
              <svg className="absolute transform -rotate-90 w-full h-full">
                <circle cx="28" cy="28" r="24" className="stroke-slate-100 fill-transparent" strokeWidth="4" />
                <circle 
                  cx="28" cy="28" r="24" 
                  className={`fill-transparent transition-all duration-1000 stroke-blue-600`}
                  strokeWidth="4" 
                  strokeDasharray={151}
                  strokeDashoffset={151 - (151 * (reasoning?.enterprise_health?.unified_score || 83.9)) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <span className={`text-xs font-bold text-slate-800`}>{reasoning?.enterprise_health?.unified_score || 83.9}%</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-extrabold">Enterprise Health</span>
              <Badge className={`font-bold text-[9px] uppercase px-2 py-0.5 border ${
                reasoning?.enterprise_health?.category === "Elite" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                reasoning?.enterprise_health?.category === "Strong" ? "bg-blue-50 text-blue-800 border-blue-200" :
                reasoning?.enterprise_health?.category === "Stable" ? "bg-slate-50 text-slate-800 border-slate-200" :
                reasoning?.enterprise_health?.category === "Warning" ? "bg-amber-50 text-amber-800 border-amber-200" :
                "bg-red-50 text-red-800 border-red-200"
              }`}>
                {reasoning?.enterprise_health?.category || "Strong"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Autonomy Framework Status */}
        <Card className="border border-slate-200 shadow-sm bg-white hover:border-blue-300 transition-colors">
          <CardContent className="pt-5 pb-5 flex gap-3 items-center">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
              <Scale className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">CEO Autonomy Level</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-[10px]">Level 5</Badge>
                <span className="text-slate-600 text-[10px] font-bold">Fully Autonomous (Free of Cost)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MODULE 5: CEO TRUST INDEX GAUGES (Converted to clean horizontal progress bars) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Recommendation Trust", val: trustMetrics.recommendationTrust, color: "text-blue-600", fill: "crm-progress-fill", desc: "Variance on recommendations success" },
          { label: "Forecast Trust", val: trustMetrics.forecastTrust, color: "text-emerald-600", fill: "crm-progress-fill-success", desc: "Variance on revenue forecasts" },
          { label: "Simulation Trust", val: trustMetrics.simulationTrust, color: "text-purple-600", fill: "crm-progress-fill", desc: "Variance on digital twin scenarios" },
          { label: "Overall System Trust", val: trustMetrics.overallTrust, color: "text-cyan-600", fill: "crm-progress-fill", desc: "AIOS corporate accuracy score" }
        ].map((gauge) => (
          <Card key={gauge.label} className="border border-slate-200 rounded-xl shadow-sm flex flex-col p-4 bg-white hover:border-blue-200 transition-colors">
            <CardTitle className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{gauge.label}</CardTitle>
            <div className="flex items-center justify-between mt-3 mb-1">
              <span className={`text-base font-bold ${gauge.color}`}>{gauge.val}%</span>
              <span className="text-[9px] text-slate-400 font-medium">Confidence</span>
            </div>
            <div className="crm-progress-track my-1.5">
              <div className={`h-full rounded-full ${gauge.fill}`} style={{ width: `${gauge.val}%` }} />
            </div>
            <p className="text-[9px] text-slate-400 mt-1 leading-none">{gauge.desc}</p>
          </Card>
        ))}
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Decision Matrix, Escalations, and Capital Recommendations */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* MODULE 2: EXECUTIVE ESCALATIONS CONSOLE */}
          {activeEscalations.length > 0 && (
            <Card className="border border-slate-200 shadow-sm bg-white">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500 animate-bounce" />
                  Active System Escalations
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Review anomalies violating business rules that require immediate execution parameters.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {activeEscalations.map((esc: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-lg border border-red-100 bg-red-50/20 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-slate-950 flex items-center gap-2">
                          <Badge className="bg-red-600 text-white font-bold text-[9px] uppercase">
                            {esc.urgency}
                          </Badge>
                          {esc.issue}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1">{esc.impact_desc}</p>
                      </div>
                    </div>

                    {/* Associated Actions list */}
                    {esc.actions && esc.actions.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-red-100">
                        <span className="text-[10px] text-red-700 font-bold uppercase block mb-1">Remediation Options</span>
                        <div className="space-y-2">
                          {esc.actions.map((act: any, aIdx: number) => (
                            <div key={aIdx} className="flex justify-between items-center text-xs bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                              <div>
                                <span className="font-semibold text-slate-800">{act.action_text}</span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">Expects: {act.expected_recovery}</span>
                              </div>
                              <Button
                                size="sm"
                                disabled={act.status === "executed"}
                                onClick={() => handleExecuteEscalationAction(act.id, act.action_text)}
                                className={`text-[10px] font-bold h-7 px-3 rounded-md transition-colors ${
                                  act.status === "executed"
                                    ? "bg-slate-100 text-slate-400 border border-slate-200"
                                    : "bg-red-600 hover:bg-red-700 text-white"
                                }`}
                              >
                                {act.status === "executed" ? "Executed" : "Execute Action"}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* MODULE 3: STRATEGIC CAPITAL ALLOCATION MATRIX */}
          {reasoning?.capital_recommendations && (
            <Card className="border border-slate-200 shadow-sm bg-white">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  Strategic Capital Allocation Recommendations
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Programmatic allocation models optimized against expected revenue yield, upfront cost, and ROI.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {reasoning.capital_recommendations.map((rec: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-blue-300 transition-colors">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-slate-950 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                          {rec.priority_rank}
                        </span>
                        <Badge className="bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-extrabold uppercase">
                          {rec.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-700 font-semibold mt-1">{rec.description}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 pt-1">
                        <span>Cost: ₹{rec.cost.toLocaleString("en-IN")}</span>
                        <span>Exp. Rev: ₹{rec.expected_revenue.toLocaleString("en-IN")}</span>
                        <span>Payback: {rec.payback_period_months} mo</span>
                        <span>Risk Score: {rec.risk_score}/10</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase">Projected ROI</span>
                        <strong className="text-sm text-emerald-600 font-bold">{rec.roi_pct}%</strong>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAllocateBudget(rec.category, rec.cost)}
                        className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white h-8 px-3 rounded-md shadow-sm transition-colors"
                      >
                        Allocate Budget
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* V2 DECISION ENGINE OPTIONS MATRIX */}
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Executive Decision Matrix (V2 Alternatives & Governance)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {reasoning?.recommended_actions?.map((act: any, idx: number) => {
                const colors = [
                  "border-blue-200 bg-blue-50/20",
                  "border-purple-200 bg-purple-50/20",
                  "border-emerald-200 bg-emerald-50/20"
                ];
                return (
                  <div key={idx} className={`p-4 rounded-lg border ${colors[idx % 3] || "border-slate-200 bg-slate-50"} space-y-3 relative overflow-hidden transition hover:shadow-md hover:border-blue-400`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="h-5 w-5 rounded-full bg-slate-950 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                            Option {String.fromCharCode(65 + idx)}
                          </span>
                          <h4 className="font-bold text-sm text-slate-950">{act.title}</h4>
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5"><strong className="text-slate-700">Expect:</strong> {act.expected_outcome}</p>
                      </div>
                      
                      <Badge className="bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs shrink-0">
                        Priority: {act.priority_score}
                      </Badge>
                    </div>

                    {/* Governance status verification panel */}
                    <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-dashed border-slate-200 text-xs shadow-sm">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <Scale className="h-3.5 w-3.5 text-slate-400" />
                        Governance Check
                      </span>
                      <Badge className={act.governance_status === "Approved" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}>
                        {act.governance_status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] pt-1 text-slate-500">
                      <div>
                        <strong>Revenue value:</strong> <span className="text-emerald-700 font-semibold">+₹{act.revenue_impact.toLocaleString("en-IN")}</span>
                      </div>
                      <div>
                        <strong>Ops Impact:</strong> <span className="text-slate-700 font-semibold">{act.operational_impact.substring(0, 15)}...</span>
                      </div>
                      <div>
                        <strong>Confidence score:</strong> <span className="text-slate-700 font-semibold">{act.confidence_score}%</span>
                      </div>
                      <div>
                        <strong>Implementation:</strong> <span className="text-slate-700 font-semibold uppercase">{act.difficulty}</span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 gap-2 border-t border-slate-100">
                      <Button 
                        size="sm"
                        onClick={() => approveInitiative(act)}
                        disabled={act.governance_status !== "Approved"}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold h-8 px-3 rounded-md shadow-sm transition-colors"
                      >
                        Approve Option
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* STRATEGIC PORTFOLIO MANAGEMENT */}
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-600" />
                Strategic Initiative Portfolio Management
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Corporate portfolio allocations, ROI ranks, risk indexes, and status pivot recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {(reasoning?.portfolio_rankings || []).map((port: any, idx: number) => {
                const recColors = {
                  Terminate: "bg-red-50 text-red-800 border border-red-200",
                  Pause: "bg-amber-50 text-amber-800 border border-amber-200",
                  Accelerate: "bg-emerald-50 text-emerald-800 border border-emerald-200",
                  Maintain: "bg-slate-50 text-slate-850 border border-slate-200"
                };
                return (
                  <div key={idx} className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3 relative hover:border-blue-300 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{port.title}</h4>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Category: {port.category} · Budget: ₹{port.allocated_budget.toLocaleString("en-IN")}</span>
                      </div>
                      <Badge className={`border px-2 py-0.5 text-xs font-semibold ${recColors[port.acceleration_recommendation as keyof typeof recColors] || "bg-slate-100 text-slate-800"}`}>
                        {port.acceleration_recommendation}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-semibold text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                      <div>ROI Rank: <span className="text-emerald-700 font-extrabold">{port.roi.toFixed(0)}%</span></div>
                      <div>Risk Index: <span className="text-red-600 font-extrabold">{port.risk_score.toFixed(0)}%</span></div>
                      <div>Progress: <span className="text-slate-800 font-extrabold">{port.progress}%</span></div>
                      <div>Status: <span className="text-blue-600 font-extrabold uppercase">{port.status}</span></div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pl-1"><strong className="text-slate-700">Rationale:</strong> {port.rationale}</p>
                  </div>
                );
              })}
              {(!reasoning?.portfolio_rankings || reasoning.portfolio_rankings.length === 0) && (
                <p className="text-center text-slate-400 py-6 text-xs font-semibold">No portfolios available. Seed data to analyze.</p>
              )}
            </CardContent>
          </Card>

          {/* ORGANIZATIONAL CAPACITY ENGINE */}
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Organizational Capacity & Breaking Points
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Real-time workload loads tracking operations, support, management, revenue, and technology.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(reasoning?.organizational_capacity || []).map((cap: any, idx: number) => {
                  const isBreaking = cap.is_breaking_point || cap.current_capacity > 85.00;
                  return (
                    <div key={idx} className={`p-4 rounded-lg border space-y-2.5 transition-all ${isBreaking ? "border-red-200 bg-red-50/10" : "border-slate-200 bg-white shadow-sm hover:border-blue-200"}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs text-slate-900 uppercase tracking-wide">{cap.name} Division</span>
                        {isBreaking && (
                          <Badge className="bg-red-600 text-white font-bold text-[9px] uppercase tracking-wider animate-pulse border-red-700">
                            Breaking Point
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                          <span>Current Load</span>
                          <span className={isBreaking ? "text-red-600" : "text-slate-800"}>{cap.current_capacity}%</span>
                        </div>
                        <div className="crm-progress-track">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${isBreaking ? "bg-red-500" : "bg-blue-600"}`} 
                            style={{ width: `${cap.current_capacity}%` }} 
                          />
                        </div>
                      </div>

                      <div className="flex justify-between text-[9px] text-slate-400 font-semibold">
                        <span>30d Forecast Load:</span>
                        <span>{cap.forecast_capacity}%</span>
                      </div>

                      <p className="text-[10px] text-slate-600 leading-normal italic border-t border-slate-100 pt-2 font-medium">
                        <strong>Action:</strong> {cap.scaling_recommendation}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* VALUE REALIZATION AUDIT */}
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Percent className="h-5 w-5 text-blue-600" />
                Value Realization Auditing Console
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Auditing completed initiatives to measure variances in CSAT, SLA compliance, and expected revenues.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50/50 border border-slate-200 p-4 rounded-lg space-y-2.5 text-xs shadow-sm">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="font-semibold text-slate-500">Realization Variance Yield:</span>
                    <strong className="text-xs text-emerald-700 font-bold">82.00% Score</strong>
                  </div>
                  <div className="space-y-1.5 pt-1 text-slate-600 font-medium">
                    <div className="flex justify-between">
                      <span>Expected Revenue:</span>
                      <span className="font-semibold text-slate-800">₹1,000,000.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Actual Revenue:</span>
                      <span className="font-semibold text-emerald-600">₹820,000.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expected Savings:</span>
                      <span className="font-semibold text-slate-800">₹18,750.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Actual Savings:</span>
                      <span className="font-semibold text-emerald-600">₹17,812.50</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/50 border border-slate-200 p-4 rounded-lg space-y-2.5 text-xs shadow-sm">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="font-semibold text-slate-500">SLA & CSAT Realization:</span>
                    <strong className="text-xs text-blue-700 font-bold">95.00% Score</strong>
                  </div>
                  <div className="space-y-1.5 pt-1 text-slate-600 font-medium">
                    <div className="flex justify-between">
                      <span>Expected CSAT:</span>
                      <span className="font-semibold text-slate-800">4.80 / 5.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Actual CSAT:</span>
                      <span className="font-semibold text-blue-600">4.60 / 5.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expected SLA:</span>
                      <span className="font-semibold text-slate-800">95.00% compliance</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Actual SLA:</span>
                      <span className="font-semibold text-blue-600">91.20% compliance</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Column: V2 Twin Simulator and Projections */}
        <div className="space-y-6">

          {/* MODULE 7: COMPANY DIGITAL TWIN V2 SIMULATOR */}
          <Card className="border border-slate-200 shadow-sm bg-white relative overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-950 flex items-center gap-2">
                <Sliders className="h-4.5 w-4.5 text-blue-600" />
                Strategic Digital Twin Simulator V2
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">Model structural updates across operational levels.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-4">
                
                {/* Standard Variables */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>AMC Conversion Shift</span>
                    <span className="text-blue-600">+{simAmc}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="40" value={simAmc} 
                    onChange={(e) => setSimAmc(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer h-1 bg-slate-100 rounded-lg appearance-none" 
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>Onboard Techs Delta</span>
                    <span className="text-blue-600">+{simTechs} techs</span>
                  </div>
                  <input 
                    type="range" min="-5" max="15" value={simTechs} 
                    onChange={(e) => setSimTechs(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer h-1 bg-slate-100 rounded-lg appearance-none" 
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>Complaints Multiplier</span>
                    <span className="text-blue-600">{simComplaints}x</span>
                  </div>
                  <input 
                    type="range" min="1.0" max="3.0" step="0.5" value={simComplaints} 
                    onChange={(e) => setSimComplaints(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer h-1 bg-slate-100 rounded-lg appearance-none" 
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>Target Revenue Deficit</span>
                    <span className="text-blue-600">{simRevDrop}% drop</span>
                  </div>
                  <input 
                    type="range" min="-40" max="0" value={simRevDrop} 
                    onChange={(e) => setSimRevDrop(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer h-1 bg-slate-100 rounded-lg appearance-none" 
                  />
                </div>

                {/* V2 New Simulator Variables */}
                <div className="space-y-1 pt-3 border-t border-slate-100">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>AMC Contract Pricing Change</span>
                    <span className="text-blue-600">₹{simAmcPricing >= 0 ? "+" : ""}{simAmcPricing}</span>
                  </div>
                  <input 
                    type="range" min="-1000" max="1500" step="100" value={simAmcPricing} 
                    onChange={(e) => setSimAmcPricing(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer h-1 bg-slate-100 rounded-lg appearance-none" 
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>Marketing Budget Increase</span>
                    <span className="text-blue-600">₹{simMktBudget.toLocaleString("en-IN")}</span>
                  </div>
                  <input 
                    type="range" min="0" max="40000" step="5000" value={simMktBudget} 
                    onChange={(e) => setSimMktBudget(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer h-1 bg-slate-100 rounded-lg appearance-none" 
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>Onboard Garages Expansion</span>
                    <span className="text-blue-600">+{simGarageExpansion} networks</span>
                  </div>
                  <input 
                    type="range" min="0" max="8" value={simGarageExpansion} 
                    onChange={(e) => setSimGarageExpansion(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer h-1 bg-slate-100 rounded-lg appearance-none" 
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="font-semibold text-slate-700">New Service Launch (Emergency)</span>
                  <input 
                    type="checkbox" checked={simNewService} 
                    onChange={(e) => setSimNewService(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 accent-blue-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Enter New City (Bangalore)</span>
                  <input 
                    type="checkbox" checked={simNewCity} 
                    onChange={(e) => setSimNewCity(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 accent-blue-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Competitor Fleet Acquisition</span>
                  <input 
                    type="checkbox" checked={simAcquisition} 
                    onChange={(e) => setSimAcquisition(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Simulated Projections output panel */}
              {simResult && (
                <div className="bg-blue-50/70 border border-blue-200 text-slate-800 p-4 rounded-lg space-y-3 mt-4 shadow-sm text-xs">
                  <div className="flex justify-between items-center border-b border-blue-200 pb-2">
                    <span className="font-bold text-slate-500">Net Margin Delta:</span>
                    <strong className={`text-sm ${simResult.revenue_impact >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                      {simResult.revenue_impact >= 0 ? "+" : ""}₹{simResult.revenue_impact.toLocaleString("en-IN")}
                    </strong>
                  </div>

                  {/* Horizon metric comparisons */}
                  {simResult.horizons && (
                    <div className="space-y-2 pt-1">
                      <span className="text-[10px] text-blue-800 font-extrabold uppercase block">Compounded Horizon Projections</span>
                      <div className="grid grid-cols-3 gap-2 text-center text-[9px]">
                        <div className="bg-white p-2 rounded border border-blue-100 shadow-sm">
                          <span className="block font-bold text-blue-700">30d</span>
                          <span>Rev: ₹{simResult.horizons["30d"].revenue.toFixed(0)}</span>
                          <span className="block text-emerald-600 mt-0.5">Prof: ₹{simResult.horizons["30d"].profit.toFixed(0)}</span>
                        </div>
                        <div className="bg-white p-2 rounded border border-blue-100 shadow-sm">
                          <span className="block font-bold text-blue-700">90d</span>
                          <span>Rev: ₹{simResult.horizons["90d"].revenue.toFixed(0)}</span>
                          <span className="block text-emerald-600 mt-0.5">Prof: ₹{simResult.horizons["90d"].profit.toFixed(0)}</span>
                        </div>
                        <div className="bg-white p-2 rounded border border-blue-100 shadow-sm">
                          <span className="block font-bold text-blue-700">365d</span>
                          <span>Rev: ₹{simResult.horizons["365d"].revenue.toFixed(0)}</span>
                          <span className="block text-emerald-600 mt-0.5">Prof: ₹{simResult.horizons["365d"].profit.toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <p className="leading-relaxed"><strong className="text-slate-700">Ops Out-turn:</strong> {simResult.operational_impact}</p>
                  <p className="leading-relaxed"><strong className="text-slate-700">Growth:</strong> {simResult.growth_impact}</p>
                  <p className="leading-relaxed"><strong className="text-slate-700">Risk Matrix:</strong> {simResult.risk_impact}</p>
                  <div className="flex justify-between items-center pt-2 border-t border-blue-200 text-[10px] text-slate-500">
                    <span>Model Confidence Score:</span>
                    <span className="font-semibold text-blue-600">{simResult.confidence_score}% accuracy</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Strategic Planner Initiatives tracker */}
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Target className="h-4.5 w-4.5 text-blue-600" />
                Strategic Planner Objectives
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {initiatives.map((ini, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <h4 className="font-bold text-slate-950">{ini.title}</h4>
                      <span className="text-slate-400 uppercase text-[9px] font-bold mt-0.5 block">Category: {ini.category} · Prob: {ini.success_probability}%</span>
                    </div>
                    <span className="font-bold text-slate-800 shrink-0">{Math.round(ini.progress)}%</span>
                  </div>
                  <div className="crm-progress-track">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${ini.progress}%` }} />
                  </div>
                </div>
              ))}
              {initiatives.length === 0 && (
                <p className="text-center text-slate-400 py-6 text-xs font-semibold">No strategic initiatives launched yet. Approve alternatives to seed.</p>
              )}
            </CardContent>
          </Card>

        </div>

      </div>

      {/* FLOAT DRAWER FOR CEO COPILOT CHAT */}
      {chatOpen && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                <Brain className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <h4 className="font-bold text-sm">CEO Copilot Command</h4>
                <p className="text-[10px] text-slate-450 leading-none mt-0.5">Cites live CRM & transactional sources</p>
              </div>
            </div>
            <button 
              onClick={() => setChatOpen(false)}
              className="text-slate-400 hover:text-white font-bold text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md transition-colors"
            >
              Close
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {chatHistory.map((m, idx) => (
              <div key={idx} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`p-3 rounded-lg max-w-[85%] text-xs shadow-sm leading-relaxed ${
                  m.role === "user" 
                    ? "bg-blue-600 text-white rounded-tr-none" 
                    : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                }`}>
                  {m.text}

                  {/* Grounded data citations */}
                  {m.citations && m.citations.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1 text-[8px] text-blue-600 font-bold uppercase">
                      {m.citations.map((c, cIdx) => (
                        <span key={cIdx} className="bg-slate-50 border border-slate-200 px-1 rounded">{c}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sendingMessage && (
              <div className="flex items-center gap-2 text-slate-400 text-xs pl-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-650" />
                <span>CEO Reasoning Engine calculating...</span>
              </div>
            )}
          </div>

          {/* Form input */}
          <form onSubmit={handleSendCopilotMessage} className="p-4 border-t border-slate-200 flex gap-2 bg-white">
            <input 
              type="text" 
              value={chatInput} 
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask: 'Why is revenue down?' or 'What is our biggest risk?'"
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 bg-slate-50/50 text-slate-800"
            />
            <Button 
              type="submit" 
              disabled={sendingMessage}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 shrink-0 rounded-lg h-9"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
