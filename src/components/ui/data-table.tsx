"use client";

import { useState, useMemo, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, SlidersHorizontal, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from "lucide-react";

export interface Column {
  key: string;
  header: string;
  visible?: boolean;
  render: (row: any, index: number) => ReactNode;
}

interface DataTableProps {
  title: string;
  subtitle?: string;
  rows: Record<string, unknown>[];
  columns: Column[];
  exportFilename?: string;
}

export function DataTable({ title, subtitle, rows, columns, exportFilename = "export" }: DataTableProps) {
  const initialVisible = new Set(columns.filter(c => c.visible !== false).map(c => c.key));
  const [visibleCols, setVisibleCols] = useState<Set<string>>(initialVisible);
  const [colSearch, setColSearch] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(row => Object.values(row).some(v => String(v ?? "").toLowerCase().includes(q)));
  }, [rows, search]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = String(a[sortKey] ?? "").toLowerCase();
      const bv = String(b[sortKey] ?? "").toLowerCase();
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);
  const visibleColumns = columns.filter(c => visibleCols.has(c.key));
  const filteredColList = columns.filter(c =>
    c.key.toLowerCase().includes(colSearch.toLowerCase()) ||
    c.header.toLowerCase().includes(colSearch.toLowerCase())
  );

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  function toggleRow(gi: number) {
    setSelected(prev => { const n = new Set(prev); n.has(gi) ? n.delete(gi) : n.add(gi); return n; });
  }

  function toggleAll() {
    if (selected.size === pageRows.length) setSelected(new Set());
    else setSelected(new Set(pageRows.map((_, i) => (safePage - 1) * rowsPerPage + i)));
  }

  function exportCSV() {
    const hdr = visibleColumns.map(c => c.header).join(",");
    const body = sorted.map(row =>
      visibleColumns.map(c => `"${String(row[c.key] ?? "").replace(/"/g, '""')}"`).join(",")
    );
    const blob = new Blob([[hdr, ...body].join("\n")], { type: "text/csv" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `${exportFilename}.csv` });
    a.click(); URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input placeholder="Search..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 w-60 h-9" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5 h-9">
            <Download className="h-4 w-4" /> Export
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1.5 h-9 px-3 text-sm font-medium border border-slate-200 rounded-md bg-white hover:bg-slate-50 transition-colors">
              <SlidersHorizontal className="h-4 w-4" /> Column
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="p-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-slate-400" />
                  <Input placeholder="Search columns..." value={colSearch}
                    onChange={e => setColSearch(e.target.value)} className="pl-7 h-8 text-sm" />
                </div>
              </div>
              {filteredColList.map(col => (
                <DropdownMenuCheckboxItem key={col.key}
                  checked={visibleCols.has(col.key)}
                  onCheckedChange={checked => {
                    setVisibleCols(prev => { const n = new Set(prev); checked ? n.add(col.key) : n.delete(col.key); return n; });
                  }}>
                  {col.header}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-10">
                <input type="checkbox" className="rounded border-slate-300"
                  checked={selected.size === pageRows.length && pageRows.length > 0}
                  onChange={toggleAll} />
              </TableHead>
              <TableHead className="w-14 text-slate-500">S.No</TableHead>
              {visibleColumns.map(col => (
                <TableHead key={col.key} onClick={() => toggleSort(col.key)}
                  className="cursor-pointer select-none hover:bg-slate-100">
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    <span className="text-slate-300 text-xs">
                      {sortKey === col.key ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                    </span>
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length > 0 ? pageRows.map((row, idx) => {
              const gi = (safePage - 1) * rowsPerPage + idx;
              return (
                <TableRow key={gi} className={selected.has(gi) ? "bg-blue-50" : ""}>
                  <TableCell>
                    <input type="checkbox" className="rounded border-slate-300"
                      checked={selected.has(gi)} onChange={() => toggleRow(gi)} />
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm">{gi + 1}</TableCell>
                  {visibleColumns.map(col => (
                    <TableCell key={col.key}>{col.render(row, gi)}</TableCell>
                  ))}
                </TableRow>
              );
            }) : (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + 2} className="text-center py-16 text-slate-400">
                  No records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap gap-3 items-center justify-between text-sm text-slate-500">
        <span>{selected.size} of {sorted.length} row(s) selected.</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap">Rows per page</span>
            <Select value={String(rowsPerPage)} onValueChange={v => { setRowsPerPage(Number(v)); setPage(1); }}>
              <SelectTrigger className="h-8 w-16 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <span className="whitespace-nowrap">Page {safePage} of {totalPages}</span>
          <div className="flex items-center gap-1">
            {[
              { icon: ChevronsLeft, action: () => setPage(1), disabled: safePage === 1 },
              { icon: ChevronLeft, action: () => setPage(p => Math.max(1, p - 1)), disabled: safePage === 1 },
              { icon: ChevronRight, action: () => setPage(p => Math.min(totalPages, p + 1)), disabled: safePage === totalPages },
              { icon: ChevronsRight, action: () => setPage(totalPages), disabled: safePage === totalPages },
            ].map(({ icon: Icon, action, disabled }, i) => (
              <Button key={i} variant="outline" size="icon" className="h-8 w-8" onClick={action} disabled={disabled}>
                <Icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
