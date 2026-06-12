"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);

  // Form inputs
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Please enter username and password.");
      return;
    }

    setLoading(true);

    try {
      const normalizedUsername = username.trim().toLowerCase();

      // 1. Direct check for hardcoded admin / innovibe credentials
      if (normalizedUsername === "admin" && password === "innovibe") {
        document.cookie = `aios_role=CEO; path=/; max-age=31536000; SameSite=Lax`;
        toast.success("Logged in successfully as Admin!");
        window.location.href = "/";
        return;
      }

      // 2. Fallback to standard Supabase authentication
      const normalizedEmail = username.includes("@") ? username : `${username}@innovibe.in`;
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (signInError) throw signInError;

      // Fetch role from user_roles
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("email", normalizedEmail)
        .maybeSingle();

      const userRole = roleData?.role || "CEO";
      document.cookie = `aios_role=${userRole}; path=/; max-age=31536000; SameSite=Lax`;

      toast.success(`Logged in successfully as ${userRole}!`);
      window.location.href = "/";
    } catch (err: any) {
      toast.error(err.message || "Invalid username or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute top-0 left-0 -mr-40 w-96 h-96 rounded-full bg-blue-400/15 blur-3xl" />
      <div className="absolute bottom-0 right-0 -ml-40 w-96 h-96 rounded-full bg-purple-400/15 blur-3xl" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white text-sm font-bold">IV</span>
          </div>
          <span className="text-xl font-extrabold text-slate-900 tracking-tight">InnoVibe Care.EV</span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-slate-900">
          Sign in to AIOS
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <Card className="border border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-xl text-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold tracking-wider text-slate-500 uppercase">
              Credentials
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Configure credentials to authenticate with the company operating system.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-slate-700">Username</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 bg-white/50 border-slate-200 focus:border-blue-600 focus:ring-blue-600/10 text-slate-900 placeholder-slate-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-slate-700">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-white/50 border-slate-200 focus:border-blue-600 focus:ring-blue-600/10 text-slate-900 placeholder-slate-400"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-md text-sm font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200 disabled:opacity-50 mt-6"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Sign In"
                )}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
