/**
 * booking-reminder.ts
 * Core sync logic: reads completed Laravel bookings → creates Supabase reminders
 * 
 * Rules:
 * - Only process bookings with status "completed"
 * - Skip if booking_id already exists in reminder_queue (idempotent)
 * - due_at = booking completion date + 30 days
 * - trigger_type = "service_followup"
 */

import { getBookings, type LaravelBooking } from "@/lib/laravel/api";
import { createClient } from "@/lib/supabase/server";

export interface SyncResult {
  total_completed: number;
  already_queued: number;
  created: number;
  failed: number;
  errors: string[];
}

export async function syncCompletedBookingsToReminders(): Promise<SyncResult> {
  const result: SyncResult = {
    total_completed: 0,
    already_queued: 0,
    created: 0,
    failed: 0,
    errors: [],
  };

  // 1. Fetch all bookings from Laravel (read-only)
  const allBookings = await getBookings().catch((err) => {
    result.errors.push(`Laravel fetch error: ${err.message}`);
    return [] as LaravelBooking[];
  });

  // 2. Filter to completed only
  // NOTE: Laravel uses dot-notation statuses — the completed state is "booking.completed"
  const COMPLETED_STATUS = "booking.completed";
  const completedBookings = allBookings.filter((b) => b.status === COMPLETED_STATUS);
  result.total_completed = completedBookings.length;

  if (completedBookings.length === 0) return result;

  // 3. Get Supabase client
  const supabase = await createClient();

  // 4. Fetch all existing booking_ids in reminder_queue (to avoid duplicates)
  const { data: existingRows } = await supabase
    .from("reminder_queue")
    .select("booking_id")
    .not("booking_id", "is", null);

  const existingBookingIds = new Set(
    (existingRows ?? []).map((r: any) => String(r.booking_id))
  );

  // 5. Process each completed booking
  for (const booking of completedBookings) {
    const bookingIdStr = String(booking.id);

    // Skip already queued
    if (existingBookingIds.has(bookingIdStr)) {
      result.already_queued++;
      continue;
    }

    // Build reminder row
    // NOTE: Laravel's created_at is a Unix timestamp in seconds (integer), not ISO string
    const rawDate = booking.created_at;
    const completionDate = rawDate
      ? typeof rawDate === "number"
        ? new Date(rawDate * 1000)        // Unix seconds → ms
        : new Date(rawDate)               // ISO string fallback
      : new Date();

    const dueAt = new Date(completionDate);
    dueAt.setDate(dueAt.getDate() + 30);

    const customerName =
      booking.user?.name ?? booking.user?.mobile ?? "Unknown";
    const customerPhone = booking.user?.mobile ?? "";
    const vehicleName = [
      booking.vehicle?.brand?.name,
      booking.vehicle?.model?.name,
      booking.vehicle?.registration_number,
    ]
      .filter(Boolean)
      .join(" / ") || "Unknown Vehicle";
    const serviceType = booking.service?.title ?? "General Service";

    const reminderRow = {
      booking_id: bookingIdStr,
      customer_name: customerName,
      customer_phone: customerPhone,
      vehicle_name: vehicleName,
      service_type: serviceType,
      trigger_type: "service_followup",
      trigger_date: completionDate.toISOString(),
      due_at: dueAt.toISOString(),
      status: "pending",
      sent_status: "pending",       // keep legacy column in sync
      automation_status: "waiting",
      reminder_type: "service_followup", // legacy column
      scheduled_at: dueAt.toISOString(), // legacy column
    };

    const { error } = await supabase
      .from("reminder_queue")
      .insert([reminderRow]);

    if (error) {
      // Ignore unique constraint violations (race condition safety)
      if (error.code === "23505") {
        result.already_queued++;
      } else {
        result.failed++;
        result.errors.push(`Booking ${booking.id}: ${error.message}`);
      }
    } else {
      result.created++;
    }
  }

  return result;
}
