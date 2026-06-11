/**
 * src/lib/events.ts
 * AIOS Central Events Broker Framework
 * 
 * Interacts with the `events` and `activity_feed` tables in Supabase.
 * Acts as the nervous system for InnoVibe AIOS, catching and logging every operation.
 * Logs failures to failed_events for retry processing.
 */

import { createClient } from "@/lib/supabase/server";

export interface EventLog {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  payload: any;
  source: string;
  status: "pending" | "processed" | "failed";
  created_at: string;
}

/**
 * Persists failed events attempts to the failed_events log table.
 */
async function logFailedEvent(
  eventType: string,
  entityType: string,
  entityId: string,
  payload: any,
  errorMessage: string
) {
  try {
    const supabase = await createClient();
    await supabase.from("failed_events").insert({
      event_type: eventType,
      entity_type: entityType,
      entity_id: String(entityId),
      payload,
      error_message: errorMessage,
      retry_count: 0,
      status: "failed"
    });
  } catch (err: any) {
    console.error("Failed to log failed event record:", err.message);
  }
}

/**
 * Publishes a new business event to the database and schedules downstream activity feeds/automations.
 */
export async function publishEvent(
  eventType: string,
  entityType: string,
  entityId: string,
  payload: Record<string, any>,
  source: string = "aios"
): Promise<EventLog | null> {
  try {
    const supabase = await createClient();

    // 1. Insert into events log
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .insert({
        event_type: eventType,
        entity_type: entityType,
        entity_id: String(entityId),
        payload,
        source,
        status: "pending",
      })
      .select()
      .single();

    if (eventError) {
      // Degrade gracefully if tables aren't present yet (log to console)
      if (eventError.code === "42P01") {
        console.warn(`[EVENT PUBLISH MOCKED] Table 'events' not found. Event: ${eventType}`);
        return null;
      }
      console.error(`Failed to publish event ${eventType}:`, eventError.message);
      await logFailedEvent(eventType, entityType, entityId, payload, eventError.message);
      return null;
    }

    // 2. Generate activity timeline entry
    const description = generateActivityDescription(eventType, payload);
    const { error: feedError } = await supabase
      .from("activity_feed")
      .insert({
        event_id: eventData.id,
        description,
      });

    if (feedError) {
      console.error(`Failed to insert activity feed for ${eventType}:`, feedError.message);
    }

    // 3. Placeholder trigger for Phase 3 Automation Engine
    try {
      await processAutomationTriggers(eventData.id, eventType, payload);
    } catch (autoErr: any) {
      console.error(`Automation trigger failed for ${eventType}:`, autoErr.message);
    }

    return eventData;
  } catch (err: any) {
    console.error(`Unexpected error in publishEvent:`, err.message);
    await logFailedEvent(eventType, entityType, entityId, payload, err.message);
    return null;
  }
}

/**
 * Maps event payloads into readable corporate activity string descriptions
 */
function generateActivityDescription(eventType: string, payload: Record<string, any>): string {
  const time = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  switch (eventType) {
    case "CUSTOMER_CREATED":
      return `${time} Customer Created: ${payload.name || "New EV Customer"}`;
    case "VEHICLE_ADDED":
      return `${time} Vehicle Registered: ${payload.registration_number || "Unknown plate"}`;
    case "BOOKING_CREATED":
      return `${time} Booking Created for ${payload.customer_name || "Customer"}`;
    case "BOOKING_ASSIGNED":
      return `${time} Booking #${payload.booking_id} Assigned to Tech ${payload.tech_name || "Rahul"}`;
    case "BOOKING_COMPLETED":
      return `${time} Booking Completed - Paid: $${payload.price ?? 0}`;
    case "PAYMENT_SUCCESS":
      return `${time} Payment of $${payload.amount ?? 0} Cleared`;
    case "AMC_PURCHASED":
      return `${time} AMC Subscription purchased for Vehicle ${payload.vehicle_name || "EV"}`;
    case "COMPLAINT_CREATED":
      return `${time} Complaint Raised [${payload.category || "General"}]: ${payload.description || "Issue description"}`;
    case "LEAD_CREATED":
      return `${time} Lead Registered from channel: ${payload.source || "Organic"}`;
    case "DEVICE_ALERT":
      return `${time} Telemetry Warning on Vehicle ${payload.vehicle_id}: ${payload.description || "Alert detected"}`;
    case "VEHICLE_HEALTH_CHANGED":
      return `${time} Vehicle Health Changed: SOH drops to ${payload.new_score || 0}%`;
    default:
      return `${time} Action recorded: ${eventType.replace(/_/g, " ")}`;
  }
}

/**
 * Evaluates active TCA (Trigger-Condition-Action) automation rules
 */
async function processAutomationTriggers(eventId: string, eventType: string, payload: any) {
  // Phase 3 TCA runner hook
  console.log(`[AUTOMATION HOOK] Checking triggers for event ${eventType} (Event ID: ${eventId})`);
}
