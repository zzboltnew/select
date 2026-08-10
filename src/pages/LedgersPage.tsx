import { useState } from 'react';
import { ClipboardList, ArrowRight } from 'lucide-react';
import { useDB } from '@/store/db';
import { DataTable, type Column } from '@/components/DataTable';
import { Modal, Button, Field, Input, Select, ConfirmDialog, Toast, EmptyState, Badge, DataPreviewModal } from '@/components/ui';
import type { ReviewLedger, LedgerStatus, ReviewResult } from '@/types';
import { LEDGER_STATUS_LABELS, LEDGER_STATUS_COLORS, REVIEW_RESULT_OPTIONS } from '@/types';
import { exportLedgers, downloadLedgerTemplate, parseExcelFile, rowsToLedgers, LEDGER_COLUMNS } from '@/utils/excel';

interface Props {
  onGoToSelection: (ledgerId: string) => void;
}

export default function LedgersPage({ onGoToSelection }: Props) {
  const { db, addLedger, updateLedger, deleteLedger, setMembers, bulkReplace, importLedgersWithMembers, getMembers } = useDB();
  const [isAdding, setIsAdding] = useState(false);
  const [editing, setEditing] = useState<ReviewLedger | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReviewLedger | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const emptyForm: Omit<ReviewLedger, 'id' | 'created_at' | 'updated_at' | 'review_batch' | 'publicity_batch'> = {
    applicant_name: '',
    license_type: '',
    apply_count: 1,
    license_item_name: '',
    review_method: '',
    start_date: '',
    end_date: '',
    total_experts_needed: 5,
    leader_id: '',
    observer_id: '',
    batch_year: String(new Date().getFullYear()),
    batch_seq: 0,
    status: 'PENDING_EXTRACT',
    review_result: '',
    publicity_batch_year: '',
    publicity_batch_seq: 0,
    publicity_start_date: '',
    publicity_end_date: '',
    cert_number: '',
    cert_expire_date: '',
    gov_accept_no: '',
    gov_permit_no: '',
    remarks: '',
  };

  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [memberIds, setMemberIds] = useState<string[]>([]);

  const openAdd = () => {
    setForm({ ...emptyForm, batch_seq: db.review_ledgers.length + 1 });
    setIsAdding(true);
    setEditing(null);
  };

  const openEdit = (e: ReviewLedger) => {
    const { id, created_at, updated_at, review_batch, publicity_batch, ...rest } = e;
    void id; void created_at; void updated_at; void review_batch; void publicity_batch;
    setForm(rest);
    setMemberIds(getMembers(e.id).map((m) => m.expert_id));
    setEditing(e);
    setIsAdding(false);
  };

  const closeForm = () => { setEditing(null); setIsAdding(false); setForm(emptyForm); setMemberIds([]); };

  const handleSave = () => {
    if (!form.applicant_name.trim()) { setToast('请填写申请人名称'); return; }
    if (!form.license_type) { setToast('请选择许可类型'); return; }
    if (!form.license_item_name) { setToast('请选择许可事项'); return; }
    if (!form.review_method) { setToast('请选择评审方式'); return; }
    if (!form.start_date || !form.end_date) { setToast('请选择评审日期'); return; }
    if (form.total_experts_needed < 1) { setToast('专家组人数至少为1'); return; }

    const review_batch = `${form.batch_year}-${String(form.batch_seq).padStart(3, '0')}`;
    const publicity_batch = form.publicity_batch_year && form.publicity_batch_seq
      ? `${form.publicity_batch_year}-${String(form.publicity_batch_seq).padStart(3, '0')}`
      : '';

    const payload = { ...form, review_batch, publicity_batch };

    if (editing) {
      updateLedger(editing.id, payload);
      setMembers(editing.id, memberIds);
      setToast('台账已更新');
    } else {
      const id = addLedger(payload);
      setToast('台账已创建，跳转至专家抽取');
      closeForm();
      onGoToSelection(id);
      return;
    }
    closeForm();
  };

  const handleImport = async (file: File) => {
    try {
      const rows = await parseExcelFile(file);
      const resultData = rowsToLedgers(rows, db.experts, db.observers);
      if (resultData.ledgers.length === 0) { setToast('导入文件无有效数据'); return; }
      const result = importLedgersWithMembers(resultData.ledgers, resultData.members);
      setToast(`导入完成：新增 ${result.added} 条，更新 ${result.updated} 条`);
    } catch { setToast('导入失败，请检查文件格式'); }
  };

  const filtered = statusFilter ? db.review_ledgers.filter((l) => l.status === statusFilter) : db.review_ledgers;

  const expertName = (id: string) => db.experts.find((e) => e.id === id)?.name ?? '—';
  const observerName = (id: string) => db.observers.find((o) => o.id === id)?.name ?? '—';
  const memberNames = (ledgerId: string) =>
    getMembers(ledgerId)
      .map((m) => db.experts.find((e) => e.id === m.expert_id)?.name ?? '—')
      .join('、');
  const memberCount = (ledgerId: string) => getMembers(ledgerId).length;

  const columns: Column<ReviewLedger>[] = [
    { key: 'review_batch', label: '评审批次', sortable: true, render: (l) => <span className="font-mono text-slate-700">{l.review_batch || '—'}</span> },
    { key: 'applicant_name', label: '申请人', sortable: true, render: (l) => <span className="font-medium text-slate-800">{l.applicant_name}</span> },
    { key: 'license_type', label: '许可类型' },
    { key: 'license_item_name', label: '许可事项' },
    { key: 'review_method', label: '评审方式' },
    { key: 'total_experts_needed', label: '专家组人数', render: (l) => `${memberCount(l.id) + (l.leader_id ? 1 : 0)}/${l.total_experts_needed}` },
    { key: 'leader_id', label: '专家组长', render: (l) => l.leader_id ? <span className="font-medium text-amber-700">{expertName(l.leader_id)}</span> : <span className="text-slate-400">未选定</span> },
    {
      key: 'member_names',
      label: '专家组成员',
      render: (l) => {
        const names = memberNames(l.id);
        return names ? <span className="text-sm text-slate-600">{names}</span> : <span className="text-slate-400">未选定</span>;
      },
    },
    { key: 'observer_id', label: '观察员', render: (l) => l.observer_id ? observerName(l.observer_id) : <span className="text-slate-400">未选定</span> },
    {
      key: 'status',
      label: '状态',
      sortable: true,
      render: (l) => <Badge color={LEDGER_STATUS_COLORS[l.status]}>{LEDGER_STATUS_LABELS[l.status]}</Badge>,
    },
  ];

  const reviewBatchPreview = `${form.batch_year}-${String(form.batch_seq).padStart(3, '0')}`;
  const publicityBatchPreview = form.publicity_batch_year && form.publicity_batch_seq
    ? `${form.publicity_batch_year}-${String(form.publicity_batch_seq).padStart(3, '0')}`
    : '';

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800">评审台账管理</h2>
        <p className="text-sm text-slate-500">管理评审申报记录及全流程状态</p>
      </div>

      <DataTable
        rows={filtered}
        columns={columns}
        searchFields={['applicant_name', 'review_batch', 'license_type', 'license_item_name']}
        searchPlaceholders={['搜索申请人/评审批次...']}
        extraFilters={
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
            <option value="">全部状态</option>
            {(Object.keys(LEDGER_STATUS_LABELS) as LedgerStatus[]).map((s) => (
              <option key={s} value={s}>{LEDGER_STATUS_LABELS[s]}</option>
            ))}
          </Select>
        }
        getRowId={(l) => l.id}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        onExport={() => exportLedgers(db.review_ledgers, db.experts, db.observers, db.review_ledger_members)}
        onDownloadTemplate={downloadLedgerTemplate}
        onImport={handleImport}
        onClear={() => bulkReplace('review_ledgers', [])}
        onPreview={() => setPreviewOpen(true)}
        addLabel="新增评审申报"
        rowActions={(l) => (
          <Button size="sm" variant="ghost" onClick={() => onGoToSelection(l.id)} className="text-sky-600 hover:bg-sky-50">
            进入流程 <ArrowRight size={14} />
          </Button>
        )}
      />

      {/* Add/Edit Modal */}
      <Modal
        open={isAdding || !!editing}
        onClose={closeForm}
        title={editing ? '编辑评审台账' : '新增评审申报'}
        size="lg"
        footer={<><Button variant="secondary" onClick={closeForm}>取消</Button><Button onClick={handleSave}>{editing ? '保存' : '提交并抽取专家'}</Button></>}
      >
        <div className="space-y-6">
          {/* Section: 申报信息 */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-700 border-b border-slate-100 pb-1">申报信息</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="申请人名称" required>
                <Input list="institution-list" value={form.applicant_name} onChange={(e) => setForm({ ...form, applicant_name: e.target.value })} placeholder="输入或选择机构" />
                <datalist id="institution-list">
                  {db.institution_certificates.map((c) => <option key={c.id} value={c.name} />)}
                </datalist>
              </Field>
              <Field label="许可类型" required>
                <Select value={form.license_type} onChange={(e) => setForm({ ...form, license_type: e.target.value })}>
                  <option value="">请选择</option>
                  {db.base_license_types.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
                </Select>
              </Field>
              <Field label="许可事项" required>
                <Select value={form.license_item_name} onChange={(e) => setForm({ ...form, license_item_name: e.target.value })}>
                  <option value="">请选择</option>
                  {db.base_license_items.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
                </Select>
              </Field>
              <Field label="评审方式" required>
                <Select value={form.review_method} onChange={(e) => setForm({ ...form, review_method: e.target.value })}>
                  <option value="">请选择</option>
                  {db.base_review_methods.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
                </Select>
              </Field>
              <Field label="申请次数"><Input type="number" min={1} value={form.apply_count} onChange={(e) => setForm({ ...form, apply_count: Number(e.target.value) })} /></Field>
              <Field label="专家组总人数" required><Input type="number" min={1} value={form.total_experts_needed} onChange={(e) => setForm({ ...form, total_experts_needed: Number(e.target.value) })} /></Field>
              <Field label="评审起始日期" required><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></Field>
              <Field label="评审结束日期" required><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></Field>
            </div>
          </div>

          {/* Section: 评审批次 */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-700 border-b border-slate-100 pb-1">评审批次</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="批次年份"><Input value={form.batch_year} onChange={(e) => setForm({ ...form, batch_year: e.target.value })} /></Field>
              <Field label="批序号"><Input type="number" value={form.batch_seq} onChange={(e) => setForm({ ...form, batch_seq: Number(e.target.value) })} /></Field>
              <Field label="评审批次（自动生成）"><Input value={reviewBatchPreview} readOnly className="bg-slate-50 font-mono" /></Field>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-700 border-b border-slate-100 pb-1">专家组与观察员</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="专家组长">
                <Select value={form.leader_id} onChange={(e) => setForm({ ...form, leader_id: e.target.value })}>
                  <option value="">请选择专家组长</option>
                  {db.experts.map((expert) => <option key={expert.id} value={expert.id}>{expert.name}</option>)}
                </Select>
              </Field>
              <Field label="观察员">
                <Select value={form.observer_id} onChange={(e) => setForm({ ...form, observer_id: e.target.value })}>
                  <option value="">请选择观察员</option>
                  {db.observers.map((observer) => <option key={observer.id} value={observer.id}>{observer.name}</option>)}
                </Select>
              </Field>
              <Field label={`专家组成员（已选 ${memberIds.length}/${form.total_experts_needed} 人）`}>
                <Select multiple value={memberIds} onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, (option) => option.value).slice(0, Math.max(0, form.total_experts_needed - (form.leader_id ? 1 : 0)));
                  setMemberIds(selected);
                }} className="min-h-[132px]">
                  {db.experts.filter((expert) => expert.id !== form.leader_id).map((expert) => <option key={expert.id} value={expert.id}>{expert.name}</option>)}
                </Select>
                <p className="mt-1 text-xs text-slate-500">按住 Ctrl 或 Command 可多选，成员会逐人保存。</p>
              </Field>
            </div>
          </div>

          {/* Section: 评审结果与公示 */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-700 border-b border-slate-100 pb-1">评审结果与公示</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="评审结果">
                <Select value={form.review_result} onChange={(e) => setForm({ ...form, review_result: e.target.value as ReviewResult })}>
                  <option value="">请选择</option>
                  {REVIEW_RESULT_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </Select>
              </Field>
              <Field label="公示批次年份"><Input value={form.publicity_batch_year} onChange={(e) => setForm({ ...form, publicity_batch_year: e.target.value })} /></Field>
              <Field label="公示批序号"><Input type="number" value={form.publicity_batch_seq} onChange={(e) => setForm({ ...form, publicity_batch_seq: Number(e.target.value) })} /></Field>
              <Field label="公示批次（自动生成）"><Input value={publicityBatchPreview} readOnly className="bg-slate-50 font-mono" placeholder="填写年份和序号后自动生成" /></Field>
              <Field label="公示起始日期"><Input type="date" value={form.publicity_start_date} onChange={(e) => setForm({ ...form, publicity_start_date: e.target.value })} /></Field>
              <Field label="公示结束日期"><Input type="date" value={form.publicity_end_date} onChange={(e) => setForm({ ...form, publicity_end_date: e.target.value })} /></Field>
            </div>
          </div>

          {/* Section: 证书与政务信息 */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-700 border-b border-slate-100 pb-1">证书与政务信息</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="证书编号"><Input value={form.cert_number} onChange={(e) => setForm({ ...form, cert_number: e.target.value })} /></Field>
              <Field label="证书有效截止日期"><Input type="date" value={form.cert_expire_date} onChange={(e) => setForm({ ...form, cert_expire_date: e.target.value })} /></Field>
              <Field label="政务网受理号"><Input value={form.gov_accept_no} onChange={(e) => setForm({ ...form, gov_accept_no: e.target.value })} /></Field>
              <Field label="政务网许可案号"><Input value={form.gov_permit_no} onChange={(e) => setForm({ ...form, gov_permit_no: e.target.value })} /></Field>
              <Field label="备注"><textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} className="min-h-[88px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500" placeholder="记录特殊情况" /></Field>
              <Field label="状态">
                <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as LedgerStatus })}>
                  {(Object.keys(LEDGER_STATUS_LABELS) as LedgerStatus[]).map((s) => (
                    <option key={s} value={s}>{LEDGER_STATUS_LABELS[s]}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) { deleteLedger(deleteTarget.id); setToast('已删除'); setDeleteTarget(null); } }}
        title="删除台账"
        danger
        confirmText="确认删除"
        message={<p>确定要删除 <span className="font-semibold">{deleteTarget?.applicant_name}</span> 的评审台账吗？</p>}
      />

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <DataPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="预览评审台账数据"
        data={db.review_ledgers}
        csvRows={db.review_ledgers.map((l) => {
          const row: Record<string, any> = {};
          for (const c of LEDGER_COLUMNS) {
            if (c.key === 'status') row[c.label] = LEDGER_STATUS_LABELS[l.status];
            else row[c.label] = (l as any)[c.key];
          }
          return row;
        })}
        filename="评审台账"
      />
      {db.review_ledgers.length === 0 && <EmptyState icon={<ClipboardList size={48} />} message="暂无评审台账" />}
    </div>
  );
}
