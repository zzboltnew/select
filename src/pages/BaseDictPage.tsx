import { useState, useRef } from 'react';
import { Plus, Edit2, Trash2, FileSpreadsheet, Upload, Download, Eye } from 'lucide-react';
import { useDB } from '@/store/db';
import { Button, Input, ConfirmDialog, Toast, EmptyState, DataPreviewModal } from '@/components/ui';
import type { BaseDictionaryItem } from '@/types';
import { exportBaseDict, downloadBaseDictTemplate, parseExcelFile, rowsToBaseDict } from '@/utils/excel';

type DictTable = 'base_license_types' | 'base_license_items' | 'base_review_methods' | 'base_review_modes';

const TABS: { key: DictTable; label: string; fileLabel: string }[] = [
  { key: 'base_license_types', label: '许可类型表', fileLabel: '许可类型' },
  { key: 'base_license_items', label: '许可事项表', fileLabel: '许可事项' },
  { key: 'base_review_methods', label: '评审方式表', fileLabel: '评审方式' },
  { key: 'base_review_modes', label: '评审模式表', fileLabel: '评审模式' },
];

export default function BaseDictPage() {
  const { db, addBaseItem, updateBaseItem, deleteBaseItem, bulkReplace, bulkAppend } = useDB();
  const [activeTab, setActiveTab] = useState<DictTable>('base_license_types');
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<BaseDictionaryItem | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<BaseDictionaryItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const tabMeta = TABS.find((t) => t.key === activeTab)!;
  const items = db[activeTab] as BaseDictionaryItem[];

  const handleAdd = () => {
    if (!newName.trim()) { setToast('请输入名称'); return; }
    addBaseItem(activeTab, newName.trim());
    setNewName('');
    setToast('已添加');
  };

  const handleEditSave = () => {
    if (!editName.trim()) { setToast('请输入名称'); return; }
    if (editing) { updateBaseItem(activeTab, editing.id, editName.trim()); setToast('已更新'); }
    setEditing(null);
    setEditName('');
  };

  const handleImport = async () => {
    if (!importFile) return;
    try {
      const rows = await parseExcelFile(importFile);
      const parsed = rowsToBaseDict(rows);
      if (parsed.length === 0) { setToast('导入文件无有效数据'); return; }
      const result = bulkAppend(activeTab, parsed, 'name');
      setToast(`导入完成：新增 ${result.added} 条，更新 ${result.updated} 条`);
    } catch { setToast('导入失败'); }
    setImportOpen(false);
    setImportFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800">基础数据库管理</h2>
        <p className="text-sm text-slate-500">许可类型、许可事项、评审方式字典维护</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.key ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Input
            placeholder={`新增${tabMeta.label}...`
            }
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="w-56"
          />
          <Button size="sm" onClick={handleAdd}><Plus size={16} /> 添加</Button>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => downloadBaseDictTemplate(tabMeta.fileLabel, `${tabMeta.fileLabel}导入模板.xlsx`)}>
            <FileSpreadsheet size={16} /> 下载模板
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setImportOpen(true)}>
            <Upload size={16} /> 导入Excel
          </Button>
          <Button size="sm" variant="secondary" onClick={() => exportBaseDict(items, `${tabMeta.fileLabel}.xlsx`, tabMeta.fileLabel)}>
            <Download size={16} /> 导出Excel
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setPreviewOpen(true)}>
            <Eye size={16} /> 预览数据
          </Button>
          <Button size="sm" variant="danger" onClick={() => setClearOpen(true)}>清空数据</Button>
        </div>
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left font-semibold text-slate-600">序号</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">名称</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-12 text-center text-slate-400">暂无数据</td></tr>
            ) : items.map((item, i) => (
              <tr key={item.id} className="border-b border-slate-100 hover:bg-sky-50/40">
                <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(item); setEditName(item.name); }}>
                      <Edit2 size={14} /> 编辑
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setDeleteTarget(item)}>
                      <Trash2 size={14} /> 删除
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setEditing(null)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">编辑{tabMeta.label}</h3>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setEditing(null)}>取消</Button>
              <Button onClick={handleEditSave}>保存</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) { deleteBaseItem(activeTab, deleteTarget.id); setToast('已删除'); setDeleteTarget(null); } }}
        title="删除"
        danger
        confirmText="确认删除"
        message={<p>确定要删除 <span className="font-semibold">{deleteTarget?.name}</span> 吗？</p>}
      />

      {/* Clear confirm */}
      <ConfirmDialog
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        onConfirm={() => { bulkReplace(activeTab, []); setClearOpen(false); setToast('已清空'); }}
        title="高危操作：清空数据"
        danger
        requireTyped="确认清空"
        confirmText="确认清空"
        message={<p>此操作将永久删除当前{tabMeta.label}中的所有数据，且不可恢复！</p>}
      />

      {/* Import dialog */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setImportOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">导入 Excel 数据</h3>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-sky-700"
            />
            <p className="mt-3 text-xs text-slate-500">导入方式：重复数据覆盖（按名称匹配）</p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setImportOpen(false)}>取消</Button>
              <Button onClick={handleImport} disabled={!importFile}>确认导入</Button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <DataPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={`预览${tabMeta.label}数据`}
        data={items}
        csvRows={items.map((item) => ({ '名称': item.name }))}
        filename={tabMeta.fileLabel}
      />
      {items.length === 0 && <EmptyState icon={<Plus size={48} />} message={`${tabMeta.label}为空`} />}
    </div>
  );
}
