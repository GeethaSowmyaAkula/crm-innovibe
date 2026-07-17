"use client";

import { useState, useEffect } from "react";
import { 
  Users, Handshake, Calendar, Clock, CheckCircle2, AlertTriangle, 
  Search, Plus, Filter, Trash2, Edit2, History, ChevronRight, 
  X, Briefcase, Mail, MapPin, TrendingUp, Info, Loader2, ArrowUpDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Partnership {
  id: string;
  companyName: string;
  contactPerson: string;
  emailId: string;
  address: string;
  category: "EV OEM" | "EV Fleet" | "EV Garage" | "EV Funding" | "EV Dealership";
  lastInteractionDate: string;
  currentStatus: string;
  nextFollowUpDate: string;
  nextAction: string;
  expectedOutcome: string;
  history: Array<{ date: string; note: string }>;
}

export function PartnershipTracker() {
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [followUpFilter, setFollowUpFilter] = useState("All"); // All, Overdue, Upcoming, Today
  const [sortBy, setSortBy] = useState<"companyName" | "nextFollowUpDate" | "lastInteractionDate">("nextFollowUpDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPartnership, setEditingPartnership] = useState<Partnership | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<Partnership | null>(null);
  
  // Form fields
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [emailId, setEmailId] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState<any>("EV OEM");
  const [lastInteractionDate, setLastInteractionDate] = useState("");
  const [currentStatus, setCurrentStatus] = useState("New");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [expectedOutcome, setExpectedOutcome] = useState("");
  const [progressNote, setProgressNote] = useState("");

  const categories = ["EV OEM", "EV Fleet", "EV Garage", "EV Funding", "EV Dealership"];
  const statuses = [
    "New", "Contacted", "Discussion Ongoing", "Proposal Shared", 
    "Negotiation", "Partnership Confirmed", "Closed Won", "Closed Lost", "On Hold"
  ];

  useEffect(() => {
    fetchPartnerships();
  }, []);

  async function fetchPartnerships() {
    setLoading(true);
    try {
      const res = await fetch("/api/partnerships");
      const result = await res.json();
      if (result.ok) {
        setPartnerships(result.data);
      } else {
        toast.error("Failed to load partnerships");
      }
    } catch (err) {
      toast.error("Error connecting to partnerships API");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setCompanyName("");
    setContactPerson("");
    setEmailId("");
    setAddress("");
    setCategory("EV OEM");
    setLastInteractionDate(new Date().toISOString().split("T")[0]);
    setCurrentStatus("New");
    setNextFollowUpDate("");
    setNextAction("");
    setExpectedOutcome("");
    setProgressNote("");
    setEditingPartnership(null);
  }

  function handleOpenCreate() {
    resetForm();
    setIsFormOpen(true);
  }

  function handleOpenEdit(p: Partnership) {
    setEditingPartnership(p);
    setCompanyName(p.companyName);
    setContactPerson(p.contactPerson);
    setEmailId(p.emailId);
    setAddress(p.address);
    setCategory(p.category);
    setLastInteractionDate(p.lastInteractionDate);
    setCurrentStatus(p.currentStatus);
    setNextFollowUpDate(p.nextFollowUpDate);
    setNextAction(p.nextAction);
    setExpectedOutcome(p.expectedOutcome);
    setProgressNote(""); // Add optional update note
    setIsFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName || !contactPerson || !emailId) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const payload = {
      id: editingPartnership?.id,
      companyName,
      contactPerson,
      emailId,
      address,
      category,
      lastInteractionDate,
      currentStatus,
      nextFollowUpDate,
      nextAction,
      expectedOutcome,
      note: progressNote
    };

    try {
      const method = editingPartnership ? "PUT" : "POST";
      const res = await fetch("/api/partnerships", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json();

      if (result.ok) {
        toast.success(editingPartnership ? "Partnership updated." : "Partnership created.");
        setIsFormOpen(false);
        fetchPartnerships();
      } else {
        toast.error(result.error || "Save operation failed.");
      }
    } catch (err) {
      toast.error("Network error saving partnership.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to remove this partnership?")) return;
    try {
      const res = await fetch(`/api/partnerships?id=${id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.ok) {
        toast.success("Partnership deleted.");
        fetchPartnerships();
      } else {
        toast.error(result.error || "Delete failed.");
      }
    } catch (err) {
      toast.error("Network error deleting partnership.");
    }
  }

  function handleOpenHistory(p: Partnership) {
    setHistoryTarget(p);
    setIsHistoryOpen(true);
  }

  // Follow-up status helper
  function getFollowUpStatus(dateStr: string) {
    if (!dateStr) return { label: "Not Scheduled", color: "text-slate-400 bg-slate-50 border-slate-200" };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: "Overdue", color: "text-rose-700 bg-rose-50 border-rose-100 font-bold" };
    } else if (diffDays === 0) {
      return { label: "Today", color: "text-amber-700 bg-amber-50 border-amber-150 font-bold animate-pulse" };
    } else {
      return { label: "Upcoming", color: "text-blue-700 bg-blue-50 border-blue-100" };
    }
  }

  // Summary Metrics calculation
  const totalPartnerships = partnerships.length;
  const activeDiscussions = partnerships.filter(p => 
    ["New", "Contacted", "Discussion Ongoing", "Proposal Shared", "Negotiation", "On Hold"].includes(p.currentStatus)
  ).length;
  
  const closedPartnerships = partnerships.filter(p => 
    ["Closed Won", "Closed Lost"].includes(p.currentStatus)
  ).length;

  const successfulPartnerships = partnerships.filter(p => 
    ["Partnership Confirmed", "Closed Won"].includes(p.currentStatus)
  ).length;

  const pendingFollowups = partnerships.filter(p => {
    if (!p.nextFollowUpDate) return false;
    const status = getFollowUpStatus(p.nextFollowUpDate);
    return status.label === "Overdue" || status.label === "Today";
  }).length;

  // Search & Filters filtering logic
  const filteredPartnerships = partnerships.filter(p => {
    const matchesSearch = 
      p.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.emailId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesStatus = selectedStatus === "All" || p.currentStatus === selectedStatus;
    
    let matchesFollowUp = true;
    if (p.nextFollowUpDate) {
      const followUpStatus = getFollowUpStatus(p.nextFollowUpDate).label;
      if (followUpFilter === "Overdue") matchesFollowUp = followUpStatus === "Overdue";
      else if (followUpFilter === "Upcoming") matchesFollowUp = followUpStatus === "Upcoming";
      else if (followUpFilter === "Today") matchesFollowUp = followUpStatus === "Today";
    } else {
      if (followUpFilter !== "All") matchesFollowUp = false;
    }

    return matchesSearch && matchesCategory && matchesStatus && matchesFollowUp;
  }).sort((a, b) => {
    let factor = sortOrder === "asc" ? 1 : -1;
    if (sortBy === "companyName") {
      return a.companyName.localeCompare(b.companyName) * factor;
    } else if (sortBy === "nextFollowUpDate") {
      if (!a.nextFollowUpDate) return 1;
      if (!b.nextFollowUpDate) return -1;
      return (new Date(a.nextFollowUpDate).getTime() - new Date(b.nextFollowUpDate).getTime()) * factor;
    } else if (sortBy === "lastInteractionDate") {
      return (new Date(a.lastInteractionDate).getTime() - new Date(b.lastInteractionDate).getTime()) * factor;
    }
    return 0;
  });

  const statusBadgeMap: Record<string, string> = {
    "New": "bg-slate-100 text-slate-800 border-slate-200",
    "Contacted": "bg-blue-50 text-blue-800 border-blue-100",
    "Discussion Ongoing": "bg-purple-50 text-purple-800 border-purple-100",
    "Proposal Shared": "bg-indigo-50 text-indigo-800 border-indigo-100",
    "Negotiation": "bg-amber-50 text-amber-800 border-amber-100",
    "Partnership Confirmed": "bg-emerald-50 text-emerald-800 border-emerald-100 font-extrabold",
    "Closed Won": "bg-emerald-50 text-emerald-800 border-emerald-100 font-extrabold",
    "Closed Lost": "bg-red-50 text-red-800 border-red-150",
    "On Hold": "bg-yellow-50 text-yellow-800 border-yellow-200"
  };

  const categoryIconMap: Record<string, string> = {
    "EV OEM": "⚡ OEM",
    "EV Fleet": "🚗 Fleet",
    "EV Garage": "🔧 Garage",
    "EV Funding": "💰 Fund",
    "EV Dealership": "🏪 Deal"
  };

  function toggleSort(field: "companyName" | "nextFollowUpDate" | "lastInteractionDate") {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  }

  return (
    <div className="space-y-6">
      
      {/* SUMMARY INSIGHTS BAR */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="crm-stat-card">
          <div className="crm-stat-icon">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <span className="crm-stat-label">Total Partnerships</span>
            <div className="crm-stat-value">{totalPartnerships}</div>
          </div>
        </Card>

        <Card className="crm-stat-card">
          <div className="crm-stat-icon" style={{ color: "#0070F3", backgroundColor: "rgba(0,112,243,0.05)" }}>
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="crm-stat-label">Active Discussions</span>
            <div className="crm-stat-value">{activeDiscussions}</div>
          </div>
        </Card>

        <Card className="crm-stat-card">
          <div className="crm-stat-icon" style={{ color: "#EA4335", backgroundColor: "#FCE8E6" }}>
            <Clock className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <span className="crm-stat-label">Follow-ups Pending</span>
            <div className="crm-stat-value text-rose-600">{pendingFollowups}</div>
          </div>
        </Card>

        <Card className="crm-stat-card">
          <div className="crm-stat-icon">
            <Handshake className="h-5 w-5" />
          </div>
          <div>
            <span className="crm-stat-label">Closed Cases</span>
            <div className="crm-stat-value">{closedPartnerships}</div>
          </div>
        </Card>

        <Card className="crm-stat-card" style={{ borderLeft: "4px solid #34A853" }}>
          <div className="crm-stat-icon" style={{ color: "#34A853", backgroundColor: "#E6F4EA" }}>
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <span className="crm-stat-label">Confirmed Success</span>
            <div className="crm-stat-value text-emerald-600">{successfulPartnerships}</div>
          </div>
        </Card>
      </div>

      {/* FILTER & ACTIONS TOOLBAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4.5 border border-slate-200 rounded-xl shadow-sm">
        
        {/* Left filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="crm-search">
            <Search className="h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search companies, contacts..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="text-slate-400 hover:text-slate-600">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select 
              className="crm-select text-[12px] h-8.5 py-0" 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <select 
              className="crm-select text-[12px] h-8.5 py-0" 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <select 
              className="crm-select text-[12px] h-8.5 py-0" 
              value={followUpFilter} 
              onChange={(e) => setFollowUpFilter(e.target.value)}
            >
              <option value="All">All Follow-ups</option>
              <option value="Overdue">Overdue Follow-ups</option>
              <option value="Today">Due Today</option>
              <option value="Upcoming">Upcoming Follow-ups</option>
            </select>
          </div>
        </div>

        {/* Right actions */}
        <button 
          onClick={handleOpenCreate}
          className="crm-btn crm-btn-primary h-8.5 text-xs font-bold px-4"
        >
          <Plus className="h-4 w-4" />
          Add Partnership
        </button>
      </div>

      {/* PARTNERSHIPS DATA TABLE */}
      {loading ? (
        <Card className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-xl">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
          <h4 className="text-sm font-bold text-slate-700">Loading partnership data...</h4>
          <p className="text-[11px] text-slate-400">Querying local registry cache.</p>
        </Card>
      ) : filteredPartnerships.length === 0 ? (
        <div className="crm-empty">
          <Briefcase className="crm-empty-icon" />
          <h3 className="crm-empty-title">No partnerships match filter criteria</h3>
          <p className="crm-empty-desc">Create a new partnership or loosen search queries.</p>
        </div>
      ) : (
        <div className="crm-table-wrapper">
          <table className="crm-table">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200">
                <th className="cursor-pointer hover:bg-slate-100" onClick={() => toggleSort("companyName")}>
                  <div className="flex items-center gap-1.5">
                    Company Name
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th>Contact Details</th>
                <th>Category</th>
                <th className="cursor-pointer hover:bg-slate-100" onClick={() => toggleSort("lastInteractionDate")}>
                  <div className="flex items-center gap-1.5">
                    Last Interaction
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th>Current Status</th>
                <th className="cursor-pointer hover:bg-slate-100" onClick={() => toggleSort("nextFollowUpDate")}>
                  <div className="flex items-center gap-1.5">
                    Next Follow-up
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th>Next Action</th>
                <th>Expected Outcome</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPartnerships.map((p) => {
                const followUp = getFollowUpStatus(p.nextFollowUpDate);
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    {/* Company Name & Address */}
                    <td className="px-5 py-4 font-bold text-slate-900">
                      <div className="flex flex-col">
                        <span>{p.companyName}</span>
                        {p.address && (
                          <span className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-0.5 max-w-[200px] truncate">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {p.address}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Contact Person Details */}
                    <td>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">{p.contactPerson}</span>
                        <a href={`mailto:${p.emailId}`} className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3" />
                          {p.emailId}
                        </a>
                      </div>
                    </td>

                    {/* Category Label */}
                    <td>
                      <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-extrabold border-slate-200 bg-slate-50 text-slate-600 px-2 py-0.5">
                        {categoryIconMap[p.category] || p.category}
                      </Badge>
                    </td>

                    {/* Last Interaction Date */}
                    <td className="text-xs text-slate-600 font-medium">
                      {p.lastInteractionDate}
                    </td>

                    {/* Status Badge */}
                    <td>
                      <Badge className={`text-[10px] font-bold border rounded-full px-2.5 py-0.5 uppercase tracking-tight ${statusBadgeMap[p.currentStatus] || ""}`}>
                        {p.currentStatus}
                      </Badge>
                    </td>

                    {/* Next Follow Up */}
                    <td>
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-xs font-semibold text-slate-700">
                          {p.nextFollowUpDate || "Not Scheduled"}
                        </span>
                        {p.nextFollowUpDate && (
                          <Badge variant="outline" className={`text-[8px] uppercase font-black px-1.5 py-0 border ${followUp.color}`}>
                            {followUp.label}
                          </Badge>
                        )}
                      </div>
                    </td>

                    {/* Next Action */}
                    <td className="text-[12px] text-slate-700 font-medium min-w-[150px] leading-relaxed">
                      {p.nextAction || "—"}
                    </td>

                    {/* Expected Outcome */}
                    <td className="text-[12px] text-slate-500 font-medium min-w-[150px] leading-relaxed">
                      {p.expectedOutcome || "—"}
                    </td>

                    {/* Actions panel */}
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => handleOpenHistory(p)}
                          className="crm-btn-icon h-7 w-7 hover:text-indigo-600"
                          title="View History Timeline"
                        >
                          <History className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => handleOpenEdit(p)}
                          className="crm-btn-icon h-7 w-7 hover:text-blue-600"
                          title="Edit Partnership"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id)}
                          className="crm-btn-icon h-7 w-7 hover:text-red-600"
                          title="Delete Partnership"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE & EDIT FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-250/70 bg-slate-50/40">
              <div>
                <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-tight">
                  {editingPartnership ? "Edit Partnership Record" : "Add New Partnership"}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Manage details and follow-up criteria.</p>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="crm-btn-icon h-7 w-7"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                {/* Company Name */}
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Company Name *</label>
                  <input 
                    type="text" 
                    required 
                    className="crm-input w-full h-9"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Mahindra Electric"
                  />
                </div>

                {/* Contact Person */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Contact Person *</label>
                  <input 
                    type="text" 
                    required 
                    className="crm-input w-full h-9"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                  />
                </div>

                {/* Email ID */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Email ID *</label>
                  <input 
                    type="email" 
                    required 
                    className="crm-input w-full h-9"
                    value={emailId}
                    onChange={(e) => setEmailId(e.target.value)}
                    placeholder="e.g. ramesh@company.com"
                  />
                </div>

                {/* Category Dropdown */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Category *</label>
                  <select 
                    className="crm-select w-full h-9"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Current Status Dropdown */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Status *</label>
                  <select 
                    className="crm-select w-full h-9"
                    value={currentStatus}
                    onChange={(e) => setCurrentStatus(e.target.value)}
                  >
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Last Interaction Date */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Last Interaction Date</label>
                  <input 
                    type="date" 
                    className="crm-input w-full h-9"
                    value={lastInteractionDate}
                    onChange={(e) => setLastInteractionDate(e.target.value)}
                  />
                </div>

                {/* Next Follow-up Date */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Next Follow-up Date</label>
                  <input 
                    type="date" 
                    className="crm-input w-full h-9"
                    value={nextFollowUpDate}
                    onChange={(e) => setNextFollowUpDate(e.target.value)}
                  />
                </div>

                {/* Address */}
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Office Address</label>
                  <input 
                    type="text" 
                    className="crm-input w-full h-9"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Office location details"
                  />
                </div>

                {/* Next Action */}
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Next Action Plan</label>
                  <input 
                    type="text" 
                    className="crm-input w-full h-9"
                    value={nextAction}
                    onChange={(e) => setNextAction(e.target.value)}
                    placeholder="What needs to happen next?"
                  />
                </div>

                {/* Expected Outcome */}
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Expected Outcome</label>
                  <input 
                    type="text" 
                    className="crm-input w-full h-9"
                    value={expectedOutcome}
                    onChange={(e) => setExpectedOutcome(e.target.value)}
                    placeholder="e.g. SLA battery procurement agreement signoff"
                  />
                </div>

                {/* Progress / History Note */}
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Latest Update / Interaction Note</label>
                  <textarea 
                    rows={2}
                    className="crm-input w-full h-auto py-2.5 resize-none"
                    value={progressNote}
                    onChange={(e) => setProgressNote(e.target.value)}
                    placeholder={editingPartnership ? "Add notes about this interaction update..." : "Notes about the initial contact..."}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsFormOpen(false)}
                  className="crm-btn crm-btn-secondary px-4.5"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="crm-btn crm-btn-primary px-5 font-bold"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HISTORY TIMELINE MODAL */}
      {isHistoryOpen && historyTarget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-250/70 bg-slate-50/40">
              <div>
                <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                  <History className="h-4.5 w-4.5 text-blue-650" />
                  Interaction Logs
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{historyTarget.companyName}</p>
              </div>
              <button 
                onClick={() => setIsHistoryOpen(false)}
                className="crm-btn-icon h-7 w-7"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 max-h-[400px] overflow-y-auto">
              <div className="relative border-l border-slate-200 pl-5 space-y-6 ml-2.5">
                {(!historyTarget.history || historyTarget.history.length === 0) ? (
                  <p className="text-xs text-slate-400">No interaction logs logged.</p>
                ) : (
                  historyTarget.history.map((h, i) => (
                    <div key={i} className="relative group">
                      {/* Timeline Dot */}
                      <div className="absolute -left-[25.5px] top-1 h-3 w-3 rounded-full border border-white bg-blue-600 shadow-sm" />
                      
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                          {h.date}
                        </span>
                        <p className="text-[12px] text-slate-700 font-semibold mt-1 bg-slate-50/50 p-2.5 border border-slate-200/50 rounded-lg leading-normal">
                          {h.note}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 bg-slate-50/20">
              <button 
                onClick={() => setIsHistoryOpen(false)}
                className="crm-btn crm-btn-secondary px-5"
              >
                Close Logs
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
