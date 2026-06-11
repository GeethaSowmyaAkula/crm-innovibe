import { getVehicles } from "@/lib/laravel/api";
import { VehiclesTable } from "@/components/tables/vehicles-table";
export const dynamic = "force-dynamic";
export default async function VehiclesPage() {
  const vehicles = await getVehicles().catch(() => []);
  return <VehiclesTable vehicles={vehicles as unknown as Record<string, unknown>[]} />;
}
