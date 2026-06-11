"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, Database, Bot, Webhook, Shield, User, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  
  // Saving states
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingDatabase, setSavingDatabase] = useState(false);
  const [savingAI, setSavingAI] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Form states
  const [companyName, setCompanyName] = useState("InnoVibe Mobility");
  const [supportEmail, setSupportEmail] = useState("support@innovibe.in");
  const [supportPhone, setSupportPhone] = useState("+91 98001 00000");
  const [timezone, setTimezone] = useState("Asia/Kolkata (IST)");

  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");

  const [openaiKey, setOpenaiKey] = useState("");
  const [whatsappToken, setWhatsappToken] = useState("");

  const [profileName, setProfileName] = useState("Admin User");
  const [profileEmail, setProfileEmail] = useState("admin@innovibe.in");

  // Fetch settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        
        if (data.ok && data.settings) {
          const s = data.settings;
          if (s.general) {
            setCompanyName(s.general.companyName ?? "InnoVibe Mobility");
            setSupportEmail(s.general.supportEmail ?? "support@innovibe.in");
            setSupportPhone(s.general.supportPhone ?? "+91 98001 00000");
            setTimezone(s.general.timezone ?? "Asia/Kolkata (IST)");
          }
          if (s.supabase) {
            setSupabaseUrl(s.supabase.url ?? "");
            setSupabaseKey(s.supabase.key ?? "");
          }
          if (s.ai) {
            setOpenaiKey(s.ai.openaiKey ?? "");
            setWhatsappToken(s.ai.whatsappToken ?? "");
          }
          if (s.profile) {
            setProfileName(s.profile.name ?? "Admin User");
            setProfileEmail(s.profile.email ?? "admin@innovibe.in");
          }
        }
      } catch (err: any) {
        console.error("Failed to load settings:", err);
        toast.error(`Could not load settings: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  // Generic save handler
  async function saveSetting(key: string, value: any, setSaving: (val: boolean) => void) {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Settings for '${key}' updated successfully.`);
      } else {
        toast.error(`Failed to save settings: ${data.error}`);
      }
    } catch (err: any) {
      toast.error(`Failed to save settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="text-slate-500 font-medium text-sm">Loading AIOS configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">Configure your AIOS modules, integrations, and permissions.</p>
      </div>

      {/* General Settings */}
      <Card className="border border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <Settings className="h-5 w-5 text-blue-500" />
            General Settings
          </CardTitle>
          <CardDescription>Basic configuration of your corporate instance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="support-email">Support Email</Label>
              <Input
                id="support-email"
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="support-phone">Support Phone</Label>
              <Input
                id="support-phone"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={() =>
              saveSetting("general", { companyName, supportEmail, supportPhone, timezone }, setSavingGeneral)
            }
            disabled={savingGeneral}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {savingGeneral && <Loader2 className="h-4 w-4 animate-spin" />}
            Save General Settings
          </button>
        </CardContent>
      </Card>

      {/* Database / Supabase */}
      <Card className="border border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <Database className="h-5 w-5 text-green-500" />
            Supabase Config
          </CardTitle>
          <CardDescription>Direct interface credentials for Supabase.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="supabase-url">Supabase URL</Label>
              <Input
                id="supabase-url"
                placeholder="https://xxxx.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="supabase-key">Anon Key</Label>
              <Input
                id="supabase-key"
                type="password"
                placeholder="••••••••••••••••"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={() =>
              saveSetting("supabase", { url: supabaseUrl, key: supabaseKey }, setSavingDatabase)
            }
            disabled={savingDatabase}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {savingDatabase && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Database Settings
          </button>
        </CardContent>
      </Card>

      {/* AI Agent Integration */}
      <Card className="border border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <Bot className="h-5 w-5 text-purple-500" />
            AI &amp; Communications
          </CardTitle>
          <CardDescription>Integrate third-party LLM and WhatsApp message routers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="openai-key">OpenAI API Key (or Gemini API Key)</Label>
              <Input
                id="openai-key"
                type="password"
                placeholder="sk-••••••••••••••••"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="whatsapp-token">WhatsApp Cloud API Token</Label>
              <Input
                id="whatsapp-token"
                type="password"
                placeholder="EAA••••••••••••••"
                value={whatsappToken}
                onChange={(e) => setWhatsappToken(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={() =>
              saveSetting("ai", { openaiKey, whatsappToken }, setSavingAI)
            }
            disabled={savingAI}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {savingAI && <Loader2 className="h-4 w-4 animate-spin" />}
            Save AI Settings
          </button>
        </CardContent>
      </Card>

      {/* n8n Webhooks */}
      <Card className="border border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <Webhook className="h-5 w-5 text-orange-500" />
            n8n Integration Endpoints
          </CardTitle>
          <CardDescription>Exposed API webhooks for system automations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "New Booking Webhook Sync", path: "/api/bookings" },
            { label: "New Complaint Ingestion", path: "/api/complaints" },
            { label: "New Lead Capture Route", path: "/api/leads" },
            { label: "Reminder Dispatch Sync Router", path: "/api/reminders" },
          ].map((ep) => (
            <div key={ep.path} className="flex items-center justify-between p-3 border rounded-md border-slate-100 bg-slate-50">
              <div>
                <p className="text-sm font-medium text-slate-700">{ep.label}</p>
                <code className="text-xs text-slate-500 font-mono">POST {ep.path}</code>
              </div>
              <Badge variant="outline" className="text-blue-600 border-blue-200">Active</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Resiliency & Monitoring Dashboards */}
      <Card className="border border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <Database className="h-5 w-5 text-indigo-500" />
            Resiliency &amp; Monitoring Dashboards
          </CardTitle>
          <CardDescription>Audit integrations, cache errors, and live event signals.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Link 
            href="/settings/sync-monitoring" 
            className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50/50 flex items-center justify-between group transition-all duration-200"
          >
            <div>
              <p className="text-sm font-semibold text-slate-800">Sync Monitor</p>
              <p className="text-xs text-slate-500 mt-0.5">Track data caching errors, warnings, and retry cycles.</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
          </Link>
          <Link 
            href="/settings/event-monitoring" 
            className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50/50 flex items-center justify-between group transition-all duration-200"
          >
            <div>
              <p className="text-sm font-semibold text-slate-800">Event Registry Monitor</p>
              <p className="text-xs text-slate-500 mt-0.5">Trace audit timeline signals, triggers, and payload logs.</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <Shield className="h-5 w-5 text-red-500" />
            Role-Based Access Control
          </CardTitle>
          <CardDescription>Current permission specifications across the AIOS environment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { role: "CEO", desc: "Full operating dashboard controls, strategic approvals, and AI execution capability", color: "text-purple-600 bg-purple-50 border-purple-200" },
            { role: "Admin", desc: "System configuration, logs tracking, settings maintenance", color: "text-red-600 bg-red-50 border-red-200" },
            { role: "Operations", desc: "Technician schedules, bookings, service monitoring", color: "text-orange-600 bg-orange-50 border-orange-200" },
            { role: "Marketing", desc: "Announcements, segmentation engines, WhatsApp campaign logs", color: "text-blue-600 bg-blue-50 border-blue-200" },
            { role: "Finance", desc: "Transactions, payments ledger, revenue charts", color: "text-green-600 bg-green-50 border-green-200" },
          ].map((r) => (
            <div key={r.role} className="flex items-center justify-between p-3 border border-slate-100 rounded-md">
              <div>
                <p className="text-sm font-medium text-slate-700">{r.role}</p>
                <p className="text-xs text-slate-500">{r.desc}</p>
              </div>
              <Badge variant="outline" className={r.color}>{r.role}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Profile */}
      <Card className="border border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <User className="h-5 w-5 text-slate-500" />
            Your Profile
          </CardTitle>
          <CardDescription>Manage user parameters.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="profile-name">Full Name</Label>
              <Input
                id="profile-name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-email">Email</Label>
              <Input
                id="profile-email"
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={() =>
              saveSetting("profile", { name: profileName, email: profileEmail }, setSavingProfile)
            }
            disabled={savingProfile}
            className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-md text-sm hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
            Update Profile
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
