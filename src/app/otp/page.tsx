import { getOtps, LaravelOtp } from "@/lib/laravel/api";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function OtpPage() {
  const otps: LaravelOtp[] = await getOtps().catch(() => []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">OTP Logs</h1>
        <p className="text-slate-500">{otps.length} OTP records from live system.</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Receiver</TableHead>
                <TableHead>OTP</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Used At</TableHead>
                <TableHead>Expired At</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {otps.length > 0 ? otps.map((o, i) => (
                <TableRow key={o.id}>
                  <TableCell className="text-slate-400">{i + 1}</TableCell>
                  <TableCell className="font-mono text-slate-700">+{o.receiver}</TableCell>
                  <TableCell className="font-mono font-bold text-slate-900">{o.otp}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">{o.event}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {o.used_at ? new Date(o.used_at).toLocaleString("en-IN") : "—"}
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {new Date(o.expired_at).toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={o.used_at
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-red-200 bg-red-50 text-red-700"}>
                      {o.used_at ? "Used" : "Unused"}
                    </Badge>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-400">No OTP records found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
