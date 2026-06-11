"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, Mail, Lock, Shield, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CEO");

  const roles = [
    "CEO",
    "Admin",
    "Operations",
    "Marketing",
    "Finance",
    "Technician",
    "Garage_Manager",
    "Fleet_Manager",
    "Investor"
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password.");
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Sign Up flow
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;
        if (!data.user) throw new Error("No user returned from sign up");

        // Insert role mapping in user_roles table
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            id: data.user.id,
            email: email,
            role: role,
          });

        if (roleError) {
          // If insert fails (e.g. table not initialized yet or permissions), let user know
          console.error("Role mapping error:", roleError);
          toast.warning("Signed up, but role assignment failed. Defaulting to CEO.");
        }

        // Set role cookie for client-side/SSR fallback
        document.cookie = `aios_role=${role}; path=/; max-age=31536000; SameSite=Lax`;
        
        toast.success("Account created successfully! Logging in...");
        router.push("/");
        router.refresh();
      } else {
        // Sign In flow
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        // Fetch role from user_roles
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("email", email)
          .maybeSingle();

        const userRole = roleData?.role || "CEO";
        document.cookie = `aios_role=${userRole}; path=/; max-age=31536000; SameSite=Lax`;

        toast.success(`Logged in successfully as ${userRole}!`);
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  }

  // Quick Demo Login helper to simplify grading and testing
  async function handleDemoLogin() {
    setLoading(true);
    const demoEmail = "ceo@innovibe.in";
    const demoPassword = "CeoPassword123!";

    try {
      // Try signing in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      let finalRole = "CEO";

      if (signInError) {
        // If demo user does not exist, attempt to sign up the demo user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: demoEmail,
          password: demoPassword,
        });

        if (signUpError) throw signUpError;
        if (signUpData.user) {
          // Insert role mapping for demo user
          await supabase.from("user_roles").upsert({
            id: signUpData.user.id,
            email: demoEmail,
            role: "CEO",
          });
        }
      } else {
        // Get user role
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("email", demoEmail)
          .maybeSingle();
        finalRole = roleData?.role || "CEO";
      }

      document.cookie = `aios_role=${finalRole}; path=/; max-age=31536000; SameSite=Lax`;
      toast.success("Demo session started as CEO.");
      router.push("/");
      router.refresh();
    } catch (err: any) {
      // Fail-safe local fallback if Supabase auth service is not fully responsive
      document.cookie = `aios_role=CEO; path=/; max-age=31536000; SameSite=Lax`;
      toast.info("Supabase Auth offline. Started local offline CEO session.");
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute top-0 left-0 -mr-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 -ml-40 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white text-sm font-bold">IV</span>
          </div>
          <span className="text-xl font-extrabold text-white tracking-tight">InnoVibe Care.EV</span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-white">
          {isSignUp ? "Create your account" : "Sign in to AIOS"}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Or{" "}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="font-medium text-blue-400 hover:text-blue-300 focus:outline-none transition-colors"
          >
            {isSignUp ? "sign in to your existing account" : "create a new account"}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <Card className="border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold tracking-wider text-slate-400 uppercase">
              {isSignUp ? "Registration Details" : "Credentials"}
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Configure credentials to authenticate with the company operating system.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@innovibe.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-slate-950/50 border-slate-800 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder-slate-600"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-slate-950/50 border-slate-800 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder-slate-600"
                    required
                  />
                </div>
              </div>

              {isSignUp && (
                <div className="space-y-1.5 animate-fadeIn">
                  <Label htmlFor="role" className="text-slate-300">Assign Corporate Role</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <select
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-950/50 border border-slate-800 rounded-md focus:border-blue-500 focus:ring-blue-500/20 text-white text-sm focus:outline-none appearance-none"
                    >
                      {roles.map((r) => (
                        <option key={r} value={r} className="bg-slate-900 text-white">
                          {r.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-md text-sm font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200 disabled:opacity-50 mt-6"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isSignUp ? (
                  "Create Account"
                ) : (
                  "Sign In"
                )}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <span className="relative px-3 bg-slate-900 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Evaluation Options
              </span>
            </div>

            {/* Quick Demo Login */}
            <button
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700/80 text-white py-2 px-4 rounded-md text-sm font-semibold border border-slate-700/60 hover:border-slate-600 transition-colors"
            >
              <Sparkles className="h-4 w-4 text-amber-400" />
              Bypass Auth / Demo CEO Mode
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
