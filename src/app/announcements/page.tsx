import { getAnnouncements, LaravelAnnouncement } from "@/lib/laravel/api";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  sent: "border-green-200 bg-green-50 text-green-700",
  pending: "border-yellow-200 bg-yellow-50 text-yellow-700",
  scheduled: "border-blue-200 bg-blue-50 text-blue-700",
  failed: "border-red-200 bg-red-50 text-red-700",
};

export default async function AnnouncementsPage() {
  const announcements: LaravelAnnouncement[] = await getAnnouncements().catch(() => []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Announcements</h1>
        <p className="text-slate-500">{announcements.length} announcements from live system.</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Title / Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.length > 0 ? announcements.map((a, i) => (
                <TableRow key={a.id}>
                  <TableCell className="text-slate-400">{i + 1}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700 capitalize">{a.type}</Badge>
                  </TableCell>
                  <TableCell className="capitalize">{a.to}</TableCell>
                  <TableCell>
                    {a.title && <p className="font-medium text-slate-900 text-sm">{a.title}</p>}
                    <p className="text-slate-500 text-sm truncate max-w-[300px]">{a.description}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusStyles[a.status] ?? ""}>{a.status}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {a.send_at ? new Date(a.send_at * 1000).toLocaleString("en-IN") : "—"}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">No announcements found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
