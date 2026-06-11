/**
 * scratch/run-test.ts
 * Live verification test runner for AIOS Phase 1 Foundations
 */

// Setup environment variables first before loading any modules
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://lufynzbrcfrcrgrecxfb.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZnluemJyY2ZyY3JncmVjeGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNzE5NjEsImV4cCI6MjA5NDc0Nzk2MX0.cEcOTr4Pkh1j7rkCs_qMd8_n6XpXLi5z5X676l-GS_Y";
process.env.LARAVEL_API_URL = "https://api.innovibemobility.com/api";
process.env.LARAVEL_ADMIN_EMAIL = "superadmin@innovibe.com";
process.env.LARAVEL_ADMIN_PASSWORD = "12345678";

async function runTests() {
  console.log("🚀 Starting Phase 1 Integration Tests...\n");
  
  // Dynamically import to ensure process.env variables are initialized at module load
  const { publishEvent } = await import("../src/lib/events");
  const { runMasterSync } = await import("../src/lib/sync/core-sync");
  const { createClient } = await import("../src/lib/supabase/server");

  const supabase = await createClient();

  // Test 1: Event System and Activity Feed
  console.log("=== 1. Testing Event System & Timeline Generation ===");
  const testPayload = {
    booking_id: "test-booking-999",
    customer_name: "Verification Auditor",
    issue: "Full System Audit Check",
    price: 350
  };

  console.log("Publishing test event: BOOKING_CREATED...");
  const event = await publishEvent(
    "BOOKING_CREATED",
    "booking",
    "test-booking-999",
    testPayload,
    "audit_system"
  );

  if (event) {
    console.log(`✅ Event published successfully. Event ID: ${event.id}`);
    
    // Fetch timeline activity
    const { data: activity, error: activityError } = await supabase
      .from("activity_feed")
      .select("*")
      .eq("event_id", event.id)
      .single();

    if (activity) {
      console.log(`✅ Activity Feed record created: "${activity.description}"`);
    } else {
      console.error("❌ Failed to verify activity feed entry:", activityError?.message);
    }
  } else {
    console.error("❌ Failed to publish test event.");
  }

  // Test 2: Settings Save & Load
  console.log("\n=== 2. Testing Settings Store Persistence ===");
  const settingsKey = "audit_session";
  const settingsVal = {
    auditor: "InnoVibe Chief Architect",
    timestamp: new Date().toISOString(),
    status: "APPROVED_PHASE1"
  };

  console.log(`Saving setting key: '${settingsKey}'...`);
  const { error: saveError } = await supabase
    .from("settings_store")
    .upsert({
      key: settingsKey,
      value: settingsVal,
      updated_at: new Date().toISOString()
    });

  if (!saveError) {
    console.log("✅ Settings saved successfully.");
    
    // Read back
    const { data: loaded, error: loadError } = await supabase
      .from("settings_store")
      .select("*")
      .eq("key", settingsKey)
      .single();

    if (loaded) {
      console.log("✅ Settings read back from DB:", JSON.stringify(loaded.value, null, 2));
    } else {
      console.error("❌ Failed to load saved settings:", loadError?.message);
    }
  } else {
    console.error("❌ Failed to save settings:", saveError.message);
  }

  // Test 3: Cache Sync Layer Execution
  console.log("\n=== 3. Testing Core Sync Layer (Laravel -> Supabase) ===");
  console.log("Running Core Sync engine (fetches service centers, customers, vehicles, bookings)...");
  
  const syncReport = await runMasterSync();
  console.log("✅ Core Sync Completed.");
  console.log("Sync Report Summary:");
  console.log(`- Garages:  Fetched ${syncReport.garages.fetched}, Upserted ${syncReport.garages.upserted}, Failed ${syncReport.garages.failed}`);
  console.log(`- Customers: Fetched ${syncReport.customers.fetched}, Upserted ${syncReport.customers.upserted}, Failed ${syncReport.customers.failed}`);
  console.log(`- Vehicles:  Fetched ${syncReport.vehicles.fetched}, Upserted ${syncReport.vehicles.upserted}, Failed ${syncReport.vehicles.failed}`);
  console.log(`- Bookings:  Fetched ${syncReport.bookings.fetched}, Upserted ${syncReport.bookings.upserted}, Failed ${syncReport.bookings.failed}`);
  console.log(`Total Errors reported during sync: ${syncReport.errors.length}`);
  if (syncReport.errors.length > 0) {
    console.log("Errors detail:", syncReport.errors);
  }

  console.log("\n🏁 Integration Tests Completed.");
}

runTests().catch(console.error);
