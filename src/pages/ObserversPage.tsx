import { useState } from 'react';
import { Eye } from 'lucide-react';
import { useDB } from '@/store/db';
import { DataTable, type Column } from '@/components/DataTable';
import { Modal, Button, Field, Input, ConfirmDialog, Toast, EmptyState, DataPreviewModal } from '@/components/ui';
import type { Observer } from '@/types';
import { exportObservers, downloadObserverTemplate, parseExcelFile, rowsToObservers, OBSERVER_COLUMNS } from '@/utils/excel';

const emptyObserver: Omit<Observer, 'id'> = { name: '', region: '', unit: '', department: '', position: '', mobile: '' };

export default function ObserversPage() {
  const { db, addObserver, updateObserver, deleteObserver, bulkReplace, bulkAppend } = useDB();
  const [editing, setEditing] = useState<Observer | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<Omit<Observer, 'id'>>(emptyObserver);
  const [deleteTarget, setDeleteTarget] = useState<Observer | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const openAdd = () => { setForm(emptyObserver); setIsAdding(true); setEditing(null); };
  const openEdit = (e: Observer) => { const { id, ...rest } = e; void id; setForm(rest); setEditing(e); setIsAdding(false); };
  const closeForm = () => { setEditing(null); setIsAdding(false); setForm(emptyObserver); };

  const handleSave = () => {
    if (!form.name.trim()) { setToast('请填写姓名'); return; }
    if (editing) { updateObserver(editing.id, form); setToast('已更新'); }
    else { addObserver(form); setToast('已添加'); }
    closeForm();
  };

  const handleImport = async (file: File) => {
    try {
      const rows = await parseExcelFile(file);
      const items = rowsToObservers(rows);
      if (items.length === 0) { setToast('导入文件无有效数据'); return; }
      const result = bulkAppend('observers', items, 'mobile');
      setToast(`导入完成：新增 ${result.added} 条，更新 ${result.updated} 条`);
    } catch { setToast('导入失败'); }
  };

  const columns: Column<Observer>[] = [
    { key: 'name', label: '姓名', sortable: true, render: (e) => <span className="font-medium text-slate-800">{e.name}</span> },
    { key: 'region', label: '地区' },
    { key: 'unit', label: '单位' },
    { key: 'department', label: '部门' },
    { key: 'position', label: '职位' },
    { key: 'mobile', label: '手机号' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800">观察员库管理</h2>
        <p className="text-sm text-slate-500">维护评审观察员信息</p>
      </div>
      <DataTable
        rows={db.observers}
        columns={columns}
        searchFields={['name', 'unit', 'region', 'mobile']}
        getRowId={(e) => e.id}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        onExport={() => exportObservers(db.observers)}
        onDownloadTemplate={downloadObserverTemplate}
        onImport={handleImport}
        onClear={() => bulkReplace('observers', [])}
        onPreview={() => setPreviewOpen(true)}
        addLabel="新增观察员"
      />
      <Modal
        open={isAdding || !!editing}
        onClose={closeForm}
        title={editing ? '编辑观察员' : '新增观察员'}
        footer={<><Button variant="secondary" onClick={closeForm}>取消</Button><Button onClick={handleSave}>保存</Button></>}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="姓名" required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="地区"><Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} /></Field>
          <Field label="单位"><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></Field>
          <Field label="部门"><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></Field>
          <Field label="职位"><Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} /></Field>
          <Field label="手机号"><Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></Field>
        </div>
      </Modal>
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) { deleteObserver(deleteTarget.id); setToast('已删除'); setDeleteTarget(null); } }}
        title="删除观察员"
        danger
        confirmText="确认删除"
        message={<p>确定要删除 <span className="font-semibold">{deleteTarget?.name}</span> 吗？</p>}
      />
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <DataPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="预览观察员库数据"
        data={db.observers}
        csvRows={db.observers.map((item) => {
          const row: Record<string, any> = {};
          for (const c of OBSERVER_COLUMNS) row[c.label] = (item as any)[c.key];
          return row;
        })}
        filename="观察员库"
      />
      {db.observers.length === 0 && <EmptyState icon={<Eye size={48} />} message="观察员库为空" />}
    </div>
  );
}
