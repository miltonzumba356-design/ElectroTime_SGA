import { useState, useMemo, type ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Download,
} from 'lucide-react';
import { cn, filterData } from '../lib/utils';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  width?: string;
  cell?: (row: T) => ReactNode;
}

interface DataTableProps<T extends Record<string, any>> {
  data: T[];
  columns: Column<T>[];
  searchFields?: (keyof T)[];
  loading?: boolean;
  perPage?: number;
  toolbar?: ReactNode;
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchFields,
  loading = false,
  perPage: defaultPerPage = 10,
  toolbar,
  onRowClick,
  rowActions,
  emptyTitle,
  emptyDescription,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(defaultPerPage);

  const filtered = useMemo(() => {
    if (!search || !searchFields?.length) return data;
    return filterData(data, search, searchFields as (keyof T)[]);
  }, [data, search, searchFields]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp = String(av).localeCompare(String(bv), 'pt-AO', { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice((safePage - 1) * perPage, safePage * perPage);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const SortIcon = ({ col }: { col: Column<T> }) => {
    if (!col.sortable) return null;
    const k = String(col.key);
    if (sortKey !== k) return <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
    return sortDir === 'asc'
      ? <ChevronUp className="h-3.5 w-3.5 text-primary" />
      : <ChevronDown className="h-3.5 w-3.5 text-primary" />;
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {searchFields && searchFields.length > 0 && (
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar..."
              className="h-9 w-full rounded-lg border border-border bg-input-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          {toolbar}
          <button
            onClick={() => {}}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {columns.map(col => (
                  <th
                    key={String(col.key)}
                    className={cn(
                      'px-4 py-3 text-left text-xs font-medium text-muted-foreground',
                      col.sortable && 'cursor-pointer select-none hover:text-foreground',
                      col.width
                    )}
                    onClick={() => col.sortable && handleSort(String(col.key))}
                  >
                    <div className="flex items-center gap-1.5">
                      {col.header}
                      <SortIcon col={col} />
                    </div>
                  </th>
                ))}
                {rowActions && <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">AÃ§Ãµes</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border animate-pulse">
                    {columns.map((col, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-3 rounded bg-muted" />
                      </td>
                    ))}
                    {rowActions && <td className="px-4 py-3.5"><div className="h-3 w-16 ml-auto rounded bg-muted" /></td>}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (rowActions ? 1 : 0)}>
                    <EmptyState
                      variant={search ? 'search' : 'default'}
                      title={search ? 'Nenhum resultado' : emptyTitle}
                      description={search ? `Nenhum registro encontrado para "${search}"` : emptyDescription}
                    />
                  </td>
                </tr>
              ) : (
                paginated.map((row, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.1, delay: i * 0.02 }}
                    className={cn(
                      'border-b border-border last:border-0 transition-colors',
                      onRowClick ? 'cursor-pointer hover:bg-muted/50' : 'hover:bg-muted/20'
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map(col => (
                      <td key={String(col.key)} className="px-4 py-3.5 text-sm text-foreground">
                        {col.cell ? col.cell(row) : String(row[col.key as string] ?? 'â€”')}
                      </td>
                    ))}
                    {rowActions && (
                      <td className="px-4 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                        {rowActions(row)}
                      </td>
                    )}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && sorted.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Exibindo</span>
              <select
                value={perPage}
                onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
                className="rounded-md border border-border bg-input-background px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                {[10, 25, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <span>de <strong className="text-foreground">{sorted.length}</strong> registros</span>
            </div>
            <div className="flex items-center gap-1">
              <PaginationBtn icon={ChevronsLeft} onClick={() => setPage(1)} disabled={safePage === 1} />
              <PaginationBtn icon={ChevronLeft} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} />
              <span className="px-3 text-sm text-foreground">
                {safePage} / {totalPages}
              </span>
              <PaginationBtn icon={ChevronRight} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} />
              <PaginationBtn icon={ChevronsRight} onClick={() => setPage(totalPages)} disabled={safePage === totalPages} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PaginationBtn({
  icon: Icon,
  onClick,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
