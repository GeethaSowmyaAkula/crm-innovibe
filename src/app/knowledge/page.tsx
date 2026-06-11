import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Search, FileText, Download, Tag, Award, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function KnowledgeCenterPage() {
  const supabase = await createClient();

  const { data: dbArticles } = await supabase
    .from("knowledge_base_articles")
    .select("*")
    .order("created_at", { ascending: false });

  const articles = (dbArticles && dbArticles.length > 0) ? dbArticles : [
    {
      id: "kb1",
      title: "EV Lithium Battery Fault Isolation Guide",
      content: "Complete diagnostic steps for addressing voltage sag anomalies and temperature alarms in standard EV packs.",
      category: "Service Manual",
      tags: ["Battery", "Diagnostics", "IoT"],
      created_at: new Date().toISOString()
    },
    {
      id: "kb2",
      title: "Standard Operating Procedure (SOP) - Roadside Assistance",
      content: "Protocol for dispatching nearest technicians, towing coordinates, and WhatsApp communication template for SOS calls.",
      category: "SOP",
      tags: ["Operations", "SOP", "WhatsApp"],
      created_at: new Date().toISOString()
    },
    {
      id: "kb3",
      title: "Warranty and AMC Plan Exclusions Policy",
      content: "Terms detailing motor replacement coverage limits, battery health depletion exclusions, and commercial fleet pricing guidelines.",
      category: "Policy",
      tags: ["AMC", "Legal", "Finance"],
      created_at: new Date().toISOString()
    },
    {
      id: "kb4",
      title: "InnoCorp Corporate Fleet Service Level Agreement (SLA)",
      content: "Contractual parameters establishing a 4-hour dispatch SLA for Mumbai corporate fleet service requests.",
      category: "Contract",
      tags: ["Fleet", "SLA", "Contracts"],
      created_at: new Date().toISOString()
    }
  ];

  const categoryBadgeMap: Record<string, string> = {
    "SOP": "bg-indigo-50 text-indigo-700 border-indigo-200",
    "Service Manual": "bg-blue-50 text-blue-700 border-blue-200",
    "Policy": "bg-amber-50 text-amber-700 border-amber-200",
    "Contract": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "OEM Document": "bg-purple-50 text-purple-700 border-purple-200"
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Knowledge Center</h1>
          <p className="text-slate-500 text-sm">Access technical service manuals, standard operating procedures, policies, and fleet service contracts.</p>
        </div>
        <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors">
          <Plus className="h-4 w-4" />
          Create Article
        </button>
      </div>

      {/* Main Content Area */}
      <div className="grid gap-6 md:grid-cols-4">
        {/* Sidebar categories */}
        <div className="md:col-span-1 space-y-4">
          <Card className="border border-slate-100 shadow-sm">
            <CardHeader className="p-4">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">Categories</CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0 space-y-1">
              {[
                { name: "All Documents", count: articles.length },
                { name: "Service Manuals", count: articles.filter((a: any) => a.category === "Service Manual").length },
                { name: "SOPs", count: articles.filter((a: any) => a.category === "SOP").length },
                { name: "Policies", count: articles.filter((a: any) => a.category === "Policy").length },
                { name: "Contracts", count: articles.filter((a: any) => a.category === "Contract").length },
              ].map((cat: any, i: number) => (
                <button 
                  key={i}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex justify-between items-center ${
                    i === 0 ? "bg-blue-50 text-blue-600 font-bold" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>{cat.name}</span>
                  <Badge variant="secondary" className="bg-slate-100 text-[9px] px-1.5 py-0 border-none">{cat.count}</Badge>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Articles list */}
        <div className="md:col-span-3 space-y-6">
          <Card className="border border-slate-100 shadow-sm">
            <CardHeader className="py-4 border-b border-slate-50 flex flex-row items-center justify-between">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input type="search" placeholder="Search knowledge base..." className="pl-9 text-xs" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead>Document Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {articles.map((art: any) => (
                    <TableRow key={art.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="max-w-[320px]">
                        <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {art.title}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{art.content}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[9px] uppercase font-semibold whitespace-nowrap ${categoryBadgeMap[art.category] || "border-slate-200"}`}>
                          {art.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {art.tags?.map((t: string) => (
                            <Badge key={t} variant="secondary" className="bg-slate-100 text-[9px] text-slate-500 border-none px-1.5 py-0.5">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <button className="text-slate-400 hover:text-slate-600 p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
