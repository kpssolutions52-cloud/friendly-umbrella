'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Search,
  Plus,
  Upload,
  Download,
  RefreshCw,
  SlidersHorizontal,
  LayoutGrid,
  Table2,
  Building2,
  Mail,
  Phone,
  Printer,
  Star,
  X,
  Pencil,
  Trash2,
  Sparkles,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { MOBILE_QS_TAB_NAV_RESERVE } from '@/lib/mobileQsShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  listSupplierHub,
  getSupplierHub,
  createSupplierHub,
  updateSupplierHub,
  archiveSupplierHub,
  previewImportSupplierHub,
  confirmImportSupplierHub,
  getSupplierImportJob,
  exportSupplierHubBlob,
  upsertContactHub,
  deleteContactHub,
  type SupplierHubEntry,
  type SupplierHubContact,
  type SupplierHubStatus,
} from '@/lib/supplierHubApi';
import { useSupplierHubColumnWidths } from '@/components/supplier-hub/useSupplierHubColumnWidths';
import { cn } from '@/lib/utils';

const STATUS_CLASS: Record<SupplierHubStatus, string> = {
  active: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  inactive: 'bg-slate-100 text-slate-600 border-slate-200',
  preferred: 'bg-amber-50 text-amber-900 border-amber-200',
  blacklisted: 'bg-red-50 text-red-800 border-red-200',
};

function ColumnResizeHandle({
  ariaLabel,
  onResizeStart,
}: {
  ariaLabel: string;
  onResizeStart: (e: React.MouseEvent) => void;
}) {
  return (
    <span
      role="separator"
      aria-label={ariaLabel}
      className="absolute right-0 top-0 z-30 h-full w-4 -translate-x-1/2 cursor-col-resize select-none touch-none hover:bg-blue-500/25 active:bg-blue-500/40"
      onMouseDown={onResizeStart}
      onClick={(e) => e.stopPropagation()}
    />
  );
}

function RemarkCell({
  entry,
  onSaved,
  toast,
}: {
  entry: SupplierHubEntry;
  onSaved: () => void;
  toast: ReturnType<typeof useToast>['toast'];
}) {
  const [v, setV] = useState(entry.remark ?? '');
  useEffect(() => {
    setV(entry.remark ?? '');
  }, [entry.id, entry.remark]);

  const save = async () => {
    const next = v.trim() || null;
    const prev = entry.remark ?? null;
    if (next === prev) return;
    try {
      await updateSupplierHub(entry.id, { remark: next });
      onSaved();
    } catch (e: any) {
      toast({ title: 'Could not save remarks', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <textarea
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={save}
      rows={2}
      placeholder="—"
      className="w-full min-h-[2.25rem] max-h-28 resize-y rounded border border-transparent bg-slate-50/80 px-1.5 py-1 text-[11px] leading-snug text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:outline-none"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    />
  );
}

type SupplierIntelligenceHubProps = {
  /** When true, leave room for the app-level mobile tab bar (chat page) above this panel’s controls. */
  reserveAppBottomNav?: boolean;
};

export function SupplierIntelligenceHub({ reserveAppBottomNav = false }: SupplierIntelligenceHubProps) {
  const { toast } = useToast();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [category, setCategory] = useState('');
  const [trade, setTrade] = useState('');
  const [statusFilter, setStatusFilter] = useState<SupplierHubStatus | ''>('');
  const [view, setView] = useState<'table' | 'cards'>('table');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SupplierHubEntry[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<SupplierHubEntry | null>(null);
  const [drawerTab, setDrawerTab] = useState<'basic' | 'contacts' | 'activity'>('basic');
  const [saving, setSaving] = useState(false);

  const [importOpen, setImportOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<any[] | null>(null);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  /** Background Excel import (poll until completed / failed) */
  const [activeImportJob, setActiveImportJob] = useState<{
    id: string;
    status: string;
    bannerDismissed: boolean;
  } | null>(null);

  const { widths: colWidths, startResize } = useSupplierHubColumnWidths();

  const [createOpen, setCreateOpen] = useState(false);
  const [newCo, setNewCo] = useState({ companyName: '', category: '', trade: '', email: '', phone: '' });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(max-width: 639px)');
    const sync = () => setIsMobile(mql.matches);
    sync();
    mql.addEventListener('change', sync);
    return () => mql.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (isMobile) setView('cards');
  }, [isMobile]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 320);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    // Mobile-first default: cards are easier to scan and tap than a dense table.
    if (window.innerWidth < 768) {
      setView('cards');
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listSupplierHub({
        q: debouncedQ || undefined,
        category: category || undefined,
        trade: trade || undefined,
        status: statusFilter || undefined,
        page,
        limit: 20,
        sort: 'updatedAt',
        order: 'desc',
      });
      setRows(res.suppliers);
      setTotalPages(res.pagination.totalPages);
      setTotal(res.pagination.total);
    } catch (e: any) {
      toast({ title: 'Failed to load suppliers', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, category, trade, statusFilter, page, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const jobId = activeImportJob?.id;
    if (!jobId) return;
    let cancelled = false;

    const tick = async () => {
      try {
        const j = await getSupplierImportJob(jobId);
        if (cancelled) return;
        setActiveImportJob((prev) =>
          prev && prev.id === jobId ? { ...prev, status: j.status } : prev
        );
        if (j.status === 'completed') {
          const errs = Array.isArray(j.resultErrors) ? j.resultErrors : [];
          toast({
            title: 'Import finished',
            description: `Created ${j.resultCreated ?? 0}, skipped ${j.resultSkipped ?? 0}.${errs.length ? ` ${errs.slice(0, 3).join('; ')}` : ''}`,
          });
          setActiveImportJob(null);
          load();
        } else if (j.status === 'failed') {
          toast({
            title: 'Import failed',
            description: j.errorMessage || 'Unknown error',
            variant: 'destructive',
          });
          setActiveImportJob(null);
        }
      } catch (e: any) {
        if (cancelled) return;
        toast({ title: 'Could not check import status', description: e.message, variant: 'destructive' });
        setActiveImportJob(null);
      }
    };

    const interval = setInterval(tick, 1500);
    tick();
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeImportJob?.id]);

  const openDrawer = async (id: string) => {
    try {
      const res = await getSupplierHub(id);
      setSelected(res.supplier);
      setDrawerTab('basic');
      setDrawerOpen(true);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const saveBasic = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await updateSupplierHub(selected.id, {
        category: selected.category,
        companyName: selected.companyName,
        address: selected.address,
        trade: selected.trade,
        remark: selected.remark,
        status: selected.status,
        isPreferred: selected.isPreferred,
        isFavorite: selected.isFavorite,
      });
      setSelected(res.supplier);
      toast({ title: 'Saved' });
      load();
    } catch (e: any) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportSupplierHubBlob({
        q: debouncedQ || undefined,
        category: category || undefined,
        trade: trade || undefined,
        status: statusFilter || undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'supplier-intelligence-export.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Export started' });
    } catch (e: any) {
      toast({ title: 'Export failed', description: e.message, variant: 'destructive' });
    }
  };

  const onImportFile = async (f: File | null) => {
    if (!f) return;
    setImporting(true);
    try {
      const res = await previewImportSupplierHub(f);
      setImportPreview(res.preview);
      setImportWarnings(res.warnings);
      setImportOpen(true);
    } catch (e: any) {
      toast({ title: 'Import preview failed', description: e.message, variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  const confirmImport = async (mode: 'create' | 'skip_duplicates') => {
    if (!importPreview) return;
    setImporting(true);
    try {
      const r = await confirmImportSupplierHub(importPreview, mode);
      setImportOpen(false);
      setImportPreview(null);
      setImportWarnings([]);
      setActiveImportJob({ id: r.jobId, status: r.status || 'pending', bannerDismissed: false });
      toast({
        title: 'Import queued',
        description: 'Processing in the background. We will notify you when it finishes.',
      });
    } catch (e: any) {
      toast({ title: 'Import failed', description: e.message, variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  const handleCreate = async () => {
    if (!newCo.companyName.trim()) return;
    try {
      await createSupplierHub({
        companyName: newCo.companyName.trim(),
        category: newCo.category || undefined,
        trade: newCo.trade || undefined,
        contacts: [{ email: newCo.email || undefined, phone: newCo.phone || undefined }],
      });
      toast({ title: 'Supplier created' });
      setCreateOpen(false);
      setNewCo({ companyName: '', category: '', trade: '', email: '', phone: '' });
      load();
    } catch (e: any) {
      toast({ title: 'Create failed', description: e.message, variant: 'destructive' });
    }
  };

  const primary = (s: SupplierHubEntry) => s.primaryContact ?? s.contacts?.[0];
  const activeFilterCount = Number(Boolean(category)) + Number(Boolean(trade)) + Number(Boolean(statusFilter));

  /** App shell tab row height (must match `MOBILE_QS_TAB_NAV_RESERVE` / chat page). */
  const appNavStack = reserveAppBottomNav ? MOBILE_QS_TAB_NAV_RESERVE : '0px';
  const mobileHubBar = '3rem';
  const scrollBottomPad =
    isMobile || reserveAppBottomNav
      ? `calc(env(safe-area-inset-bottom, 0px) + ${[isMobile ? mobileHubBar : '', reserveAppBottomNav ? appNavStack : ''].filter(Boolean).join(' + ') || '0px'})`
      : undefined;

  return (
    <div
      className="flex h-full min-h-0 flex-1 flex-col gap-1.5 sm:gap-4 sm:pb-0"
      style={scrollBottomPad ? { paddingBottom: scrollBottomPad } : undefined}
    >
      {/* Compact toolbar — single short block so the grid gets vertical space */}
      <div
        className="shrink-0 rounded-xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm sm:px-4 sm:py-2.5"
        title={isMobile ? `${total} suppliers` : undefined}
      >
        <div className="flex flex-nowrap items-center gap-1 overflow-x-auto sm:flex-wrap sm:gap-2 sm:overflow-visible">
          <div className="hidden sm:flex items-center gap-1 text-xs font-semibold text-slate-600">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-blue-500" />
            <span>Hub</span>
          </div>
          <div className="relative min-w-0 flex-1 sm:basis-[min(100%,280px)]">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 sm:left-2.5 sm:h-4 sm:w-4" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={isMobile ? 'Search…' : 'Search company, contact, trade, remarks, phone, fax, email…'}
              className="h-8 border-slate-200 pl-7 text-sm sm:pl-8"
              aria-label="Search suppliers"
            />
          </div>
          <Button size="sm" className="hidden h-8 px-2 text-xs sm:inline-flex sm:h-7 sm:px-2 sm:text-[11px]" onClick={() => setCreateOpen(true)} title="Add supplier">
            <Plus className="h-3.5 w-3.5 sm:mr-0.5 sm:h-3 sm:w-3" />
            <span className="hidden sm:inline">Add</span>
          </Button>
          <label className="hidden sm:inline-flex">
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => onImportFile(e.target.files?.[0] ?? null)} />
            <Button size="sm" variant="outline" className="h-8 cursor-pointer px-2 text-xs sm:h-7 sm:px-2 sm:text-[11px]" asChild>
              <span>
                <Upload className="h-3.5 w-3.5 sm:mr-0.5 sm:h-3 sm:w-3" />
                <span className="hidden sm:inline">Import</span>
              </span>
            </Button>
          </label>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 shrink-0 sm:h-7 sm:w-auto sm:px-2 sm:text-[11px]"
            onClick={handleExport}
            title="Export"
            aria-label="Export suppliers"
          >
            <Download className="h-3.5 w-3.5 sm:mr-0.5 sm:h-3 sm:w-3" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0 sm:h-7 sm:w-auto sm:px-2 sm:text-[11px]"
            onClick={() => load()}
            disabled={loading}
            title="Refresh"
            aria-label="Refresh list"
          >
            <RefreshCw className={`h-3.5 w-3.5 sm:mr-0.5 sm:h-3 sm:w-3 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <span className="ml-auto hidden text-[11px] text-slate-500 sm:inline">{total}</span>
          {!isMobile && <div className="flex shrink-0 overflow-hidden rounded-lg border border-slate-200">
            <button
              type="button"
              title="Table"
              className={`flex items-center gap-1 px-2 py-1.5 text-xs ${view === 'table' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}
              onClick={() => setView('table')}
            >
              <Table2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              type="button"
              title="Cards"
              className={`flex items-center gap-1 px-2 py-1.5 text-xs ${view === 'cards' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}
              onClick={() => setView('cards')}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Cards</span>
            </button>
          </div>}
        </div>
        <div className={`mt-1.5 sm:mt-2 ${isMobile ? (mobileFiltersOpen ? 'flex' : 'hidden') : 'flex'} flex-wrap items-center gap-1.5 border-t border-slate-100 pt-1.5 sm:gap-2 sm:pt-2 text-xs`}>
          <Input
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-8 min-w-0 flex-1 basis-[calc(50%-0.25rem)] sm:h-7 sm:w-24 sm:flex-none sm:basis-auto"
            aria-label="Filter by category"
          />
          <Input
            placeholder="Trade"
            value={trade}
            onChange={(e) => setTrade(e.target.value)}
            className="h-8 min-w-0 flex-1 basis-[calc(50%-0.25rem)] sm:h-7 sm:w-24 sm:flex-none sm:basis-auto"
            aria-label="Filter by trade"
          />
          <select
            className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-1.5 text-[11px] sm:h-7 sm:w-auto sm:flex-none sm:px-1.5 sm:text-[11px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SupplierHubStatus | '')}
            aria-label="Filter by status"
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="preferred">Preferred</option>
            <option value="blacklisted">Blacklisted</option>
          </select>
          {(category || trade || statusFilter) && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-auto h-8 w-8 shrink-0 text-slate-500 hover:text-blue-600"
              onClick={() => {
                setCategory('');
                setTrade('');
                setStatusFilter('');
              }}
              title="Clear filters"
              aria-label="Clear filters"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {activeImportJob &&
        !activeImportJob.bannerDismissed &&
        (activeImportJob.status === 'pending' || activeImportJob.status === 'processing') && (
          <div className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1.5 text-xs text-blue-900 shrink-0 sm:gap-2 sm:px-4 sm:py-2.5">
            <Loader2 className="h-4 w-4 animate-spin shrink-0 text-blue-600" aria-hidden />
            <span className="sr-only">
              Importing suppliers, status {activeImportJob.status}
            </span>
            <span className="hidden min-w-0 truncate sm:inline">
              Importing… <span className="text-blue-800/80">({activeImportJob.status})</span>
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-auto h-8 w-8 shrink-0 text-blue-800 hover:bg-blue-100/80"
              onClick={() =>
                setActiveImportJob((prev) => (prev ? { ...prev, bannerDismissed: true } : null))
              }
              aria-label="Dismiss import notice"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

      {/* Content — flex-1 so the table fills space below the compact toolbar */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
        {loading ? (
          <div className="space-y-2 p-2 sm:space-y-3 sm:p-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : !isMobile && view === 'table' ? (
          <div className="min-h-0 flex-1 overflow-auto">
            <table
              className="text-xs table-fixed border-collapse"
              style={{ minWidth: colWidths.reduce((a, b) => a + b, 0) }}
            >
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                <tr className="text-left text-slate-500">
                  <th
                    className="relative px-2 py-2 font-medium text-slate-700 select-none overflow-hidden"
                    style={{ width: colWidths[0], minWidth: colWidths[0] }}
                  >
                    <span className="block truncate pr-3">Company</span>
                    <ColumnResizeHandle ariaLabel="Resize company column" onResizeStart={(e) => startResize(0, e)} />
                  </th>
                  <th
                    className="relative px-2 py-2 font-medium text-slate-700 hidden sm:table-cell select-none overflow-hidden"
                    style={{ width: colWidths[1], minWidth: colWidths[1] }}
                  >
                    <span className="block truncate pr-3">Category</span>
                    <ColumnResizeHandle ariaLabel="Resize category column" onResizeStart={(e) => startResize(1, e)} />
                  </th>
                  <th
                    className="relative px-2 py-2 font-medium text-slate-700 hidden md:table-cell select-none overflow-hidden"
                    style={{ width: colWidths[2], minWidth: colWidths[2] }}
                  >
                    <span className="block truncate pr-3">Trade</span>
                    <ColumnResizeHandle ariaLabel="Resize trade column" onResizeStart={(e) => startResize(2, e)} />
                  </th>
                  <th
                    className="relative px-2 py-2 font-medium text-slate-700 select-none overflow-hidden"
                    style={{ width: colWidths[3], minWidth: colWidths[3] }}
                  >
                    <span className="block truncate pr-3">Contact</span>
                    <ColumnResizeHandle ariaLabel="Resize contact column" onResizeStart={(e) => startResize(3, e)} />
                  </th>
                  <th
                    className="relative px-2 py-2 font-medium text-slate-700 hidden lg:table-cell select-none overflow-hidden"
                    style={{ width: colWidths[4], minWidth: colWidths[4] }}
                  >
                    <span className="block truncate pr-3">Phone</span>
                    <ColumnResizeHandle ariaLabel="Resize phone column" onResizeStart={(e) => startResize(4, e)} />
                  </th>
                  <th
                    className="relative px-2 py-2 font-medium text-slate-700 hidden lg:table-cell select-none overflow-hidden"
                    style={{ width: colWidths[5], minWidth: colWidths[5] }}
                  >
                    <span className="block truncate pr-3">Fax</span>
                    <ColumnResizeHandle ariaLabel="Resize fax column" onResizeStart={(e) => startResize(5, e)} />
                  </th>
                  <th
                    className="relative px-2 py-2 font-medium text-slate-700 hidden lg:table-cell select-none overflow-hidden"
                    style={{ width: colWidths[6], minWidth: colWidths[6] }}
                  >
                    <span className="block truncate pr-3">Email</span>
                    <ColumnResizeHandle ariaLabel="Resize email column" onResizeStart={(e) => startResize(6, e)} />
                  </th>
                  <th
                    className="relative px-2 py-2 font-medium text-slate-700 select-none overflow-hidden"
                    style={{ width: colWidths[7], minWidth: colWidths[7] }}
                  >
                    <span className="block truncate pr-3">Remarks</span>
                    <ColumnResizeHandle ariaLabel="Resize remarks column" onResizeStart={(e) => startResize(7, e)} />
                  </th>
                  <th
                    className="relative px-2 py-2 font-medium text-slate-700 select-none overflow-hidden"
                    style={{ width: colWidths[8], minWidth: colWidths[8] }}
                  >
                    <span className="block truncate pr-3">Status</span>
                    <ColumnResizeHandle ariaLabel="Resize status column" onResizeStart={(e) => startResize(8, e)} />
                  </th>
                  <th
                    className="relative px-2 py-2 font-medium text-slate-700 text-right overflow-hidden"
                    style={{ width: colWidths[9], minWidth: colWidths[9] }}
                  >
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const p = primary(s);
                  return (
                    <tr
                      key={s.id}
                      className="border-b border-slate-100 hover:bg-blue-50/40 cursor-pointer"
                      onClick={() => openDrawer(s.id)}
                    >
                      <td
                        className="px-2 py-2 font-medium text-slate-900 align-top"
                        style={{ width: colWidths[0], minWidth: colWidths[0], maxWidth: colWidths[0] }}
                      >
                        <div className="truncate" title={s.companyName}>
                          {s.companyName}
                        </div>
                      </td>
                      <td
                        className="px-2 py-2 text-slate-600 hidden sm:table-cell align-top truncate"
                        style={{ width: colWidths[1], minWidth: colWidths[1], maxWidth: colWidths[1] }}
                      >
                        {s.category ?? '—'}
                      </td>
                      <td
                        className="px-2 py-2 text-slate-600 hidden md:table-cell align-top truncate"
                        style={{ width: colWidths[2], minWidth: colWidths[2], maxWidth: colWidths[2] }}
                      >
                        {s.trade ?? '—'}
                      </td>
                      <td
                        className="px-2 py-2 align-top truncate"
                        style={{ width: colWidths[3], minWidth: colWidths[3], maxWidth: colWidths[3] }}
                      >
                        {p?.contactName ?? '—'}
                      </td>
                      <td
                        className="px-2 py-2 hidden lg:table-cell align-top truncate"
                        style={{ width: colWidths[4], minWidth: colWidths[4], maxWidth: colWidths[4] }}
                      >
                        {p?.phone ?? '—'}
                      </td>
                      <td
                        className="px-2 py-2 hidden lg:table-cell align-top truncate"
                        style={{ width: colWidths[5], minWidth: colWidths[5], maxWidth: colWidths[5] }}
                      >
                        {p?.fax ?? '—'}
                      </td>
                      <td
                        className="px-2 py-2 hidden lg:table-cell align-top truncate"
                        style={{ width: colWidths[6], minWidth: colWidths[6], maxWidth: colWidths[6] }}
                      >
                        {p?.email ?? '—'}
                      </td>
                      <td
                        className="px-1 py-1 align-top"
                        style={{ width: colWidths[7], minWidth: colWidths[7], maxWidth: colWidths[7] }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <RemarkCell entry={s} onSaved={load} toast={toast} />
                      </td>
                      <td className="px-2 py-2 align-top" style={{ width: colWidths[8], minWidth: colWidths[8] }}>
                        <span className={`inline-flex px-1.5 py-0.5 rounded border text-[10px] ${STATUS_CLASS[s.status]}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right align-top" style={{ width: colWidths[9], minWidth: colWidths[9] }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDrawer(s.id);
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-auto p-2 sm:grid-cols-2 sm:gap-4 sm:p-4">
            {rows.map((s) => {
              const p = primary(s);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => openDrawer(s.id)}
                  className="text-left rounded-xl border border-slate-200 p-2.5 hover:border-blue-300 hover:shadow-md transition-all bg-white sm:p-3.5"
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 text-sm leading-tight line-clamp-2 sm:line-clamp-1">{s.companyName}</div>
                      {s.category && s.category !== 'Uncategorized' && (
                        <div className="text-xs text-slate-500 mt-1 line-clamp-1">{s.category}</div>
                      )}
                    </div>
                    <span className={`shrink-0 self-start text-[10px] px-2 py-0.5 rounded-full border ${STATUS_CLASS[s.status]}`}>{s.status}</span>
                  </div>
                  {s.trade && <div className="text-xs text-blue-700 mt-2 line-clamp-2 sm:line-clamp-1">{s.trade}</div>}
                  {isMobile ? (
                    (p?.phone || p?.fax || p?.email) && (
                      <div className="mt-3 grid w-full grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-2.5 text-xs leading-snug text-slate-600">
                        {p?.phone && (
                          <>
                            <Phone className="h-3.5 w-3.5 shrink-0 text-slate-500 self-start mt-0.5" aria-hidden />
                            <span className="min-w-0 break-words">{p.phone}</span>
                          </>
                        )}
                        {p?.fax && (
                          <>
                            <Printer className="h-3.5 w-3.5 shrink-0 text-slate-500 self-start mt-0.5" aria-hidden />
                            <span className="min-w-0 break-words">{p.fax}</span>
                          </>
                        )}
                        {p?.email && (
                          <>
                            <Mail className="h-3.5 w-3.5 shrink-0 text-slate-500 self-start mt-0.5" aria-hidden />
                            <span className="min-w-0 break-all">{p.email}</span>
                          </>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2 text-[11px] text-slate-600">
                      {p?.phone && (
                        <span className="inline-flex items-center gap-1 max-w-full">
                          <Phone className="w-3 h-3 shrink-0" /> <span className="line-clamp-1">{p.phone}</span>
                        </span>
                      )}
                      {p?.fax && (
                        <span className="inline-flex items-center gap-1 max-w-full">
                          <Printer className="w-3 h-3 shrink-0" /> <span className="line-clamp-1">{p.fax}</span>
                        </span>
                      )}
                      {p?.email && (
                        <span className="inline-flex items-center gap-1 min-w-0 max-w-full">
                          <Mail className="w-3 h-3 shrink-0" /> <span className="line-clamp-1">{p.email}</span>
                        </span>
                      )}
                    </div>
                  )}
                  {!isMobile && s.remark && <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">{s.remark}</p>}
                  {!isMobile && typeof s.completenessScore === 'number' && (
                    <div className="mt-2 h-1 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${s.completenessScore}%` }} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
        {!loading && rows.length === 0 && (
          <div className="py-10 text-center text-slate-400 sm:py-16">
            <Building2 className="w-9 h-9 mx-auto mb-2 opacity-30 sm:w-10 sm:h-10" aria-hidden />
            <p className="text-xs sm:text-sm">No suppliers yet.</p>
            <p className="sr-only">Import an Excel file or add a supplier manually.</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <nav
          className="flex shrink-0 items-center justify-center gap-0.5 py-0.5"
          aria-label={`Pagination, page ${page} of ${totalPages}`}
        >
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[2.5rem] px-0.5 text-center text-[10px] tabular-nums leading-none text-slate-500">
            {page}/{totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </nav>
      )}

      {isMobile && (
        <div
          className={`fixed inset-x-0 z-40 border-t border-slate-200 bg-white/95 px-2 py-1 backdrop-blur ${
            reserveAppBottomNav
              ? ''
              : 'bottom-0 supports-[padding:max(0px)]:pb-[max(0.25rem,env(safe-area-inset-bottom))]'
          }`}
          style={
            reserveAppBottomNav
              ? {
                  bottom: `calc(env(safe-area-inset-bottom, 0px) + ${MOBILE_QS_TAB_NAV_RESERVE})`,
                }
              : undefined
          }
        >
          <div className="mx-auto grid max-w-xl grid-cols-3 gap-1">
            <Button
              size="icon"
              variant="default"
              className="h-8 w-full max-w-[4.5rem] justify-self-center"
              onClick={() => setCreateOpen(true)}
              aria-label="Add supplier"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <label
              className={cn(
                'inline-flex h-8 w-full max-w-[4.5rem] cursor-pointer items-center justify-center justify-self-center rounded-md border border-input bg-background text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2'
              )}
            >
              <input type="file" accept=".xlsx,.xls" className="sr-only" onChange={(e) => onImportFile(e.target.files?.[0] ?? null)} />
              <Upload className="h-4 w-4 shrink-0" aria-hidden />
              <span className="sr-only">Import from Excel</span>
            </label>
            <Button
              size="icon"
              variant={mobileFiltersOpen ? 'default' : 'outline'}
              className="relative h-8 w-full max-w-[4.5rem] justify-self-center"
              onClick={() => setMobileFiltersOpen((v) => !v)}
              aria-label="Filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-blue-600 px-0.5 text-[8px] font-medium text-white">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Drawer */}
      {drawerOpen && selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="relative w-full max-w-lg bg-white shadow-2xl h-full overflow-y-auto flex flex-col animate-in slide-in-from-right duration-200">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between z-10">
              <div>
                <h2 className="font-semibold text-slate-900 text-sm">{selected.companyName}</h2>
                <p className="text-[11px] text-slate-500">Completeness {selected.completenessScore ?? '—'}%</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setDrawerOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex border-b border-slate-100 px-2">
              {(['basic', 'contacts', 'activity'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDrawerTab(t)}
                  className={`px-3 py-2 text-xs font-medium capitalize border-b-2 -mb-px ${
                    drawerTab === t ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="p-4 flex-1 space-y-3 text-xs">
              {drawerTab === 'basic' && (
                <>
                  <label className="block">
                    <span className="text-slate-500">Company</span>
                    <Input
                      value={selected.companyName}
                      onChange={(e) => setSelected({ ...selected, companyName: e.target.value })}
                      className="mt-0.5 h-9"
                    />
                  </label>
                  <label className="block">
                    <span className="text-slate-500">Category</span>
                    <Input
                      value={selected.category ?? ''}
                      onChange={(e) => setSelected({ ...selected, category: e.target.value })}
                      className="mt-0.5 h-9"
                    />
                  </label>
                  <label className="block">
                    <span className="text-slate-500">Trade</span>
                    <Input
                      value={selected.trade ?? ''}
                      onChange={(e) => setSelected({ ...selected, trade: e.target.value })}
                      className="mt-0.5 h-9"
                    />
                  </label>
                  <label className="block">
                    <span className="text-slate-500">Address</span>
                    <textarea
                      value={selected.address ?? ''}
                      onChange={(e) => setSelected({ ...selected, address: e.target.value })}
                      className="mt-0.5 w-full min-h-[72px] rounded-md border border-input px-2 py-1.5"
                    />
                  </label>
                  <label className="block">
                    <span className="text-slate-500">Remark</span>
                    <textarea
                      value={selected.remark ?? ''}
                      onChange={(e) => setSelected({ ...selected, remark: e.target.value })}
                      className="mt-0.5 w-full min-h-[56px] rounded-md border border-input px-2 py-1.5"
                    />
                  </label>
                  <label className="block">
                    <span className="text-slate-500">Status</span>
                    <select
                      className="mt-0.5 w-full h-9 rounded-md border border-input px-2"
                      value={selected.status}
                      onChange={(e) => setSelected({ ...selected, status: e.target.value as SupplierHubStatus })}
                    >
                      <option value="active">active</option>
                      <option value="inactive">inactive</option>
                      <option value="preferred">preferred</option>
                      <option value="blacklisted">blacklisted</option>
                    </select>
                  </label>
                  <div className="flex gap-4">
                    <label className="inline-flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={selected.isPreferred}
                        onChange={(e) => setSelected({ ...selected, isPreferred: e.target.checked })}
                      />
                      Preferred
                    </label>
                    <label className="inline-flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={selected.isFavorite}
                        onChange={(e) => setSelected({ ...selected, isFavorite: e.target.checked })}
                      />
                      Favorite
                    </label>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" onClick={saveBasic} disabled={saving}>
                      Save changes
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                      onClick={async () => {
                        if (!confirm('Archive this supplier?')) return;
                        await archiveSupplierHub(selected.id);
                        toast({ title: 'Archived' });
                        setDrawerOpen(false);
                        load();
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Archive
                    </Button>
                  </div>
                </>
              )}
              {drawerTab === 'contacts' && (
                <ContactsEditor
                  supplier={selected}
                  onChange={(contacts) => setSelected({ ...selected, contacts })}
                  onReload={async () => {
                    const r = await getSupplierHub(selected.id);
                    setSelected(r.supplier);
                    load();
                  }}
                  toast={toast}
                />
              )}
              {drawerTab === 'activity' && (
                <div className="text-slate-500 space-y-2">
                  {(selected as any).activities?.length ? (
                    (selected as any).activities.map((a: any) => (
                      <div key={a.id} className="border-b border-slate-100 pb-2">
                        <div className="font-medium text-slate-700">{a.action}</div>
                        <div className="text-[11px]">{new Date(a.createdAt).toLocaleString()}</div>
                        {a.details && <div className="text-[11px] text-slate-400">{a.details}</div>}
                      </div>
                    ))
                  ) : (
                    <p>No activity logged yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCreateOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-4 space-y-3 text-xs">
            <h3 className="font-semibold text-sm">Add supplier</h3>
            <Input placeholder="Company name *" value={newCo.companyName} onChange={(e) => setNewCo({ ...newCo, companyName: e.target.value })} />
            <Input placeholder="Category" value={newCo.category} onChange={(e) => setNewCo({ ...newCo, category: e.target.value })} />
            <Input placeholder="Trade" value={newCo.trade} onChange={(e) => setNewCo({ ...newCo, trade: e.target.value })} />
            <Input placeholder="Primary email" value={newCo.email} onChange={(e) => setNewCo({ ...newCo, email: e.target.value })} />
            <Input placeholder="Primary phone" value={newCo.phone} onChange={(e) => setNewCo({ ...newCo, phone: e.target.value })} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreate}>
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Import modal */}
      {importOpen && importPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setImportOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col text-xs">
            <div className="p-3 border-b border-slate-200 font-semibold">Import preview ({importPreview.length} suppliers)</div>
            <div className="p-3 overflow-y-auto flex-1 space-y-2">
              {importWarnings.map((w, i) => (
                <div key={i} className="text-amber-700 bg-amber-50 rounded px-2 py-1">
                  {w}
                </div>
              ))}
              {importPreview.slice(0, 15).map((p: any, i: number) => (
                <div key={i} className="border border-slate-100 rounded p-2">
                  <div className="font-medium">{p.companyName}</div>
                  <div className="text-slate-500">{p.contacts?.length ?? 0} contacts</div>
                </div>
              ))}
              {importPreview.length > 15 && <p className="text-slate-400">…and {importPreview.length - 15} more</p>}
            </div>
            <div className="p-3 border-t border-slate-200 flex flex-wrap gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setImportOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="secondary" disabled={importing} onClick={() => confirmImport('skip_duplicates')}>
                Import (skip duplicates)
              </Button>
              <Button size="sm" disabled={importing} onClick={() => confirmImport('create')}>
                Import all as new
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ContactsEditor({
  supplier,
  onChange,
  onReload,
  toast,
}: {
  supplier: SupplierHubEntry;
  onChange: (c: SupplierHubContact[]) => void;
  onReload: () => Promise<void>;
  toast: ReturnType<typeof useToast>['toast'];
}) {
  const contacts = supplier.contacts ?? [];

  const add = () => {
    onChange([
      ...contacts,
      {
        id: `new-${Date.now()}`,
        supplierHubEntryId: supplier.id,
        contactName: '',
        phone: '',
        fax: '',
        email: '',
        whatsappNumber: '',
        designation: '',
        isPrimary: contacts.length === 0,
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as SupplierHubContact,
    ]);
  };

  return (
    <div className="space-y-3">
      {contacts.map((c, idx) => (
        <div key={c.id} className="border border-slate-200 rounded-lg p-2 space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="font-medium text-slate-700">Contact {idx + 1}</span>
            {c.isPrimary && (
              <span className="text-[10px] text-amber-700 flex items-center gap-0.5">
                <Star className="w-3 h-3" /> Primary
              </span>
            )}
          </div>
          <Input
            placeholder="Name"
            value={c.contactName ?? ''}
            onChange={(e) => {
              const next = [...contacts];
              next[idx] = { ...c, contactName: e.target.value };
              onChange(next);
            }}
          />
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            <Input
              placeholder="Phone"
              value={c.phone ?? ''}
              onChange={(e) => {
                const next = [...contacts];
                next[idx] = { ...c, phone: e.target.value };
                onChange(next);
              }}
            />
            <Input
              placeholder="Email"
              value={c.email ?? ''}
              onChange={(e) => {
                const next = [...contacts];
                next[idx] = { ...c, email: e.target.value };
                onChange(next);
              }}
            />
          </div>
          <Input
            placeholder="WhatsApp"
            value={c.whatsappNumber ?? ''}
            onChange={(e) => {
              const next = [...contacts];
              next[idx] = { ...c, whatsappNumber: e.target.value };
              onChange(next);
            }}
          />
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px]"
              onClick={async () => {
                try {
                  if (c.id.startsWith('new-')) {
                    const r = await upsertContactHub(supplier.id, {
                      contactName: c.contactName,
                      phone: c.phone,
                      email: c.email,
                      whatsappNumber: c.whatsappNumber,
                      fax: c.fax,
                      isPrimary: c.isPrimary,
                    });
                    const next = [...contacts];
                    next[idx] = r.contact;
                    onChange(next);
                  } else {
                    await upsertContactHub(supplier.id, { ...c, id: c.id });
                  }
                  toast({ title: 'Contact saved' });
                  await onReload();
                } catch (e: any) {
                  toast({ title: 'Failed', description: e.message, variant: 'destructive' });
                }
              }}
            >
              Save
            </Button>
            {!c.id.startsWith('new-') && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-[11px] text-red-600"
                onClick={async () => {
                  if (!confirm('Remove contact?')) return;
                  try {
                    await deleteContactHub(c.id);
                    onChange(contacts.filter((x) => x.id !== c.id));
                    toast({ title: 'Removed' });
                    await onReload();
                  } catch (e: any) {
                    toast({ title: 'Failed', description: e.message, variant: 'destructive' });
                  }
                }}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      ))}
      <Button size="sm" variant="outline" onClick={add}>
        <Plus className="w-3.5 h-3.5 mr-1" /> Add contact
      </Button>
    </div>
  );
}
