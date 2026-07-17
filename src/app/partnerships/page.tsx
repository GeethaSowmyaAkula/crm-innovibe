import { PartnershipTracker } from "@/components/dashboard/partnership-tracker";
import { CommandPalette } from "@/components/dashboard/command-palette";

export const dynamic = "force-dynamic";

export default function PartnershipsPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-heading leading-tight flex items-center gap-2">
            Partnership Tracker
          </h1>
          <p className="text-slate-500 text-sm mt-1 leading-normal">
            Manage and track EV OEM, Fleet, Garage, Dealership, and Funding partnerships from initial discussion to closure.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CommandPalette />
          <div className="flex items-center gap-2.5 bg-white px-3.5 py-2 rounded-lg border border-slate-200/80 shadow-sm text-xs font-bold text-slate-650">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            GATEWAY ONLINE
          </div>
        </div>
      </div>

      {/* Main CRM Partnership Tracker Module */}
      <PartnershipTracker />
    </div>
  );
}
