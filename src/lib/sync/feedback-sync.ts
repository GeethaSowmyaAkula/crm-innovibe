/**
 * feedback-sync.ts
 * Core sync logic: reads completed Laravel bookings → creates Supabase feedback survey tasks
 * 
 * Rules:
 * - Only process bookings with status "booking.completed"
 * - Skip if booking_id already exists in feedback_queue (idempotent)
 * - due_at = booking completion date + 1 day
 */

import { getBookings, type LaravelBooking } from "@/lib/laravel/api";
import { createClient } from "@/lib/supabase/server";

export interface FeedbackSyncResult {
  total_completed: number;
  already_queued: number;
  created: number;
  failed: number;
  errors: string[];
}

export async function syncCompletedBookingsToFeedback(): Promise<FeedbackSyncResult> {
  const result: FeedbackSyncResult = {
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
  const COMPLETED_STATUS = "booking.completed";
  const completedBookings = allBookings.filter((b) => b.status === COMPLETED_STATUS);
  result.total_completed = completedBookings.length;

  if (completedBookings.length === 0) return result;

  // 3. Get Supabase client
  const supabase = await createClient();

  // 4. Fetch all existing booking_ids in feedback_queue (to avoid duplicates)
  const { data: existingRows } = await supabase
    .from("feedback_queue")
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

    // Build feedback row
    const rawDate = booking.created_at;
    const completionDate = rawDate
      ? typeof rawDate === "number"
        ? new Date(rawDate * 1000)        // Unix seconds → ms
        : new Date(rawDate)               // ISO string fallback
      : new Date();

    const dueAt = new Date(completionDate);
    dueAt.setDate(dueAt.getDate() + 1); // Survey sent exactly 1 day later

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

    const feedbackRow = {
      booking_id: bookingIdStr,
      customer_name: customerName,
      customer_phone: customerPhone,
      vehicle_name: vehicleName,
      service_type: serviceType,
      trigger_date: completionDate.toISOString(),
      due_at: dueAt.toISOString(),
      status: "pending",
      automation_status: "waiting",
      escalation_required: false,
    };

    const { error } = await supabase
      .from("feedback_queue")
      .insert([feedbackRow]);

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
