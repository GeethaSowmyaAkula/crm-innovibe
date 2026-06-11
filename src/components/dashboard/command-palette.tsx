"use client";

import { useEffect, useState } from "react";
import { 
  Terminal, Search, Cpu, Database, RefreshCw, 
  FileText, Clipboard, Lightbulb, Save, X, Sparkles, Loader2 
} from "lucide-react";
import { toast } from "sonner";

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeScreen, setActiveScreen] = useState<"menu" | "note" | "board" | "strategy" | "report">("menu");
  const [loading, setLoading] = useState(false);

  // Form states
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [boardTitle, setBoardTitle] = useState("");
  const [boardDesc, setBoardDesc] = useState("");
  const [boardRes, setBoardRes] = useState("");
  const [stratTitle, setStratTitle] = useState("");
  const [stratDesc, setStratDesc] = useState("");
  const [stratRat, setStratRat] = useState("");
  const [stratImp, setStratImp] = useState("");
  const [reportTemplate, setReportTemplate] = useState("");
  const [reportName, setReportName] = useState("");

  const [templates, setTemplates] = useState<any[]>([]);

  // Toggle keyboard shortcut CMD+K / CTRL+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(prev => !prev);
        setActiveScreen("menu");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch report templates when snapshot screen opens
  useEffect(() => {
    if (activeScreen === "report" && templates.length === 0) {
      fetch("/api/reports")
        .then(r => r.json())
        .then(data => {
          if (data.ok && data.templates) {
            setTemplates(data.templates);
            if (data.templates.length > 0) setReportTemplate(data.templates[0].id);
          }
        })
        .catch(console.error);
    }
  }, [activeScreen, templates]);

  // Execute immediate commands
  async function runImmediateCommand(endpoint: string, successMessage: string) {
    setLoading(true);
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        toast.success(`${successMessage} completed successfully.`);
        setIsOpen(false);
      } else {
        toast.error(`Execution failed: ${data.error}`);
      }
    } catch (err: any) {
      toast.error(`Execution failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Save executive memory commands
  async function handleSaveMemory(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    let payload = {};
    if (activeScreen === "note") {
      payload = { title: noteTitle, content: noteContent };
    } else if (activeScreen === "board") {
      payload = { 
        title: boardTitle, 
        description: boardDesc, 
        resolutions: boardRes.split("\n").filter(Boolean) 
      };
    } else if (activeScreen === "strategy") {
      payload = { 
        title: stratTitle, 
        description: stratDesc, 
        rationale: stratRat, 
        expected_impact: stratImp 
      };
    }

    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: activeScreen, payload })
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Executive memory registered successfully.`);
        // Clear states
        setNoteTitle(""); setNoteContent("");
        setBoardTitle(""); setBoardDesc(""); setBoardRes("");
        setStratTitle(""); setStratDesc(""); setStratRat(""); setStratImp("");
        setIsOpen(false);
      } else {
        toast.error(`Save failed: ${data.error}`);
      }
    } catch (err: any) {
      toast.error(`Save failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Generate Report Command
  async function handleGenerateReport(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: reportTemplate, name: reportName })
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Report snapshot '${reportName}' generated.`);
        setReportName("");
        setIsOpen(false);
      } else {
        toast.error(`Report generation failed: ${data.error}`);
      }
    } catch (err: any) {
      toast.error(`Report generation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  const menuItems = [
    {
      title: "Run Opportunity Scan",
      desc: "Triggers AI engine to detect upselling, inactive accounts, and recoveries.",
      icon: Lightbulb,
      action: () => runImmediateCommand("/api/opportunities/detect", "Opportunity scan"),
      color: "text-amber-500 bg-amber-50 border-amber-200"
    },
    {
      title: "Sync Master Core Cache",
      desc: "Synchronizes Customers, Vehicles, and Bookings cached from live Laravel production.",
      icon: Database,
      action: () => runImmediateCommand("/api/sync-core", "Cache sync routine"),
      color: "text-blue-500 bg-blue-50 border-blue-200"
    },
    {
      title: "Retry Failed Sync Records",
      desc: "Reprocesses recorded database failures and attempts dynamic orphan-record binding.",
      icon: RefreshCw,
      action: () => runImmediateCommand("/api/sync-retry", "Sync retry sequence"),
      color: "text-green-500 bg-green-50 border-green-200"
    },
    {
      title: "Record Board Decision",
      desc: "Enters a formal board resolution into the executive memory ledger.",
      icon: Clipboard,
      action: () => setActiveScreen("board"),
      color: "text-purple-500 bg-purple-50 border-purple-200"
    },
    {
      title: "Implement Strategic Decision",
      desc: "Provisions a long-term strategic initiative for business metrics monitoring.",
      icon: Sparkles,
      action: () => setActiveScreen("strategy"),
      color: "text-indigo-500 bg-indigo-50 border-indigo-200"
    },
    {
      title: "Create Custom Report Snapshot",
      desc: "Calculates and packages a reporting update snapshot from current aggregates.",
      icon: FileText,
      action: () => setActiveScreen("report"),
      color: "text-orange-500 bg-orange-50 border-orange-200"
    },
    {
      title: "Add Executive Note",
      desc: "Logs private operational observations or reminders for the CEO suite.",
      icon: Save,
      action: () => setActiveScreen("note"),
      color: "text-slate-500 bg-slate-50 border-slate-200"
    }
  ];

  const filteredItems = menuItems.filter(item => 
    item.title.toLowerCase().includes(search.toLowerCase()) || 
    item.desc.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-lg border border-slate-200 shadow-sm text-xs font-semibold text-slate-500 transition-colors"
      >
        <Search className="h-3.5 w-3.5 text-slate-400" />
        Command Center
        <kbd className="hidden sm:inline-block bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[9px] font-mono shadow-sm">⌘K</kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-scaleIn text-white"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-extrabold text-slate-100 tracking-tight">Executive Command Center</span>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-2 bg-slate-900 p-4 border border-slate-800 rounded-xl">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="text-xs text-slate-400">Executing command...</span>
            </div>
          </div>
        )}

        {/* Content Screens */}
        {activeScreen === "menu" ? (
          <>
            <div className="p-3.5 border-b border-slate-800">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Type a corporate command to execute..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 pl-10 pr-4 py-2 text-sm rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-slate-600"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3.5 space-y-2 max-h-[50vh]">
              {filteredItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={item.action}
                  className="w-full text-left p-3 rounded-xl border border-slate-800/40 hover:border-slate-800 hover:bg-slate-800/30 flex items-start gap-3.5 transition-all group"
                >
                  <div className={`p-2 rounded-lg border ${item.color} shrink-0`}>
                    <item.icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{item.title}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">{item.desc}</p>
                  </div>
                </button>
              ))}
              {filteredItems.length === 0 && (
                <p className="text-center text-xs text-slate-500 py-6">No matching executive commands found.</p>
              )}
            </div>
          </>
        ) : (
          <div className="p-5 flex-1 overflow-y-auto max-h-[60vh]">
            <button 
              onClick={() => setActiveScreen("menu")}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold mb-4 inline-block focus:outline-none"
            >
              ← Back to Main Command Menu
            </button>

            {/* Note form */}
            {activeScreen === "note" && (
              <form onSubmit={handleSaveMemory} className="space-y-4">
                <h3 className="text-sm font-bold text-slate-100">Log CEO Executive Note</h3>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Note Title</label>
                  <input 
                    type="text" 
                    value={noteTitle} 
                    onChange={e => setNoteTitle(e.target.value)}
                    placeholder="e.g. Pune Service Capacity Constraints"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500 text-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Content</label>
                  <textarea 
                    rows={4}
                    value={noteContent} 
                    onChange={e => setNoteContent(e.target.value)}
                    placeholder="Enter observations, directives, or follow-ups..."
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500 text-white"
                    required
                  />
                </div>
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-lg shadow-blue-500/20">
                  Save Executive Note
                </button>
              </form>
            )}

            {/* Board Decision Form */}
            {activeScreen === "board" && (
              <form onSubmit={handleSaveMemory} className="space-y-4">
                <h3 className="text-sm font-bold text-slate-100">Record Board Resolution</h3>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Resolution Title</label>
                  <input 
                    type="text" 
                    value={boardTitle} 
                    onChange={e => setBoardTitle(e.target.value)}
                    placeholder="e.g. Q3 Series A Funding Allotment"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500 text-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Description</label>
                  <textarea 
                    rows={2}
                    value={boardDesc} 
                    onChange={e => setBoardDesc(e.target.value)}
                    placeholder="Describe context of meeting and summary..."
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500 text-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Resolutions (One per line)</label>
                  <textarea 
                    rows={3}
                    value={boardRes} 
                    onChange={e => setBoardRes(e.target.value)}
                    placeholder="Resolution 1&#10;Resolution 2..."
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-xs font-mono focus:outline-none focus:border-blue-500 text-white"
                    required
                  />
                </div>
                <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-lg shadow-purple-500/20">
                  Save Board Resolution
                </button>
              </form>
            )}

            {/* Strategic Decision Form */}
            {activeScreen === "strategy" && (
              <form onSubmit={handleSaveMemory} className="space-y-4">
                <h3 className="text-sm font-bold text-slate-100">Implement Strategic Initiative</h3>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Initiative Title</label>
                  <input 
                    type="text" 
                    value={stratTitle} 
                    onChange={e => setStratTitle(e.target.value)}
                    placeholder="e.g. Bangalore Mobile Tech Hub Allocation"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500 text-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Scope Description</label>
                  <textarea 
                    rows={2}
                    value={stratDesc} 
                    onChange={e => setStratDesc(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500 text-white"
                    required
                  />
                </div>
                <div className="grid gap-3 grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Strategic Rationale</label>
                    <textarea 
                      rows={2}
                      value={stratRat} 
                      onChange={e => setStratRat(e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Expected Impact</label>
                    <textarea 
                      rows={2}
                      value={stratImp} 
                      onChange={e => setStratImp(e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500 text-white"
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-lg shadow-indigo-500/20">
                  Save Strategic Initiative
                </button>
              </form>
            )}

            {/* Custom Report Snapshot Form */}
            {activeScreen === "report" && (
              <form onSubmit={handleGenerateReport} className="space-y-4">
                <h3 className="text-sm font-bold text-slate-100">Compile Custom Report Snapshot</h3>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Select Template</label>
                  <select
                    value={reportTemplate}
                    onChange={e => setReportTemplate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500 text-white"
                  >
                    {templates.map(t => (
                      <option key={t.id} value={t.id} className="bg-slate-900 text-white">{t.name} ({t.category.toUpperCase()})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Snapshot Save Name</label>
                  <input 
                    type="text" 
                    value={reportName} 
                    onChange={e => setReportName(e.target.value)}
                    placeholder="e.g. Q2 Week 2 Operations Report"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500 text-white"
                    required
                  />
                </div>
                <button type="submit" className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-lg shadow-orange-500/20">
                  Compile Snapshot
                </button>
              </form>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-950/50 border-t border-slate-800 flex justify-between text-[9px] text-slate-500">
          <span>Tip: Press ESC to close Command Center at any time.</span>
          <span>Shortcut: CMD+K to open anywhere.</span>
        </div>
      </div>
    </div>
  );
}
