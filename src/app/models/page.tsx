import { getVehicleModels } from "@/lib/laravel/api";
import { ModelsTable } from "@/components/tables/models-table";
export const dynamic = "force-dynamic";
export default async function ModelsPage() {
  const models = await getVehicleModels().catch(() => []);
  return <ModelsTable models={models as unknown as Record<string, unknown>[]} />;
}
