'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Search,
  Plus,
  Upload,
  Download,
  RefreshCw,
  LayoutGrid,
  Table2,
  Building2,
  Mail,
  Phone,
  Star,
  X,
  Pencil,
  Trash2,
  Sparkles,
  Loader2,
} from 'lucide-react';
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

const STATUS_CLASS: Record<SupplierHubStatus, string> = {
  active: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  inactive: 'bg-slate-100 text-slate-600 border-slate-200',
  preferred: 'bg-amber-50 text-amber-900 border-amber-200',
  blacklisted: 'bg-red-50 text-red-800 border-red-200',
};

export function SupplierIntelligenceHub() {
  const { toast } = useToast();
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
    const t = setTimeout(() => setDebouncedQ(q), 320);
    return () => clearTimeout(t);
  }, [q]);

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

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-1.5">
      {/* Compact toolbar — single short block so the grid gets vertical space */}
      <div className="shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1.5 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5 gap-y-1">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600">
            <Sparkles className="h-3 w-3 shrink-0 text-blue-500" />
            <span className="hidden sm:inline">Hub</span>
          </div>
          <div className="relative min-w-[120px] flex-1 basis-[min(100%,220px)]">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search company, contact, trade, phone, email…"
              className="h-8 border-slate-200 pl-7 text-sm"
            />
          </div>
          <Button size="sm" className="h-7 px-2 text-[11px]" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-0.5 h-3 w-3" /> Add
          </Button>
          <label className="inline-flex">
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => onImportFile(e.target.files?.[0] ?? null)} />
            <Button size="sm" variant="outline" className="h-7 cursor-pointer px-2 text-[11px]" asChild>
              <span>
                <Upload className="mr-0.5 h-3 w-3" /> Import
              </span>
            </Button>
          </label>
          <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" onClick={handleExport}>
            <Download className="mr-0.5 h-3 w-3" /> Export
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={() => load()} disabled={loading}>
            <RefreshCw className={`mr-0.5 h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <div className="ml-auto flex shrink-0 overflow-hidden rounded border border-slate-200">
            <button
              type="button"
              title="Table"
              className={`px-1.5 py-0.5 ${view === 'table' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}
              onClick={() => setView('table')}
            >
              <Table2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Cards"
              className={`px-1.5 py-0.5 ${view === 'cards' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}
              onClick={() => setView('cards')}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-1.5 text-[11px]">
          <Input
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-7 w-24"
          />
          <Input placeholder="Trade" value={trade} onChange={(e) => setTrade(e.target.value)} className="h-7 w-24" />
          <select
            className="h-7 rounded-md border border-input bg-background px-1.5 text-[11px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SupplierHubStatus | '')}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="preferred">Preferred</option>
            <option value="blacklisted">Blacklisted</option>
          </select>
          <span className="text-slate-400">{total} suppliers</span>
        </div>
      </div>

      {activeImportJob &&
        !activeImportJob.bannerDismissed &&
        (activeImportJob.status === 'pending' || activeImportJob.status === 'processing') && (
          <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900 shrink-0">
            <Loader2 className="h-4 w-4 animate-spin shrink-0 text-blue-600" />
            <span>
              Importing suppliers… <span className="text-blue-800/80">({activeImportJob.status})</span>
            </span>
            <button
              type="button"
              className="ml-auto text-blue-800 hover:underline"
              onClick={() =>
                setActiveImportJob((prev) => (prev ? { ...prev, bannerDismissed: true } : null))
              }
            >
              Dismiss
            </button>
          </div>
        )}

      {/* Content — flex-1 so the table fills space below the compact toolbar */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
        {loading ? (
          <div className="space-y-2 p-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : view === 'table' ? (
          <div className="min-h-0 flex-1 overflow-auto">
            <table
              className="text-xs table-fixed border-collapse"
              style={{ width: colWidths.reduce((a, b) => a + b, 0) }}
            >
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                <tr className="text-left text-slate-500">
                  <th
                    className="relative px-2 py-2 font-medium text-slate-700 select-none"
                    style={{ width: colWidths[0] }}
                  >
                    <span className="block truncate pr-2">Company</span>
                    <span
                      role="separator"
                      aria-label="Resize company column"
                      className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-blue-400/50"
                      onMouseDown={(e) => startResize(0, e)}
                    />
                  </th>
                  <th
                    className="relative px-2 py-2 font-medium text-slate-700 hidden sm:table-cell select-none"
                    style={{ width: colWidths[1] }}
                  >
                    <span className="block truncate pr-2">Category</span>
                    <span
                      role="separator"
                      aria-label="Resize category column"
                      className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-blue-400/50"
                      onMouseDown={(e) => startResize(1, e)}
                    />
                  </th>
                  <th
                    className="relative px-2 py-2 font-medium text-slate-700 hidden md:table-cell select-none"
                    style={{ width: colWidths[2] }}
                  >
                    <span className="block truncate pr-2">Trade</span>
                    <span
                      role="separator"
                      aria-label="Resize trade column"
                      className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-blue-400/50"
                      onMouseDown={(e) => startResize(2, e)}
                    />
                  </th>
                  <th
                    className="relative px-2 py-2 font-medium text-slate-700 select-none"
                    style={{ width: colWidths[3] }}
                  >
                    <span className="block truncate pr-2">Contact</span>
                    <span
                      role="separator"
                      aria-label="Resize contact column"
                      className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-blue-400/50"
                      onMouseDown={(e) => startResize(3, e)}
                    />
                  </th>
                  <th
                    className="relative px-2 py-2 font-medium text-slate-700 hidden lg:table-cell select-none"
                    style={{ width: colWidths[4] }}
                  >
                    <span className="block truncate pr-2">Phone</span>
                    <span
                      role="separator"
                      aria-label="Resize phone column"
                      className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-blue-400/50"
                      onMouseDown={(e) => startResize(4, e)}
                    />
                  </th>
                  <th
                    className="relative px-2 py-2 font-medium text-slate-700 hidden lg:table-cell select-none"
                    style={{ width: colWidths[5] }}
                  >
                    <span className="block truncate pr-2">Email</span>
                    <span
                      role="separator"
                      aria-label="Resize email column"
                      className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-blue-400/50"
                      onMouseDown={(e) => startResize(5, e)}
                    />
                  </th>
                  <th
                    className="relative px-2 py-2 font-medium text-slate-700 select-none"
                    style={{ width: colWidths[6] }}
                  >
                    <span className="block truncate pr-2">Status</span>
                    <span
                      role="separator"
                      aria-label="Resize status column"
                      className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-blue-400/50"
                      onMouseDown={(e) => startResize(6, e)}
                    />
                  </th>
                  <th className="px-2 py-2 font-medium text-slate-700 text-right" style={{ width: colWidths[7] }}>
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
                      <td className="px-2 py-2 font-medium text-slate-900 truncate" style={{ maxWidth: colWidths[0] }}>
                        {s.companyName}
                      </td>
                      <td className="px-2 py-2 text-slate-600 hidden sm:table-cell truncate">{s.category ?? '—'}</td>
                      <td className="px-2 py-2 text-slate-600 hidden md:table-cell truncate">{s.trade ?? '—'}</td>
                      <td className="px-2 py-2 truncate">{p?.contactName ?? '—'}</td>
                      <td className="px-2 py-2 hidden lg:table-cell truncate">{p?.phone ?? '—'}</td>
                      <td className="px-2 py-2 hidden lg:table-cell truncate">{p?.email ?? '—'}</td>
                      <td className="px-2 py-2">
                        <span className={`inline-flex px-1.5 py-0.5 rounded border text-[10px] ${STATUS_CLASS[s.status]}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right">
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
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-auto p-3 sm:grid-cols-2">
            {rows.map((s) => {
              const p = primary(s);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => openDrawer(s.id)}
                  className="text-left rounded-xl border border-slate-200 p-3 hover:border-blue-300 hover:shadow-md transition-all bg-white"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{s.companyName}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{s.category ?? 'Uncategorized'}</div>
                    </div>
                    <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded border ${STATUS_CLASS[s.status]}`}>{s.status}</span>
                  </div>
                  {s.trade && <div className="text-[11px] text-blue-700 mt-2 line-clamp-2">{s.trade}</div>}
                  <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-slate-600">
                    {p?.phone && (
                      <span className="inline-flex items-center gap-0.5">
                        <Phone className="w-3 h-3" /> {p.phone}
                      </span>
                    )}
                    {p?.email && (
                      <span className="inline-flex items-center gap-0.5 truncate max-w-[180px]">
                        <Mail className="w-3 h-3 shrink-0" /> {p.email}
                      </span>
                    )}
                  </div>
                  {s.remark && <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">{s.remark}</p>}
                  {typeof s.completenessScore === 'number' && (
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
          <div className="py-16 text-center text-slate-400 text-sm">
            <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
            No suppliers yet. Import your Excel or add manually.
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex shrink-0 justify-between items-center text-xs text-slate-500">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Prev
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
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
          <div className="grid grid-cols-2 gap-1">
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
