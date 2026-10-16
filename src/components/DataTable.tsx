import { type ReactNode, useRef, useState } from 'react';
import { Upload, Download, FileSpreadsheet, Trash2, Plus, Search, ArrowUpDown, Eye } from 'lucide-react';
import { Button, Input, ConfirmDialog, DataPreviewModal } from '@/components/ui';

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  searchFields: (keyof T)[];
  searchPlaceholders?: string[];
  extraFilters?: ReactNode;
  onAdd?: () => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onExport?: () => void;
  onDownloadTemplate?: () => void;
  onImport?: (file: File) => void;
  onClear?: () => void;
  onPreview?: () => void;
  rowActions?: (row: T) => ReactNode;
  addLabel?: string;
  title?: string;
  pageSize?: number;
  getRowId: (row: T) => string;
}

export function DataTable<T extends Record<string, any>>({
  rows,
  columns,
  searchFields,
  extraFilters,
  onAdd,
  onEdit,
  onDelete,
  onExport,
  onDownloadTemplate,
  onImport,
  onClear,
  onPreview,
  rowActions,
  addLabel = '新增',
  title,
  pageSize = 15,
  getRowId,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showClear, setShowClear] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'append' | 'overwrite'>('append');
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = rows.filter((row) => {
    if (!search) return true;
    return searchFields.some((f) => String(row[f] ?? '').toLowerCase().includes(search.toLowerCase()));
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sortKey) return 0;
    const av = (a as any)[sortKey];
    const bv = (b as any)[sortKey];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
    return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleImportSubmit = () => {
    if (importFile && onImport) {
      onImport(importFile);
      setShowImport(false);
      setImportFile(null);
      setImportMode('append');
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="搜索..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 w-56"
            />
          </div>
          {extraFilters}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onDownloadTemplate && (
            <Button variant="secondary" size="sm" onClick={onDownloadTemplate}>
              <FileSpreadsheet size={16} /> 下载模板
            </Button>
          )}
          {onImport && (
            <Button variant="secondary" size="sm" onClick={() => setShowImport(true)}>
              <Upload size={16} /> 导入Excel
            </Button>
          )}
          {onExport && (
            <Button variant="secondary" size="sm" onClick={onExport}>
              <Download size={16} /> 导出Excel
            </Button>
          )}
          {onPreview && (
            <Button variant="secondary" size="sm" onClick={onPreview}>
              <Eye size={16} /> 预览数据
            </Button>
          )}
          {onClear && (
            <Button variant="danger" size="sm" onClick={() => setShowClear(true)}>
              <Trash2 size={16} /> 清空数据
            </Button>
          )}
          {onAdd && (
            <Button size="sm" onClick={onAdd}>
              <Plus size={16} /> {addLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-3 text-left font-semibold text-slate-600 ${col.sortable ? 'cursor-pointer select-none hover:bg-slate-100' : ''}`}
                    style={col.width ? { width: col.width } : undefined}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.sortable && <ArrowUpDown size={13} className="text-slate-400" />}
                    </div>
                  </th>
                ))}
                {(onEdit || onDelete || rowActions) && <th className="px-4 py-3 text-right font-semibold text-slate-600">操作</th>}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-12 text-center text-slate-400">暂无数据</td>
                </tr>
              ) : (
                paged.map((row) => (
                  <tr key={getRowId(row)} className="border-b border-slate-100 hover:bg-sky-50/40 transition">
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 text-slate-700">
                        {col.render ? col.render(row) : String((row as any)[col.key] ?? '')}
                      </td>
                    ))}
                    {(onEdit || onDelete || rowActions) && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {rowActions?.(row)}
                          {onEdit && (
                            <Button variant="ghost" size="sm" onClick={() => onEdit(row)}>编辑</Button>
                          )}
                          {onDelete && (
                            <Button variant="ghost" size="sm" onClick={() => onDelete(row)} className="text-red-600 hover:bg-red-50">删除</Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
            <span>共 {sorted.length} 条</span>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>上一页</Button>
              <span className="px-3">{page} / {totalPages}</span>
              <Button size="sm" variant="secondary" disabled={page === totalPages} onClick={() => setPage(page + 1)}>下一页</Button>
            </div>
          </div>
        )}
      </div>

      {/* Clear confirm */}
      <ConfirmDialog
        open={showClear}
        onClose={() => setShowClear(false)}
        onConfirm={() => { onClear?.(); setShowClear(false); }}
        title="清空当前数据"
        danger
        requireTyped="确认清空"
        confirmText="确认清空"
        message={
          <div>
            <p className="mb-2 font-medium text-red-600">此操作将清空当前页面对应数据库中的所有数据，且不可恢复。</p>
            <p className="text-sm text-slate-500">如需清空整个系统数据库，请使用页面右上角的"清空系统数据库"功能。</p>
          </div>
        }
      />

      {/* Import dialog */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowImport(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">导入 Excel 数据</h3>
            <div className="space-y-4">
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-sky-700 hover:file:bg-sky-100"
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">导入方式：</p>
                <label className="flex items-center gap-2 mb-2 cursor-pointer">
                  <input type="radio" checked={importMode === 'append'} onChange={() => setImportMode('append')} />
                  <span className="text-sm">追加数据</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={importMode === 'overwrite'} onChange={() => setImportMode('overwrite')} />
                  <span className="text-sm">重复数据覆盖</span>
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowImport(false)}>取消</Button>
              <Button onClick={handleImportSubmit} disabled={!importFile}>确认导入</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
