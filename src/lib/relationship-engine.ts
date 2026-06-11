import { createClient } from "@/lib/supabase/server";
import { getTransactions, getBookings } from "@/lib/laravel/api";

export interface CustomerRevenueInsight {
  customerId: string;
  fullName: string;
  phone: string;
  email: string;
  totalSpent: number;
  vehicleCount: number;
}

export interface CustomerComplaintsInsight {
  customerId: string;
  fullName: string;
  phone: string;
  complaintCount: number;
  lastComplaintSeverity: string;
  lastComplaintDescription: string;
}

export interface FleetExpansionInsight {
  customerId: string;
  fullName: string;
  phone: string;
  city: string;
  vehicleCount: number;
  completedBookingsCount: number;
  expansionScore: number; // calculated score
}

export interface LowAmcPenetrationInsight {
  customerId: string;
  fullName: string;
  phone: string;
  vehicleCount: number;
  uncoveredVehicleCount: number;
  amcPenetrationRate: number; // percentage
}

/**
 * Company Relationship Engine analyzes connections between Customers, Vehicles, Bookings,
 * Complaints, and Transactions to generate strategic insights.
 */
export async function getRelationshipInsights(preFetchedTxns?: any[], preFetchedBookings?: any[]) {
  const supabase = await createClient();

  // Load all foundational cached datasets
  const [
    { data: customers },
    { data: vehicles },
    { data: complaints },
    { data: amcPlans },
    bookingsRaw,
    transactionsRaw
  ] = await Promise.all([
    supabase.from("customers").select("*"),
    supabase.from("vehicles").select("*"),
    supabase.from("complaints").select("*"),
    supabase.from("amc_plans").select("*"),
    preFetchedBookings ? Promise.resolve(preFetchedBookings) : getBookings().catch(() => []),
    preFetchedTxns ? Promise.resolve(preFetchedTxns) : getTransactions().catch(() => [])
  ]);

  const customerList = customers || [];
  const vehicleList = vehicles || [];
  const complaintList = complaints || [];
  const amcPlanList = amcPlans || [];
  const bookingList = bookingsRaw || [];
  const transactionList = transactionsRaw || [];

  // Helper map to quickly lookup customer records
  const customerMap = new Map<string, any>();
  customerList.forEach((c: any) => customerMap.set(c.id, c));

  // Helper map: Customer ID -> Vehicles owned
  const customerVehiclesMap = new Map<string, any[]>();
  vehicleList.forEach((v: any) => {
    if (v.customer_id) {
      const list = customerVehiclesMap.get(v.customer_id) || [];
      list.push(v);
      customerVehiclesMap.set(v.customer_id, list);
    }
  });

  // Helper map: Customer ID -> Bookings made
  const customerBookingsMap = new Map<string, any[]>();
  bookingList.forEach((b: any) => {
    if (b.customer_id) {
      const list = customerBookingsMap.get(b.customer_id) || [];
      list.push(b);
      customerBookingsMap.set(b.customer_id, list);
    }
  });

  // 1. Top customers by revenue
  // We match Laravel transaction logs to Supabase customers via email or ID
  const customerRevenue: Record<string, number> = {};
  transactionList.forEach((t: any) => {
    if (t.status === "success" && t.user) {
      // Find customer by email or full_name
      const emailMatch = customerList.find((c: any) => c.email?.toLowerCase() === t.user.email?.toLowerCase());
      const nameMatch = emailMatch || customerList.find((c: any) => c.full_name?.toLowerCase() === t.user.name?.toLowerCase());
      
      const cid = nameMatch ? nameMatch.id : t.customer_id || "unknown";
      if (cid !== "unknown") {
        customerRevenue[cid] = (customerRevenue[cid] || 0) + Number(t.amount || 0);
      }
    }
  });

  const topRevenueCustomers: CustomerRevenueInsight[] = Object.entries(customerRevenue)
    .map(([cid, totalSpent]) => {
      const c = customerMap.get(cid);
      const owned = customerVehiclesMap.get(cid) || [];
      return {
        customerId: cid,
        fullName: c ? c.full_name : "Unknown Customer",
        phone: c ? c.phone : "N/A",
        email: c ? c.email : "N/A",
        totalSpent: Number(totalSpent.toFixed(2)),
        vehicleCount: owned.length
      };
    })
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);

  // 2. Customers with high complaints
  const customerComplaintsCount: Record<string, number> = {};
  const customerLastComplaint: Record<string, any> = {};

  complaintList.forEach((comp: any) => {
    if (comp.customer_id) {
      customerComplaintsCount[comp.customer_id] = (customerComplaintsCount[comp.customer_id] || 0) + 1;
      customerLastComplaint[comp.customer_id] = comp;
    }
  });

  const highComplaintCustomers: CustomerComplaintsInsight[] = Object.entries(customerComplaintsCount)
    .map(([cid, count]) => {
      const c = customerMap.get(cid);
      const lastC = customerLastComplaint[cid];
      return {
        customerId: cid,
        fullName: c ? c.full_name : "Unknown Customer",
        phone: c ? c.phone : "N/A",
        complaintCount: count,
        lastComplaintSeverity: lastC ? lastC.severity : "medium",
        lastComplaintDescription: lastC ? lastC.description : "No description provided."
      };
    })
    .sort((a, b) => b.complaintCount - a.complaintCount)
    .slice(0, 5);

  // 3. Fleet customers with expansion potential
  // We identify fleet owners (>= 2 vehicles) and analyze booking frequency
  const fleetExpansionPotential: FleetExpansionInsight[] = [];
  customerList.forEach((c: any) => {
    const owned = customerVehiclesMap.get(c.id) || [];
    if (owned.length >= 2) {
      const bookings = customerBookingsMap.get(c.id) || [];
      const completed = bookings.filter((b: any) => b.status === "booking.completed" || b.status === "completed").length;
      
      // Expansion score = vehicleCount * 10 + completedBookingsCount * 2
      // Higher utilization of their current small fleet indicates demand for bulk commercial support contracts
      const expansionScore = owned.length * 10 + completed * 2;

      fleetExpansionPotential.push({
        customerId: c.id,
        fullName: c.full_name,
        phone: c.phone,
        city: c.city || "Pune",
        vehicleCount: owned.length,
        completedBookingsCount: completed,
        expansionScore
      });
    }
  });

  fleetExpansionPotential.sort((a, b) => b.expansionScore - a.expansionScore);

  // 4. Customers with low AMC penetration
  const lowAmcPenetration: LowAmcPenetrationInsight[] = [];
  customerList.forEach((c: any) => {
    const owned = customerVehiclesMap.get(c.id) || [];
    if (owned.length > 0) {
      const uncovered = owned.filter((v: any) => v.amc_status !== "active").length;
      const rate = Math.round(((owned.length - uncovered) / owned.length) * 100);

      // We prioritize customers who own vehicles but have low coverages
      if (rate < 100) {
        lowAmcPenetration.push({
          customerId: c.id,
          fullName: c.full_name,
          phone: c.phone,
          vehicleCount: owned.length,
          uncoveredVehicleCount: uncovered,
          amcPenetrationRate: rate
        });
      }
    }
  });

  lowAmcPenetration.sort((a, b) => b.uncoveredVehicleCount - a.uncoveredVehicleCount).slice(0, 5);

  return {
    topRevenueCustomers,
    highComplaintCustomers,
    fleetExpansionPotential: fleetExpansionPotential.slice(0, 5),
    lowAmcPenetration
  };
}
