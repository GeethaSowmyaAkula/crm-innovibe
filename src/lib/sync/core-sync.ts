/**
 * src/lib/sync/core-sync.ts
 * Core Sync Engine — InnoVibe AIOS
 * 
 * Fetches data from the protected read-only Laravel API and caches it in Supabase.
 * Maps Laravel integer IDs to deterministic UUID v5 namespace values.
 * Records audit logs and publishes transaction events.
 * Logs failures to failed_sync_records and implements retry logic.
 */

import crypto from "crypto";
import { 
  getUsers, 
  getVehicles, 
  getBookings, 
  getServiceCenters,
  type LaravelUser,
  type LaravelVehicle,
  type LaravelBooking,
  type LaravelServiceCenter
} from "@/lib/laravel/api";
import { createClient } from "@/lib/supabase/server";
import { publishEvent } from "@/lib/events";

export interface SyncReport {
  timestamp: string;
  garages: { fetched: number; upserted: number; failed: number };
  customers: { fetched: number; upserted: number; failed: number };
  vehicles: { fetched: number; upserted: number; failed: number };
  bookings: { fetched: number; upserted: number; failed: number };
  errors: string[];
}

/**
 * Generates a stable deterministic UUID v5 from a namespace and integer ID
 */
export function generateDeterministicUuid(namespace: string, id: number | string): string {
  const hash = crypto.createHash("sha1").update(`${namespace}:${id}`).digest("hex");
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    "5" + hash.substring(13, 16),
    ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16) + hash.substring(18, 20),
    hash.substring(20, 32)
  ].join("-");
}

/**
 * Persists failed synchronization attempts to the failed_sync_records log table.
 */
async function logFailedSync(
  entityType: string,
  entityId: string | number,
  rawData: any,
  errorMessage: string
) {
  try {
    const supabase = await createClient();
    const idStr = String(entityId);
    
    // Check if it already exists
    const { data: existing } = await supabase
      .from("failed_sync_records")
      .select("id, retry_count")
      .eq("entity_type", entityType)
      .eq("entity_id", idStr)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("failed_sync_records")
        .update({
          raw_data: rawData,
          error_message: errorMessage,
          status: "failed",
          retry_count: (existing.retry_count ?? 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("failed_sync_records")
        .insert({
          entity_type: entityType,
          entity_id: idStr,
          raw_data: rawData,
          error_message: errorMessage,
          retry_count: 0,
          status: "failed"
        });
    }
  } catch (err: any) {
    console.error("Failed to log failed sync record:", err.message);
  }
}

/**
 * Executes a full cache synchronization of Laravel databases to Supabase.
 */
export async function runMasterSync(): Promise<SyncReport> {
  const report: SyncReport = {
    timestamp: new Date().toISOString(),
    garages: { fetched: 0, upserted: 0, failed: 0 },
    customers: { fetched: 0, upserted: 0, failed: 0 },
    vehicles: { fetched: 0, upserted: 0, failed: 0 },
    bookings: { fetched: 0, upserted: 0, failed: 0 },
    errors: []
  };

  const supabase = await createClient();

  // 1. Sync Garages
  try {
    const centers = await getServiceCenters();
    report.garages.fetched = centers.length;
    for (const c of centers) {
      const uuid = generateDeterministicUuid("garage", c.id);
      const { error } = await supabase
        .from("garages")
        .upsert({
          id: uuid,
          name: c.name,
          address: c.address || "",
          city: c.city || "",
          capacity: 10,
          available_slots: 10,
          rating: c.status === "active" ? 4.5 : 3.0
        });

      if (error) {
        report.garages.failed++;
        report.errors.push(`Garage #${c.id} sync error: ${error.message}`);
        await logFailedSync("garage", uuid, c, error.message);
      } else {
        report.garages.upserted++;
      }
    }
  } catch (err: any) {
    report.errors.push(`Garages sync failed: ${err.message}`);
  }

  // 2. Sync Customers (Users)
  try {
    const users = await getUsers();
    report.customers.fetched = users.length;
    for (const u of users) {
      const uuid = generateDeterministicUuid("customer", u.id);

      // Check if user already exists in Supabase
      const { data: existing } = await supabase
        .from("customers")
        .select("id")
        .eq("id", uuid)
        .maybeSingle();

      const { error } = await supabase
        .from("customers")
        .upsert({
          id: uuid,
          full_name: u.name || u.mobile || "Unknown EV Owner",
          phone: u.mobile || "",
          whatsapp_number: u.mobile || "",
          email: u.email || "",
          address: u.profession || "",
          city: u.gender || "",
          status: u.status || "active"
        });

      if (error) {
        report.customers.failed++;
        report.errors.push(`Customer #${u.id} sync error: ${error.message}`);
        await logFailedSync("customer", uuid, u, error.message);
      } else {
        report.customers.upserted++;
        // Publish event if this is a newly cached customer
        if (!existing) {
          await publishEvent("CUSTOMER_CREATED", "customer", uuid, {
            name: u.name,
            phone: u.mobile,
            email: u.email
          }, "laravel_sync");
        }
      }
    }
  } catch (err: any) {
    report.errors.push(`Customers sync failed: ${err.message}`);
  }

  // 3. Sync Vehicles
  try {
    const vehicles = await getVehicles();
    report.vehicles.fetched = vehicles.length;
    for (const v of vehicles) {
      const uuid = generateDeterministicUuid("vehicle", v.id);
      const customerUuid = generateDeterministicUuid("customer", v.user_id);

      const { data: existing } = await supabase
        .from("vehicles")
        .select("id")
        .eq("id", uuid)
        .maybeSingle();

      const { error } = await supabase
        .from("vehicles")
        .upsert({
          id: uuid,
          customer_id: customerUuid,
          brand: v.brand?.name || "Unknown Brand",
          model: v.model?.name || "Unknown Model",
          registration_number: v.registration_number || `MOCK-${v.id}`,
          battery_serial: v.vehicle_photos || "",
          purchase_date: v.purchase_date ? new Date(v.purchase_date * 1000).toISOString().split('T')[0] : null,
          battery_health: "90%",
          amc_status: "inactive"
        });

      if (error) {
        report.vehicles.failed++;
        report.errors.push(`Vehicle #${v.id} sync error: ${error.message}`);
        await logFailedSync("vehicle", uuid, v, error.message);
      } else {
        report.vehicles.upserted++;
        if (!existing) {
          await publishEvent("VEHICLE_ADDED", "vehicle", uuid, {
            registration_number: v.registration_number,
            brand: v.brand?.name,
            model: v.model?.name
          }, "laravel_sync");
        }
      }
    }
  } catch (err: any) {
    report.errors.push(`Vehicles sync failed: ${err.message}`);
  }

  // 4. Sync Bookings
  try {
    const bookings = await getBookings();
    report.bookings.fetched = bookings.length;
    for (const b of bookings) {
      const uuid = generateDeterministicUuid("booking", b.id);
      const customerUuid = generateDeterministicUuid("customer", b.user?.id || 0);
      const vehicleUuid = generateDeterministicUuid("vehicle", b.vehicle?.id || 0);
      const garageUuid = b.service_center ? generateDeterministicUuid("garage", b.service_center.id) : null;

      const { data: existing } = await supabase
        .from("bookings")
        .select("id, status")
        .eq("id", uuid)
        .maybeSingle();

      const mappedStatus = b.status === "booking.completed" ? "completed" : "pending";

      // Orphan Handling Strategy: Ensure customer exists in Supabase
      const { data: customerExists } = await supabase
        .from("customers")
        .select("id")
        .eq("id", customerUuid)
        .maybeSingle();

      if (!customerExists) {
        const fallbackName = b.user?.name || (b.user?.mobile ? `User ${b.user.mobile}` : "Orphan Customer");
        const fallbackPhone = b.user?.mobile || "0000000000";
        await supabase.from("customers").insert({
          id: customerUuid,
          full_name: fallbackName,
          phone: fallbackPhone,
          whatsapp_number: fallbackPhone,
          email: "orphan@innovibe.in",
          status: "active"
        });
      }

      // Orphan Handling Strategy: Ensure vehicle exists in Supabase
      const { data: vehicleExists } = await supabase
        .from("vehicles")
        .select("id")
        .eq("id", vehicleUuid)
        .maybeSingle();

      if (!vehicleExists) {
        const brand = b.vehicle?.brand?.name || "Unknown Brand";
        const model = b.vehicle?.model?.name || "Unknown Model";
        const regNum = b.vehicle?.registration_number || `ORPHAN-REG-${b.id}`;
        await supabase.from("vehicles").insert({
          id: vehicleUuid,
          customer_id: customerUuid,
          brand,
          model,
          registration_number: regNum,
          amc_status: "inactive"
        });
      }

      // Orphan Handling Strategy: Ensure garage exists in Supabase (if referenced)
      if (garageUuid) {
        const { data: garageExists } = await supabase
          .from("garages")
          .select("id")
          .eq("id", garageUuid)
          .maybeSingle();

        if (!garageExists) {
          const garageName = b.service_center?.name || `Orphan Garage #${b.service_center?.id}`;
          await supabase.from("garages").insert({
            id: garageUuid,
            name: garageName,
            address: "Placeholder Address",
            city: "Pune",
            capacity: 5,
            available_slots: 5
          });
        }
      }

      const { error } = await supabase
        .from("bookings")
        .upsert({
          id: uuid,
          customer_id: customerUuid,
          vehicle_id: vehicleUuid,
          issue_type: b.service?.title || "General Inspection",
          issue_description: b.issue || "",
          booking_source: "mobile_app",
          preferred_slot: b.date ? new Date(`${b.date}T${b.time || "10:00:00"}`).toISOString() : new Date().toISOString(),
          assigned_garage_id: garageUuid,
          status: mappedStatus
        });

      if (error) {
        report.bookings.failed++;
        report.errors.push(`Booking #${b.id} sync error: ${error.message}`);
        await logFailedSync("booking", uuid, b, error.message);
      } else {
        report.bookings.upserted++;
        if (!existing) {
          // New Booking
          await publishEvent("BOOKING_CREATED", "booking", uuid, {
            customer_name: b.user?.name,
            issue: b.issue,
            preferred_slot: b.date
          }, "laravel_sync");
        } else if (existing.status !== "completed" && mappedStatus === "completed") {
          // Status updated to Completed
          await publishEvent("BOOKING_COMPLETED", "booking", uuid, {
            price: b.booking_price,
            customer_name: b.user?.name,
            vehicle_reg: b.vehicle?.registration_number
          }, "laravel_sync");
        }
      }
    }
  } catch (err: any) {
    report.errors.push(`Bookings sync failed: ${err.message}`);
  }

  // Write operation result to audit log
  try {
    await supabase.from("audit_logs").insert({
      action: "RUN_MASTER_SYNC",
      entity: "sync_layer",
      entity_id: null,
      timestamp: new Date().toISOString()
    });
  } catch {
    // Ignore audit log save error if table not yet created
  }

  return report;
}

/**
 * Retries all failed sync records from the log.
 * Attempts to re-apply constraints that failed earlier.
 */
export async function retryFailedSyncs(): Promise<{ retried: number; resolved: number; failed: number }> {
  const stats = { retried: 0, resolved: 0, failed: 0 };
  const supabase = await createClient();

  const { data: records, error } = await supabase
    .from("failed_sync_records")
    .select("*")
    .eq("status", "failed");

  if (error || !records || records.length === 0) return stats;

  for (const record of records) {
    stats.retried++;
    const raw = record.raw_data;
    let upsertError: any = null;

    if (record.entity_type === "booking") {
      const customerUuid = generateDeterministicUuid("customer", raw.user?.id || 0);
      const vehicleUuid = generateDeterministicUuid("vehicle", raw.vehicle?.id || 0);
      const garageUuid = raw.service_center ? generateDeterministicUuid("garage", raw.service_center.id) : null;
      const mappedStatus = raw.status === "booking.completed" ? "completed" : "pending";

      // Orphan Handling Strategy: Ensure customer exists in Supabase
      const { data: customerExists } = await supabase
        .from("customers")
        .select("id")
        .eq("id", customerUuid)
        .maybeSingle();

      if (!customerExists) {
        const fallbackName = raw.user?.name || (raw.user?.mobile ? `User ${raw.user.mobile}` : "Orphan Customer");
        const fallbackPhone = raw.user?.mobile || "0000000000";
        await supabase.from("customers").insert({
          id: customerUuid,
          full_name: fallbackName,
          phone: fallbackPhone,
          whatsapp_number: fallbackPhone,
          email: raw.user?.email || "orphan@innovibe.in",
          status: "active"
        });
      }

      // Orphan Handling Strategy: Ensure vehicle exists in Supabase
      const { data: vehicleExists } = await supabase
        .from("vehicles")
        .select("id")
        .eq("id", vehicleUuid)
        .maybeSingle();

      if (!vehicleExists) {
        const brand = raw.vehicle?.brand?.name || "Unknown Brand";
        const model = raw.vehicle?.model?.name || "Unknown Model";
        const regNum = raw.vehicle?.registration_number || `ORPHAN-REG-${raw.id}`;
        await supabase.from("vehicles").insert({
          id: vehicleUuid,
          customer_id: customerUuid,
          brand,
          model,
          registration_number: regNum,
          amc_status: "inactive"
        });
      }

      // Orphan Handling Strategy: Ensure garage exists in Supabase (if referenced)
      if (garageUuid) {
        const { data: garageExists } = await supabase
          .from("garages")
          .select("id")
          .eq("id", garageUuid)
          .maybeSingle();

        if (!garageExists) {
          const garageName = raw.service_center?.name || `Orphan Garage #${raw.service_center?.id}`;
          await supabase.from("garages").insert({
            id: garageUuid,
            name: garageName,
            address: "Placeholder Address",
            city: "Pune",
            capacity: 5,
            available_slots: 5
          });
        }
      }

      const { error: err } = await supabase
        .from("bookings")
        .upsert({
          id: record.entity_id,
          customer_id: customerUuid,
          vehicle_id: vehicleUuid,
          issue_type: raw.service?.title || "General Inspection",
          issue_description: raw.issue || "",
          booking_source: "mobile_app",
          preferred_slot: raw.date ? new Date(`${raw.date}T${raw.time || "10:00:00"}`).toISOString() : new Date().toISOString(),
          assigned_garage_id: garageUuid,
          status: mappedStatus
        });
      upsertError = err;
    } else if (record.entity_type === "vehicle") {
      const customerUuid = generateDeterministicUuid("customer", raw.user_id);
      const { error: err } = await supabase
        .from("vehicles")
        .upsert({
          id: record.entity_id,
          customer_id: customerUuid,
          brand: raw.brand?.name || "Unknown Brand",
          model: raw.model?.name || "Unknown Model",
          registration_number: raw.registration_number || `MOCK-${raw.id}`,
          battery_serial: raw.vehicle_photos || "",
          purchase_date: raw.purchase_date ? new Date(raw.purchase_date * 1000).toISOString().split('T')[0] : null,
          battery_health: "90%",
          amc_status: "inactive"
        });
      upsertError = err;
    } else if (record.entity_type === "customer") {
      const { error: err } = await supabase
        .from("customers")
        .upsert({
          id: record.entity_id,
          full_name: raw.name || raw.mobile || "Unknown EV Owner",
          phone: raw.mobile || "",
          whatsapp_number: raw.mobile || "",
          email: raw.email || "",
          address: raw.profession || "",
          city: raw.gender || "",
          status: raw.status || "active"
        });
      upsertError = err;
    }

    if (!upsertError) {
      stats.resolved++;
      await supabase
        .from("failed_sync_records")
        .update({ status: "resolved", updated_at: new Date().toISOString() })
        .eq("id", record.id);
    } else {
      stats.failed++;
      await supabase
        .from("failed_sync_records")
        .update({
          retry_count: (record.retry_count ?? 0) + 1,
          error_message: upsertError.message,
          updated_at: new Date().toISOString()
        })
        .eq("id", record.id);
    }
  }

  return stats;
}
