"use client";

import { useState } from "react";
import { Check, Trash2, ArrowUpRight, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ContextEngine } from "@/lib/context-engine";

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  rationale: string;
  confidence_score: number;
  priority_score?: number;
  proposed_action: any;
  status: "pending" | "approved" | "dismissed" | "executed";
  learning_log?: string;
  learning_adjusted?: boolean;
}

interface DecisionInboxProps {
  initialRecommendations: Recommendation[];
}

export function DecisionInbox({ initialRecommendations }: DecisionInboxProps) {
  const [items, setItems] = useState<Recommendation[]>(initialRecommendations);
  const [actioningId, setActioningId] = useState<string | null>(null);

  async function handleAction(id: string, action: "approve" | "dismiss" | "convert") {
    setActioningId(id);
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      
      if (data.ok) {
        toast.success(data.message || "Action executed successfully.");
        setItems(prev => prev.filter(item => item.id !== id));
      } else {
        toast.error(`Error: ${data.error}`);
      }
    } catch (err: any) {
      toast.error(`Connection error: ${err.message}`);
    } finally {
      setActioningId(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <span className="text-3xl">📥</span>
        <p className="text-sm font-medium mt-2">Decision inbox is empty.</p>
        <p className="text-xs text-slate-500 mt-0.5">No pending recommendations require review.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((rec) => {
        const context = ContextEngine.getRecommendationContext(rec.title, rec.description);
        return (
          <div 
            key={rec.id} 
            className="p-4 border border-slate-100 rounded-xl bg-white hover:shadow-md transition-shadow duration-200 flex flex-col md:flex-row justify-between gap-4"
          >
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant="outline" className="text-purple-600 bg-purple-50 border-purple-200 text-xs">
                  Confidence {Math.round(rec.confidence_score * 100)}%
                </Badge>
                {rec.learning_adjusted && (
                  <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-[9px] font-bold flex items-center gap-0.5">
                    <Sparkles className="h-2.5 w-2.5" />
                    Learned
                  </Badge>
                )}
                {rec.priority_score !== undefined && (
                  <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200 text-[9px] font-bold">
                    Priority: {rec.priority_score}
                  </Badge>
                )}
                <h4 className="font-semibold text-slate-900 text-sm truncate">{rec.title}</h4>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">{rec.description}</p>
              
              {/* Dynamic Context Engine output */}
              <div className="text-[10px] text-slate-500 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 space-y-1">
                <div><span className="font-bold text-slate-700">Root Cause:</span> {context.rootCause}</div>
                <div><span className="font-bold text-slate-700">Impact:</span> {context.impact}</div>
                <div><span className="font-bold text-slate-700">Suggested Action:</span> <span className="text-blue-600 font-semibold">{context.suggestedAction}</span></div>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-[10px] text-slate-400 italic">Rationale: {rec.rationale}</p>
                {rec.learning_log && (
                  <p className="text-[10px] text-emerald-600 font-semibold">{rec.learning_log}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              <button
                onClick={() => handleAction(rec.id, "approve")}
                disabled={actioningId !== null}
                className="p-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 border border-green-200 hover:text-green-800 transition-colors flex items-center justify-center gap-1.5 text-xs font-semibold disabled:opacity-50"
                title="Approve Recommendation"
              >
                {actioningId === rec.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Approve
              </button>
              <button
                onClick={() => handleAction(rec.id, "convert")}
                disabled={actioningId !== null}
                className="p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200 hover:text-blue-800 transition-colors flex items-center justify-center gap-1.5 text-xs font-semibold disabled:opacity-50"
                title="Convert to Task"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                To Task
              </button>
              <button
                onClick={() => handleAction(rec.id, "dismiss")}
                disabled={actioningId !== null}
                className="p-2 bg-slate-50 text-slate-500 rounded-lg hover:bg-slate-100 border border-slate-200 hover:text-slate-700 transition-colors flex items-center justify-center disabled:opacity-50"
                title="Dismiss Alert"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
