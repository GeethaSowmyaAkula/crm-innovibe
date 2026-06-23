"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "lucide-react";

export default function ERPPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">ERP</h1>
        <p className="text-slate-500">Enterprise Resource Planning</p>
      </div>

      <Card className="border border-slate-200 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <Database className="h-5 w-5 text-blue-500" />
            Enterprise Resource Planning
          </CardTitle>
          <CardDescription>
            This section is reserved for future ERP modules and integrations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 text-sm leading-relaxed">
            The ERP suite will unify human resources, talent management, supply chain, inventory, and finance modules into the central ICC environment.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
