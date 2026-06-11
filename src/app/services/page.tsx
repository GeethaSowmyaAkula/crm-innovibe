import { getServices, getServiceItems, LaravelService, LaravelServiceItem } from "@/lib/laravel/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Wrench, IndianRupee } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const [services, serviceItems] = await Promise.all([
    getServices().catch(() => [] as LaravelService[]),
    getServiceItems().catch(() => [] as LaravelServiceItem[]),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Services</h1>
        <p className="text-slate-500">{services.length} service types · {serviceItems.length} service items</p>
      </div>

      {/* Service Types */}
      <Card>
        <CardHeader>
          <CardTitle className="text-slate-900 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-blue-500" /> Service Types
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Booking Price</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((s, i) => (
                <TableRow key={s.id}>
                  <TableCell className="text-slate-400">{i + 1}</TableCell>
                  <TableCell className="font-medium text-slate-900">{s.title}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-slate-700">
                      <IndianRupee className="h-3.5 w-3.5" />{s.price}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-500">₹{s.booking_price}</TableCell>
                  <TableCell className="text-slate-500 max-w-[200px] truncate">{s.description ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                      {s.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Service Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-slate-900">Service Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>GST %</TableHead>
                <TableHead>HSN Code</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceItems.length > 0 ? serviceItems.map((item, i) => (
                <TableRow key={item.id}>
                  <TableCell className="text-slate-400">{i + 1}</TableCell>
                  <TableCell className="font-medium text-slate-900">{item.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <IndianRupee className="h-3.5 w-3.5 text-slate-400" />
                      {parseFloat(item.price).toLocaleString("en-IN")}
                    </div>
                  </TableCell>
                  <TableCell>{item.gst}%</TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">{item.hsn_code ?? "—"}</TableCell>
                  <TableCell>{item.brand?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={item.status === "active"
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-slate-200 text-slate-500"}>
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-400">No service items found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
