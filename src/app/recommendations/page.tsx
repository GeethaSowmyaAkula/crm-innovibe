import { getRecommendations, LaravelRecommendation } from "@/lib/laravel/api";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function RecommendationsPage() {
  const recommendations: LaravelRecommendation[] = await getRecommendations().catch(() => []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Recommendations</h1>
        <p className="text-slate-500">{recommendations.length} EV recommendations from live system.</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Benefit</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recommendations.length > 0 ? recommendations.map((r, i) => (
                <TableRow key={r.id}>
                  <TableCell className="text-slate-400">{i + 1}</TableCell>
                  <TableCell className="font-medium text-slate-900">{r.title}</TableCell>
                  <TableCell className="text-slate-500 max-w-[300px]">{r.description}</TableCell>
                  <TableCell>
                    {r.benefit ? (
                      <span className="text-green-600 font-medium text-sm">{r.benefit}</span>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={r.status === "active"
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-slate-200 text-slate-500"}>
                      {r.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400">No recommendations found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
