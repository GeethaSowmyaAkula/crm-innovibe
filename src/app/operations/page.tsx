"use client";

import React, { useEffect, useState } from "react";
import { 
  Activity, AlertTriangle, Zap, CheckCircle2, 
  Play, Users, Settings, TrendingUp, Sparkles, 
  Terminal, ShieldAlert, TrendingDown, DollarSign, Clock, RefreshCw, Layers, ShieldCheck, Loader2
} from "lucide-react";
import { toast } from "sonner";

export default function OperationsCommandPage() {
  // Loading & Data states
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<any>(null);
  const [bottlenecks, setBottlenecks] = useState<any[]>([]);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [executions, setExecutions] = useState<any[]>([]);

  // Simulation states
  const [simulationInputs, setSimulationInputs] = useState({
    bookingsDelta: 25,
    techsDelta: 2,
    complaintsDelta: 50
  });
  const [simulating, setSimulating] = useState(false);
  const [simResults, setSimResults] = useState<any>(null);

  // Load all initial operations data
  async function loadData() {
    try {
      setLoading(true);
      const [healthRes, intelRes, pbRes] = await Promise.all([
        fetch("/api/operations/health").then(res => res.json()),
        fetch("/api/operations/intelligence").then(res => res.json()),
        fetch("/api/operations/playbooks").then(res => res.json())
      ]);

      if (healthRes.ok) setHealth(healthRes.report);
      if (intelRes.ok) {
        setBottlenecks(intelRes.bottlenecks || []);
        setPatterns(intelRes.patterns || []);
      }
      if (pbRes.ok) {
        setPlaybooks(pbRes.playbooks || []);
        setExecutions(pbRes.executions || []);
      }
    } catch (err: any) {
      toast.error("Failed to load operations data: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Run Simulation Twin
  async function handleSimulate() {
    try {
      setSimulating(true);
      const res = await fetch("/api/operations/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioName: "CEO Dashboard Scenario",
          inputs: simulationInputs
        })
      });
      const data = await res.json();
      if (data.ok) {
        setSimResults(data.results);
        toast.success("Simulation finished successfully!");
      } else {
        toast.error("Simulation failed: " + data.error);
      }
    } catch (err: any) {
      toast.error("Simulation request error: " + err.message);
    } finally {
      setSimulating(false);
    }
  }

  // Trigger playbook template
  async function handleTriggerPlaybook(playbookId: string) {
    try {
      const res = await fetch("/api/operations/playbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "trigger",
          playbookId,
          triggeredBy: "CEO Cockpit"
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Playbook suggested successfully!");
        loadData();
      } else {
        toast.error("Failed to trigger playbook: " + data.error);
      }
    } catch (err: any) {
      toast.error("Trigger playbook error: " + err.message);
    }
  }

  // Approve Playbook execution
  async function handleApprovePlaybook(executionId: string) {
    try {
      const res = await fetch("/api/operations/playbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          executionId,
          approvedBy: "system" // fallback to system user
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Playbook approved and steps executed!");
        loadData();
      } else {
        toast.error("Failed to approve playbook: " + data.error);
      }
    } catch (err: any) {
      toast.error("Approve playbook error: " + err.message);
    }
  }

  // Complete Playbook execution step metrics
  async function handleCompletePlaybook(executionId: string) {
    try {
      const res = await fetch("/api/operations/playbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          executionId,
          expectedVal: 5,
          actualVal: 5,
          actualOutcome: "Successfully re-routed Pune bookings. Health recovered."
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Playbook execution logged. Success score: ${data.successScore}%`);
        loadData();
      } else {
        toast.error("Failed to complete playbook: " + data.error);
      }
    } catch (err: any) {
      toast.error("Complete playbook error: " + err.message);
    }
  }

  if (loading) {
    return (
      <div className="crm-page flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Initializing Operations Command...</p>
        </div>
      </div>
    );
  }

  const overallHealth = health?.overall ?? 75;
  const isWarRoom = health?.isWarRoomActive ?? false;

  // Sum total active revenue impact of bottlenecks
  const totalRevenueImpact = bottlenecks.reduce((acc, curr) => acc + (curr.revenue_impact || 0), 0);

  return (
    <div className={`crm-page transition-all duration-300 ${isWarRoom ? "border-l-4 border-red-500" : ""}`}>
      {/* Toolbar */}
      <div className="crm-toolbar">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          <h1 className="crm-toolbar-title">Operations Command Center</h1>
          {isWarRoom ? (
            <span className="crm-badge-danger animate-pulse">War Room Active</span>
          ) : (
            <span className="crm-badge-success">Operational Nominal</span>
          )}
        </div>
        <div className="crm-toolbar-actions">
          <button onClick={loadData} className="crm-btn-secondary crm-btn-sm">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh State
          </button>
        </div>
      </div>

      <div className="crm-body">
        {/* War Room Alert Banner (Conditional) */}
        {isWarRoom && (
          <div className="crm-alert-danger mb-6">
            <div className="flex-1">
              <h3 className="font-bold text-sm">Critical Operational Risks Detected</h3>
              <p className="text-xs mt-1">
                Active constraint impact: <span className="font-bold">₹{totalRevenueImpact.toLocaleString("en-IN")}</span>. 
                SOP playbook interventions required immediately to prevent cumulative SLA breaches.
              </p>
            </div>
          </div>
        )}

        {/* Top KPI Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="crm-stat-card crm-hover-glow">
            <div className="crm-stat-icon">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <span className="crm-stat-label">Operations Health</span>
              <div className="crm-stat-value text-blue-600">{overallHealth}%</div>
            </div>
          </div>

          <div className="crm-stat-card crm-hover-glow">
            <div className="crm-stat-icon">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <span className="crm-stat-label">Active Bottlenecks</span>
              <div className="crm-stat-value text-slate-800">{bottlenecks.length}</div>
            </div>
          </div>

          <div className="crm-stat-card crm-hover-glow">
            <div className="crm-stat-icon">
              <Users className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <span className="crm-stat-label">Tech Utilization</span>
              <div className="crm-stat-value text-slate-800">{health?.breakdown?.techUtilization?.current || 0}%</div>
            </div>
          </div>

          <div className="crm-stat-card crm-hover-glow">
            <div className="crm-stat-icon">
              <DollarSign className="h-5 w-5 text-rose-500" />
            </div>
            <div>
              <span className="crm-stat-label">Est. Revenue Impact</span>
              <div className="crm-stat-value text-rose-600">₹{totalRevenueImpact.toLocaleString("en-IN")}</div>
            </div>
          </div>
        </div>

        {/* Main Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* Active Constraints (Bottlenecks) */}
          <div className="lg:col-span-2 space-y-5">
            <div className="crm-section">
              <div className="crm-section-head">
                <h3 className="crm-card-title">Active Constraints &amp; Blockages</h3>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                  {bottlenecks.length} detected
                </span>
              </div>
              <div className="crm-section-body space-y-4">
                {bottlenecks.map((b, i) => (
                  <div key={i} className="p-4 border border-slate-100 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={b.severity === "critical" ? "crm-badge-danger" : "crm-badge-warning"}>
                            {b.severity}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 uppercase">{b.type}</span>
                        </div>
                        <p className="font-semibold text-slate-800 mt-2 text-sm">{b.context?.rootCause}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Est. Leakage</span>
                        <span className="text-sm font-bold text-rose-600">₹{b.revenue_impact?.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-200/60 text-xs">
                      <div>
                        <span className="text-slate-400 font-semibold block">Downstream Impact</span>
                        <span className="text-slate-600">{b.context?.impact}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block">Recommendation Action</span>
                        <span className="text-blue-600 font-medium">{b.context?.suggestedAction}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {bottlenecks.length === 0 && (
                  <div className="crm-empty">
                    <ShieldCheck className="h-10 w-10 text-emerald-500 mb-2" />
                    <h4 className="crm-empty-title">All operational systems clear</h4>
                    <p className="crm-empty-desc">No constraint bottlenecks or critical blockages currently flagged.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pattern Analysis */}
            <div className="crm-section">
              <div className="crm-section-head">
                <h3 className="crm-card-title">Operational Pattern Registry</h3>
              </div>
              <div className="crm-section-body grid grid-cols-1 md:grid-cols-2 gap-4">
                {patterns.map((p, i) => (
                  <div key={i} className="p-3.5 border border-slate-150 rounded-lg bg-white crm-hover-glow">
                    <div className="flex justify-between items-center">
                      <span className="crm-badge-purple uppercase">{p.pattern_type}</span>
                      <span className="text-[11px] font-semibold text-slate-400">Confidence: {p.confidence_score}%</span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium mt-2 leading-relaxed">{p.description}</p>
                    <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-400">Monthly Cost Leak:</span>
                      <span className="font-bold text-rose-600">₹{p.revenue_impact?.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                ))}
                {patterns.length === 0 && (
                  <p className="text-xs text-slate-400 col-span-2 text-center py-6">No recurring operational patterns identified.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Simulator Twin */}
          <div className="space-y-6">
            <div className="crm-section">
              <div className="crm-section-head">
                <h3 className="crm-card-title">Digital Twin Simulation</h3>
              </div>
              <div className="crm-section-body space-y-4">
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5 font-medium">
                    <span>Booking Volume Delta</span>
                    <span className="text-blue-600">{simulationInputs.bookingsDelta > 0 ? "+" : ""}{simulationInputs.bookingsDelta}%</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="100"
                    value={simulationInputs.bookingsDelta}
                    onChange={(e) => setSimulationInputs({...simulationInputs, bookingsDelta: Number(e.target.value)})}
                    className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5 font-medium">
                    <span>Tech Allocation Delta</span>
                    <span className="text-blue-600">{simulationInputs.techsDelta > 0 ? "+" : ""}{simulationInputs.techsDelta} Techs</span>
                  </div>
                  <input
                    type="range"
                    min="-5"
                    max="10"
                    value={simulationInputs.techsDelta}
                    onChange={(e) => setSimulationInputs({...simulationInputs, techsDelta: Number(e.target.value)})}
                    className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5 font-medium">
                    <span>Complaints Ratio Delta</span>
                    <span className="text-blue-600">{simulationInputs.complaintsDelta > 0 ? "+" : ""}{simulationInputs.complaintsDelta}%</span>
                  </div>
                  <input
                    type="range"
                    min="-30"
                    max="200"
                    value={simulationInputs.complaintsDelta}
                    onChange={(e) => setSimulationInputs({...simulationInputs, complaintsDelta: Number(e.target.value)})}
                    className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
                  />
                </div>

                <button
                  onClick={handleSimulate}
                  disabled={simulating}
                  className="crm-btn-primary w-full justify-center text-center mt-2 py-2.5"
                >
                  {simulating ? "Simulating Twin Model..." : "Run Digital Simulation"}
                </button>

                {simResults && (
                  <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg space-y-3.5 mt-3 text-xs">
                    <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                      Twin Simulation Output
                    </h5>
                    
                    <div className="grid grid-cols-2 gap-2.5 text-slate-700">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Tech Util</span>
                        <span className="font-bold text-slate-900">{simResults.utilization?.technician}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Garage Load</span>
                        <span className="font-bold text-slate-900">{simResults.utilization?.garage}%</span>
                      </div>
                    </div>

                    <div className="border-t border-blue-100 pt-2.5 space-y-2 text-slate-700">
                      <div className="flex justify-between">
                        <span>Projected CSAT:</span>
                        <span className="font-bold">{simResults.csat}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Projected Margin:</span>
                        <span className="font-bold">{simResults.margin}%</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold border-t border-dashed border-blue-100 pt-1.5">
                        <span className="text-slate-800">Net Impact:</span>
                        <span className={simResults.revenueImpact >= 0 ? "text-emerald-600" : "text-red-600"}>
                          {simResults.revenueImpact >= 0 ? "+" : ""}₹{simResults.revenueImpact?.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Playbooks & SOP executions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="crm-section">
            <div className="crm-section-head">
              <h3 className="crm-card-title flex items-center gap-2">
                <Layers className="h-4 w-4 text-slate-500" />
                SOP Playbooks Templates
              </h3>
            </div>
            <div className="crm-section-body space-y-3">
              {playbooks.map((pb, i) => (
                <div key={i} className="p-3.5 border border-slate-100 rounded-lg bg-slate-50/40">
                  <div className="flex justify-between items-start">
                    <h5 className="font-bold text-slate-800 text-xs">{pb.name}</h5>
                    <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                      SOP {pb.id.substring(0, 4)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{pb.description}</p>
                  <div className="flex justify-between items-center border-t border-slate-100 pt-2 mt-3 text-[10px] text-slate-400">
                    <span>Trigger: <code className="bg-slate-50 text-blue-600 px-1 py-0.5 rounded font-mono">{pb.trigger_condition}</code></span>
                    <button
                      onClick={() => handleTriggerPlaybook(pb.id)}
                      className="crm-btn-secondary py-1 px-2.5 crm-btn-sm"
                    >
                      Trigger
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="crm-section lg:col-span-2">
            <div className="crm-section-head">
              <h3 className="crm-card-title">Playbook Executions Tracker</h3>
            </div>
            <div className="crm-section-body space-y-4">
              {executions.map((exec, i) => (
                <div key={i} className="p-4 border border-slate-100 rounded-lg bg-white crm-hover-glow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{exec.playbook?.name || "Operations Playbook"}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Triggered by: {exec.triggered_by}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`capitalize text-[10px] font-bold ${
                        exec.status === "completed" 
                          ? "crm-badge-success" 
                          : exec.status === "pending_approval" 
                            ? "crm-badge-warning animate-pulse" 
                            : "crm-badge-info"
                      }`}>
                        {exec.status?.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-2 text-slate-500 mt-3">
                    <span>Expected Result: <strong className="text-slate-700 font-semibold">{exec.expected_outcome || "Resolve constraint"}</strong></span>
                    {exec.actual_outcome && (
                      <span>Actual: <strong className="text-slate-700 font-semibold">{exec.actual_outcome}</strong></span>
                    )}
                  </div>

                  <div className="w-full bg-slate-100 h-1 rounded-full mt-3 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: exec.status === "completed" ? "100%" : `${(exec.current_step || 1) * 20}%` }}
                    />
                  </div>

                  {exec.status === "suggested" && (
                    <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-slate-50">
                      <button
                        className="crm-btn-primary py-1 px-3 crm-btn-sm"
                        onClick={() => handleApprovePlaybook(exec.id)}
                      >
                        Approve & Execute
                      </button>
                    </div>
                  )}

                  {exec.status === "pending_approval" && (
                    <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-slate-50">
                      <button
                        className="crm-btn-warning py-1 px-3 crm-btn-sm"
                        onClick={() => handleApprovePlaybook(exec.id)}
                      >
                        Approve Step {exec.current_step}
                      </button>
                    </div>
                  )}

                  {exec.status === "running" && (
                    <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-slate-50">
                      <button
                        className="crm-btn-primary py-1 px-3 crm-btn-sm"
                        onClick={() => handleCompletePlaybook(exec.id)}
                      >
                        Audit & Complete
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {executions.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">No playbook execution logs active.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
