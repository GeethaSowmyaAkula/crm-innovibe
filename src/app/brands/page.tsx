import { getBrands } from "@/lib/laravel/api";
import { BrandsTable } from "@/components/tables/brands-table";
export const dynamic = "force-dynamic";
export default async function BrandsPage() {
  const brands = await getBrands().catch(() => []);
  return <BrandsTable brands={brands as unknown as Record<string, unknown>[]} />;
}
