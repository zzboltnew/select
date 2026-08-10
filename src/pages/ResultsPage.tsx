import { useState } from 'react';
import { FileCheck, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { useDB } from '@/store/db';
import { Button, Badge, Select, Input, Field, Toast, EmptyState } from '@/components/ui';
import type { ReviewLedger, ReviewResult } from '@/types';
import { LEDGER_STATUS_LABELS, LEDGER_STATUS_COLORS, REVIEW_RESULT_OPTIONS } from '@/types';

export default function ResultsPage() {
  const { db, updateLedger } = useDB();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Only show PENDING_RESULT ledgers
  const pendingLedgers = db.review_ledgers.filter((l) => l.status === 'PENDING_RESULT');

  const [forms, setForms] = useState<Record<string, Partial<ReviewLedger>>>({});

  const getForm = (id: string): Partial<ReviewLedger> => forms[id] ?? {};
  const setForm = (id: string, patch: Partial<ReviewLedger>) => {
    setForms((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const handleSave = (ledger: ReviewLedger) => {
    const f = getForm(ledger.id);
    const review_result = f.review_result ?? ledger.review_result;
    const publicity_batch = f.publicity_batch ?? ledger.publicity_batch;
    const publicity_start_date = f.publicity_start_date ?? ledger.publicity_start_date;
    const publicity_end_date = f.publicity_end_date ?? ledger.publicity_end_date;
    const cert_number = f.cert_number ?? ledger.cert_number;
    const cert_expire_date = f.cert_expire_date ?? ledger.cert_expire_date;
    const gov_accept_no = f.gov_accept_no ?? ledger.gov_accept_no;
    const gov_permit_no = f.gov_permit_no ?? ledger.gov_permit_no;

    const allFilled =
      review_result && publicity_batch && publicity_start_date && publicity_end_date &&
      cert_number && cert_expire_date && gov_accept_no && gov_permit_no;

    updateLedger(ledger.id, {
      review_result: review_result as ReviewResult,
      publicity_batch,
      publicity_start_date,
      publicity_end_date,
      cert_number,
      cert_expire_date,
      gov_accept_no,
      gov_permit_no,
      status: allFilled ? 'COMPLETED' : 'PENDING_RESULT',
    });

    if (allFilled) {
      setToast('所有字段已填写完毕，记录已归档');
      setExpandedId(null);
    } else {
      setToast('已保存，仍有字段未填写，状态保持待录入');
    }
  };

  const expertName = (id: string) => db.experts.find((e) => e.id === id)?.name ?? '—';
  const observerName = (id: string) => db.observers.find((o) => o.id === id)?.name ?? '—';
  const memberNames = (ledgerId: string) =>
    db.review_ledger_members
      .filter((m) => m.review_ledger_id === ledgerId)
      .map((m) => db.experts.find((e) => e.id === m.expert_id)?.name ?? '—')
      .join('、');

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800">评审结果登记</h2>
        <p className="text-sm text-slate-500">录入待归档评审记录的评审结果及证书信息</p>
      </div>

      {pendingLedgers.length === 0 ? (
        <EmptyState icon={<FileCheck size={48} />} message="暂无待录入结果的评审记录" />
      ) : (
        <div className="space-y-3">
          {pendingLedgers.map((ledger) => {
            const expanded = expandedId === ledger.id;
            const f = getForm(ledger.id);
            const allFilled =
              (f.review_result ?? ledger.review_result) &&
              (f.publicity_batch ?? ledger.publicity_batch) &&
              (f.publicity_start_date ?? ledger.publicity_start_date) &&
              (f.publicity_end_date ?? ledger.publicity_end_date) &&
              (f.cert_number ?? ledger.cert_number) &&
              (f.cert_expire_date ?? ledger.cert_expire_date) &&
              (f.gov_accept_no ?? ledger.gov_accept_no) &&
              (f.gov_permit_no ?? ledger.gov_permit_no);

            return (
              <div key={ledger.id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {/* Summary row */}
                <button
                  onClick={() => setExpandedId(expanded ? null : ledger.id)}
                  className="flex w-full items-center justify-between px-5 py-4 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{ledger.applicant_name}</p>
                      <p className="text-xs text-slate-500">{ledger.review_batch} · {ledger.license_item_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge color={LEDGER_STATUS_COLORS[ledger.status]}>{LEDGER_STATUS_LABELS[ledger.status]}</Badge>
                    {expanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                  </div>
                </button>

                {/* Expanded detail */}
                {expanded && (
                  <div className="border-t border-slate-200 p-5 space-y-5">
                    {/* Full info */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      <InfoItem label="许可类型" value={ledger.license_type} />
                      <InfoItem label="许可事项" value={ledger.license_item_name} />
                      <InfoItem label="评审方式" value={ledger.review_method} />
                      <InfoItem label="申请次数" value={String(ledger.apply_count)} />
                      <InfoItem label="评审日期" value={`${ledger.start_date} 至 ${ledger.end_date}`} />
                      <InfoItem label="专家组人数" value={String(ledger.total_experts_needed)} />
                      <InfoItem label="专家组长" value={ledger.leader_id ? expertName(ledger.leader_id) : '—'} />
                      <InfoItem label="观察员" value={ledger.observer_id ? observerName(ledger.observer_id) : '—'} />
                      <InfoItem label="专家组成员" value={memberNames(ledger.id) || '—'} />
                    </div>

                    {/* Editable result fields */}
                    <div className="border-t border-slate-100 pt-4">
                      <h4 className="mb-3 text-sm font-semibold text-slate-700">评审结果录入</h4>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <Field label="评审结果" required>
                          <Select
                            value={f.review_result ?? ledger.review_result ?? ''}
                            onChange={(e) => setForm(ledger.id, { review_result: e.target.value as ReviewResult })}
                          >
                            <option value="">请选择</option>
                            {REVIEW_RESULT_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                          </Select>
                        </Field>
                        <Field label="公示批次" required>
                          <Input value={f.publicity_batch ?? ledger.publicity_batch ?? ''} onChange={(e) => setForm(ledger.id, { publicity_batch: e.target.value })} />
                        </Field>
                        <Field label="公示起始日期" required>
                          <Input type="date" value={f.publicity_start_date ?? ledger.publicity_start_date ?? ''} onChange={(e) => setForm(ledger.id, { publicity_start_date: e.target.value })} />
                        </Field>
                        <Field label="公示结束日期" required>
                          <Input type="date" value={f.publicity_end_date ?? ledger.publicity_end_date ?? ''} onChange={(e) => setForm(ledger.id, { publicity_end_date: e.target.value })} />
                        </Field>
                        <Field label="证书编号" required>
                          <Input value={f.cert_number ?? ledger.cert_number ?? ''} onChange={(e) => setForm(ledger.id, { cert_number: e.target.value })} />
                        </Field>
                        <Field label="证书有效截止日期" required>
                          <Input type="date" value={f.cert_expire_date ?? ledger.cert_expire_date ?? ''} onChange={(e) => setForm(ledger.id, { cert_expire_date: e.target.value })} />
                        </Field>
                        <Field label="政务网受理号" required>
                          <Input value={f.gov_accept_no ?? ledger.gov_accept_no ?? ''} onChange={(e) => setForm(ledger.id, { gov_accept_no: e.target.value })} />
                        </Field>
                        <Field label="政务网许可案号" required>
                          <Input value={f.gov_permit_no ?? ledger.gov_permit_no ?? ''} onChange={(e) => setForm(ledger.id, { gov_permit_no: e.target.value })} />
                        </Field>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500">
                        {allFilled
                          ? <span className="text-emerald-600 font-medium">所有字段已填写，保存后将自动归档</span>
                          : <span className="text-amber-600">尚有字段未填写</span>}
                      </p>
                      <Button onClick={() => handleSave(ledger)}>
                        <Check size={16} /> 保存
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm text-slate-800">{value}</p>
    </div>
  );
}
