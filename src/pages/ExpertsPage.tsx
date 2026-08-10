import { useState } from 'react';
import { Users, Check, X } from 'lucide-react';
import { useDB } from '@/store/db';
import { DataTable, type Column } from '@/components/DataTable';
import { Modal, Button, Field, Input, Select, Textarea, Badge, ConfirmDialog, Toast, EmptyState, DataPreviewModal } from '@/components/ui';
import type { Expert, Qualifications, QualificationRole } from '@/types';
import { QUALIFICATION_KEYS } from '@/types';
import {
  exportExperts,
  downloadExpertTemplate,
  parseExcelFile,
  rowsToExperts,
  EXPERT_COLUMNS,
} from '@/utils/excel';

const QUAL_LABELS: Record<keyof Qualifications, string> = {
  highway_bridge_tunnel: '公路工程桥梁隧道工程专项',
  highway_grade_b: '公路工程乙级',
  highway_grade_c: '公路工程丙级',
  waterway_material_b: '水运工程材料乙级',
  waterway_material_c: '水运工程材料丙级',
  waterway_structure_b: '水运工程结构乙级',
};

const emptyExpert: Omit<Expert, 'id' | 'seq_no'> = {
  is_enabled: true,
  region: '',
  name: '',
  work_unit: '',
  post_status: '在职',
  unit_location: '',
  title: '',
  is_leader_qualified: false,
  qualifications: {},
  id_card: '',
  gender: '男',
  birth_year: 1980,
  education: '大学本科',
  position: '',
  phone: '',
  mobile: '',
  email: '',
  address: '',
  postcode: '',
  remarks: '',
};

export default function ExpertsPage() {
  const { db, addExpert, updateExpert, deleteExpert, bulkReplace, bulkAppend } = useDB();
  const [editing, setEditing] = useState<Expert | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<Omit<Expert, 'id' | 'seq_no'>>(emptyExpert);
  const [deleteTarget, setDeleteTarget] = useState<Expert | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const openAdd = () => {
    setForm(emptyExpert);
    setIsAdding(true);
    setEditing(null);
  };

  const openEdit = (e: Expert) => {
    const { id, seq_no, ...rest } = e;
    void id; void seq_no;
    setForm({ ...rest, qualifications: { ...e.qualifications } });
    setEditing(e);
    setIsAdding(false);
  };

  const closeForm = () => {
    setEditing(null);
    setIsAdding(false);
    setForm(emptyExpert);
  };

  const handleSave = () => {
    if (!form.name.trim()) { setToast('请填写姓名'); return; }
    if (!form.work_unit.trim()) { setToast('请填写工作单位'); return; }
    if (!form.mobile.trim()) { setToast('请填写手机号'); return; }
    if (editing) {
      updateExpert(editing.id, form);
      setToast('专家信息已更新');
    } else {
      addExpert(form);
      setToast('专家已添加');
    }
    closeForm();
  };

  const handleImport = async (file: File) => {
    try {
      const rows = await parseExcelFile(file);
      const experts = rowsToExperts(rows);
      if (experts.length === 0) { setToast('导入文件无有效数据'); return; }
      // For simplicity: append mode uses bulkAppend with name+id_card match; overwrite uses replace
      // We'll always use append with overwrite-on-match via matchKey name
      const result = bulkAppend('experts', experts, 'id_card');
      setToast(`导入完成：新增 ${result.added} 条，更新 ${result.updated} 条`);
    } catch {
      setToast('导入失败，请检查文件格式');
    }
  };

  const columns: Column<Expert>[] = [
    { key: 'seq_no', label: '序号', sortable: true, width: '60px' },
    {
      key: 'is_enabled',
      label: '启用',
      render: (e) => e.is_enabled
        ? <Badge color="bg-emerald-100 text-emerald-700 border-emerald-200">启用</Badge>
        : <Badge color="bg-slate-100 text-slate-500 border-slate-200">停用</Badge>,
    },
    { key: 'name', label: '姓名', sortable: true, render: (e) => <span className="font-medium text-slate-800">{e.name}</span> },
    { key: 'work_unit', label: '工作单位', sortable: true },
    { key: 'title', label: '职称' },
    { key: 'region', label: '区域' },
    { key: 'mobile', label: '手机' },
    {
      key: 'qualifications',
      label: '专项资格',
      render: (e) => {
        const tags = QUALIFICATION_KEYS
          .filter((qk) => e.qualifications[qk.key])
          .map((qk) => `${QUAL_LABELS[qk.key]}(${e.qualifications[qk.key]})`);
        if (tags.length === 0) return <span className="text-slate-400">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {tags.map((t, i) => (
              <span key={i} className={`rounded px-1.5 py-0.5 text-xs ${t.includes('组长') ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-600'}`}>{t}</span>
            ))}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800">专家库管理</h2>
        <p className="text-sm text-slate-500">维护评审专家基础信息、专项资格及启用状态</p>
      </div>

      <DataTable
        rows={db.experts}
        columns={columns}
        searchFields={['name', 'work_unit', 'title', 'region', 'mobile', 'id_card']}
        getRowId={(e) => e.id}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        onExport={() => exportExperts(db.experts)}
        onDownloadTemplate={downloadExpertTemplate}
        onImport={handleImport}
        onClear={() => bulkReplace('experts', [])}
        onPreview={() => setPreviewOpen(true)}
        addLabel="新增专家"
      />

      {/* Add/Edit Modal */}
      <Modal
        open={isAdding || !!editing}
        onClose={closeForm}
        title={editing ? '编辑专家' : '新增专家'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>取消</Button>
            <Button onClick={handleSave}>保存</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="姓名" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="工作单位" required>
            <Input value={form.work_unit} onChange={(e) => setForm({ ...form, work_unit: e.target.value })} />
          </Field>
          <Field label="手机" required>
            <Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
          </Field>
          <Field label="是否启用">
            <Select value={form.is_enabled ? 'true' : 'false'} onChange={(e) => setForm({ ...form, is_enabled: e.target.value === 'true' })}>
              <option value="true">启用</option>
              <option value="false">停用</option>
            </Select>
          </Field>
          <Field label="专家区域">
            <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
          </Field>
          <Field label="岗位状态">
            <Select value={form.post_status} onChange={(e) => setForm({ ...form, post_status: e.target.value })}>
              <option value="在职">在职</option>
              <option value="退休返聘">退休返聘</option>
            </Select>
          </Field>
          <Field label="单位所在地">
            <Input value={form.unit_location} onChange={(e) => setForm({ ...form, unit_location: e.target.value })} />
          </Field>
          <Field label="职称">
            <Select value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}>
              <option value="">请选择</option>
              <option value="正高级工程师">正高级工程师</option>
              <option value="高级工程师">高级工程师</option>
              <option value="工程师">工程师</option>
            </Select>
          </Field>
          <Field label="是否担任组长">
            <Select value={form.is_leader_qualified ? 'true' : 'false'} onChange={(e) => setForm({ ...form, is_leader_qualified: e.target.value === 'true' })}>
              <option value="false">否</option>
              <option value="true">是</option>
            </Select>
          </Field>
          <Field label="身份证号">
            <Input value={form.id_card} onChange={(e) => setForm({ ...form, id_card: e.target.value })} />
          </Field>
          <Field label="性别">
            <Select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="男">男</option>
              <option value="女">女</option>
            </Select>
          </Field>
          <Field label="出生年份">
            <Input type="number" value={form.birth_year} onChange={(e) => setForm({ ...form, birth_year: Number(e.target.value) })} />
          </Field>
          <Field label="学历">
            <Select value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })}>
              <option value="博士研究生">博士研究生</option>
              <option value="硕士研究生">硕士研究生</option>
              <option value="大学本科">大学本科</option>
            </Select>
          </Field>
          <Field label="职务">
            <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
          </Field>
          <Field label="电话">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="电子邮箱">
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="邮编">
            <Input value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value })} />
          </Field>
          <Field label="通讯地址">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
        </div>

        {/* Qualifications */}
        <div className="mt-6">
          <h4 className="mb-3 text-sm font-semibold text-slate-700">专项资格</h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {QUALIFICATION_KEYS.map((qk) => (
              <Field key={qk.key} label={QUAL_LABELS[qk.key]}>
                <Select
                  value={form.qualifications[qk.key] ?? ''}
                  onChange={(e) => setForm({
                    ...form,
                    qualifications: { ...form.qualifications, [qk.key]: e.target.value as QualificationRole },
                  })}
                >
                  <option value="">无</option>
                  <option value="组长">组长</option>
                  <option value="组员">组员</option>
                </Select>
              </Field>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <Field label="备注">
            <Textarea rows={2} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
          </Field>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) { deleteExpert(deleteTarget.id); setToast('已删除'); setDeleteTarget(null); } }}
        title="删除专家"
        danger
        confirmText="确认删除"
        message={<p>确定要删除专家 <span className="font-semibold text-slate-800">{deleteTarget?.name}</span> 吗？</p>}
      />

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <DataPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="预览专家库数据"
        data={db.experts}
        csvRows={db.experts.map((e) => {
          const row: Record<string, any> = {};
          for (const c of EXPERT_COLUMNS) row[c.label] = (e as any)[c.key];
          return row;
        })}
        filename="专家库"
      />

      {db.experts.length === 0 && (
        <EmptyState icon={<Users size={48} />} message="专家库为空，请新增或导入专家数据" />
      )}
    </div>
  );
}
