import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { useDB } from '@/store/db';
import { DataTable, type Column } from '@/components/DataTable';
import { Modal, Button, Field, Input, Select, ConfirmDialog, Toast, EmptyState, DataPreviewModal } from '@/components/ui';
import type { InstitutionCertificate } from '@/types';
import { exportInstitutions, downloadInstitutionTemplate, parseExcelFile, rowsToInstitutions, INSTITUTION_COLUMNS } from '@/utils/excel';

const emptyInst: Omit<InstitutionCertificate, 'id'> = {
  name: '', province: '', nature: '', qualification_type: '', cert_no: '',
  issuing_unit: '', issue_date: '', valid_date_range: '', eval_date: '',
  renew_date: '', legal_person: '', admin_head: '', tech_head: '',
  quality_head: '', phone: '', address: '', postcode: '', status: '有效',
};

export default function InstitutionsPage() {
  const { db, addInstitution, updateInstitution, deleteInstitution, bulkReplace, bulkAppend } = useDB();
  const [editing, setEditing] = useState<InstitutionCertificate | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<Omit<InstitutionCertificate, 'id'>>(emptyInst);
  const [deleteTarget, setDeleteTarget] = useState<InstitutionCertificate | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const openAdd = () => { setForm(emptyInst); setIsAdding(true); setEditing(null); };
  const openEdit = (e: InstitutionCertificate) => { const { id, ...rest } = e; void id; setForm(rest); setEditing(e); setIsAdding(false); };
  const closeForm = () => { setEditing(null); setIsAdding(false); setForm(emptyInst); };

  const handleSave = () => {
    if (!form.name.trim()) { setToast('请填写名称'); return; }
    if (editing) { updateInstitution(editing.id, form); setToast('已更新'); }
    else { addInstitution(form); setToast('已添加'); }
    closeForm();
  };

  const handleImport = async (file: File) => {
    try {
      const rows = await parseExcelFile(file);
      const items = rowsToInstitutions(rows);
      if (items.length === 0) { setToast('导入文件无有效数据'); return; }
      const result = bulkAppend('institution_certificates', items, 'cert_no');
      setToast(`导入完成：新增 ${result.added} 条，更新 ${result.updated} 条`);
    } catch { setToast('导入失败'); }
  };

  const columns: Column<InstitutionCertificate>[] = [
    { key: 'name', label: '名称', sortable: true, render: (e) => <span className="font-medium text-slate-800">{e.name}</span> },
    { key: 'province', label: '省' },
    { key: 'nature', label: '机构性质' },
    { key: 'qualification_type', label: '资质类型' },
    { key: 'cert_no', label: '证书编号' },
    { key: 'status', label: '证书状态', render: (e) => <span className={e.status === '有效' ? 'text-emerald-600' : 'text-slate-500'}>{e.status}</span> },
    { key: 'legal_person', label: '法人' },
    { key: 'phone', label: '联系电话' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800">机构证书库管理</h2>
        <p className="text-sm text-slate-500">维护评审机构资质证书信息</p>
      </div>
      <DataTable
        rows={db.institution_certificates}
        columns={columns}
        searchFields={['name', 'province', 'cert_no', 'qualification_type']}
        getRowId={(e) => e.id}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        onExport={() => exportInstitutions(db.institution_certificates)}
        onDownloadTemplate={downloadInstitutionTemplate}
        onImport={handleImport}
        onClear={() => bulkReplace('institution_certificates', [])}
        onPreview={() => setPreviewOpen(true)}
        addLabel="新增机构"
      />
      <Modal
        open={isAdding || !!editing}
        onClose={closeForm}
        title={editing ? '编辑机构证书' : '新增机构证书'}
        size="lg"
        footer={<><Button variant="secondary" onClick={closeForm}>取消</Button><Button onClick={handleSave}>保存</Button></>}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="名称" required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="省"><Input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} /></Field>
          <Field label="机构性质"><Input value={form.nature} onChange={(e) => setForm({ ...form, nature: e.target.value })} /></Field>
          <Field label="资质类型"><Input value={form.qualification_type} onChange={(e) => setForm({ ...form, qualification_type: e.target.value })} /></Field>
          <Field label="证书编号"><Input value={form.cert_no} onChange={(e) => setForm({ ...form, cert_no: e.target.value })} /></Field>
          <Field label="颁布单位"><Input value={form.issuing_unit} onChange={(e) => setForm({ ...form, issuing_unit: e.target.value })} /></Field>
          <Field label="获取日期"><Input type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} /></Field>
          <Field label="有效起止日期"><Input value={form.valid_date_range} onChange={(e) => setForm({ ...form, valid_date_range: e.target.value })} /></Field>
          <Field label="评定日期"><Input type="date" value={form.eval_date} onChange={(e) => setForm({ ...form, eval_date: e.target.value })} /></Field>
          <Field label="换证日期"><Input type="date" value={form.renew_date} onChange={(e) => setForm({ ...form, renew_date: e.target.value })} /></Field>
          <Field label="法人"><Input value={form.legal_person} onChange={(e) => setForm({ ...form, legal_person: e.target.value })} /></Field>
          <Field label="行政负责人"><Input value={form.admin_head} onChange={(e) => setForm({ ...form, admin_head: e.target.value })} /></Field>
          <Field label="技术负责人"><Input value={form.tech_head} onChange={(e) => setForm({ ...form, tech_head: e.target.value })} /></Field>
          <Field label="质量负责人"><Input value={form.quality_head} onChange={(e) => setForm({ ...form, quality_head: e.target.value })} /></Field>
          <Field label="联系电话"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="邮编"><Input value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value })} /></Field>
          <Field label="证书状态"><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="有效">有效</option><option value="失效">失效</option><option value="暂停">暂停</option></Select></Field>
          <div className="sm:col-span-2 lg:col-span-1"><Field label="地址"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field></div>
        </div>
      </Modal>
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) { deleteInstitution(deleteTarget.id); setToast('已删除'); setDeleteTarget(null); } }}
        title="删除机构证书"
        danger
        confirmText="确认删除"
        message={<p>确定要删除 <span className="font-semibold">{deleteTarget?.name}</span> 吗？</p>}
      />
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <DataPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="预览机构证书库数据"
        data={db.institution_certificates}
        csvRows={db.institution_certificates.map((item) => {
          const row: Record<string, any> = {};
          for (const c of INSTITUTION_COLUMNS) row[c.label] = (item as any)[c.key];
          return row;
        })}
        filename="机构证书库"
      />
      {db.institution_certificates.length === 0 && <EmptyState icon={<Building2 size={48} />} message="机构证书库为空" />}
    </div>
  );
}
