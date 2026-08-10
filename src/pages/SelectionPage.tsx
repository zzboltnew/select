import { useState, useEffect, useMemo } from 'react';
import {
  UserCheck, ChevronRight, ChevronLeft, Users, Crown, Eye, Calendar,
  Check, RefreshCw, Loader2, Phone, Building2, Award, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { useDB } from '@/store/db';
import { Button, Badge, Toast, Field, Input, Select } from '@/components/ui';
import type { ReviewLedger, Expert } from '@/types';
import { LEDGER_STATUS_LABELS, LEDGER_STATUS_COLORS } from '@/types';
import {
  extractLeaderCandidates,
  extractMemberCandidates,
  extractSupplementCandidates,
} from '@/utils/extraction';

interface Props {
  ledgerId: string | null;
  onLedgerChanged: (ledgerId: string) => void;
}

const STEPS = [
  { num: 1, label: '评审申报', icon: CheckCircle2 },
  { num: 2, label: '专家抽取', icon: Users },
  { num: 3, label: '选定观察员', icon: Eye },
  { num: 4, label: '确定批次', icon: Calendar },
];

export default function SelectionPage({ ledgerId, onLedgerChanged }: Props) {
  const { db, updateLedger, setMembers, getMembers, clearMembers } = useDB();
  const [selectedLedgerId, setSelectedLedgerId] = useState<string | null>(ledgerId);
  const [step, setStep] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);

  // Selection state
  const [leaderCandidates, setLeaderCandidates] = useState<Expert[]>([]);
  const [memberCandidates, setMemberCandidates] = useState<Expert[]>([]);
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [hasExtractedLeader, setHasExtractedLeader] = useState(false);
  const [hasExtractedMembers, setHasExtractedMembers] = useState(false);

  // Batch form
  const [batchYear, setBatchYear] = useState(String(new Date().getFullYear()));
  const [batchSeq, setBatchSeq] = useState(1);

  const ledger = db.review_ledgers.find((l) => l.id === selectedLedgerId) ?? null;

  // Sync with prop
  useEffect(() => {
    setSelectedLedgerId(ledgerId);
  }, [ledgerId]);

  // Initialize from ledger
  useEffect(() => {
    if (!ledger) return;
    setSelectedLeaderId(ledger.leader_id || '');
    const existingMembers = getMembers(ledger.id).map((m) => m.expert_id);
    setSelectedMemberIds(existingMembers);
    setBatchYear(ledger.batch_year || String(new Date().getFullYear()));
    setBatchSeq(ledger.batch_seq || 1);

    // Determine step based on status
    if (ledger.status === 'PENDING_EXTRACT' || ledger.status === 'EXTRACTING') setStep(2);
    else if (ledger.status === 'PENDING_BATCH') setStep(4);
    else if (ledger.status === 'PENDING_RESULT' || ledger.status === 'COMPLETED') setStep(4);
    else setStep(2);

    setHasExtractedLeader(!!ledger.leader_id);
    setHasExtractedMembers(existingMembers.length > 0);
  }, [ledger?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const needMembers = ledger ? Math.max(0, ledger.total_experts_needed - 1) : 0;

  const handleExtractLeader = () => {
    if (!ledger) return;
    setExtracting(true);
    setTimeout(() => {
      const candidates = extractLeaderCandidates(db.experts, ledger.applicant_name, ledger.license_item_name);
      setLeaderCandidates(candidates);
      setHasExtractedLeader(true);
      setExtracting(false);
      if (candidates.length === 0) setToast('未找到符合条件的组长候选专家');
      else setToast(`已生成 ${candidates.length} 名组长候选人`);
    }, 600);
  };

  const handleConfirmLeader = () => {
    if (!ledger || !selectedLeaderId) { setToast('请勾选1名专家组长'); return; }
    updateLedger(ledger.id, { leader_id: selectedLeaderId, status: 'EXTRACTING' });
    setToast('专家组长已确定');
  };

  const handleExtractMembers = () => {
    if (!ledger) return;
    if (!ledger.leader_id) { setToast('请先确定专家组长'); return; }
    setExtracting(true);
    setTimeout(() => {
      const candidates = extractMemberCandidates(db.experts, {
        applicantName: ledger.applicant_name,
        licenseItemName: ledger.license_item_name,
        totalNeeded: ledger.total_experts_needed,
        excludeExpertIds: [ledger.leader_id],
      });
      setMemberCandidates(candidates);
      setHasExtractedMembers(true);
      setExtracting(false);
      if (candidates.length === 0) setToast('未找到符合条件的组员候选专家');
      else setToast(`已生成 ${candidates.length} 名组员候选人（3倍规则）`);
    }, 600);
  };

  const handleConfirmMembers = () => {
    if (!ledger) return;
    if (selectedMemberIds.length < needMembers) { setToast(`还需选择 ${needMembers - selectedMemberIds.length} 名组员`); return; }
    setMembers(ledger.id, selectedMemberIds);
    updateLedger(ledger.id, { status: 'PENDING_BATCH' });
    setToast('组员已确定并保存');
  };

  const handleSupplement = () => {
    if (!ledger) return;
    setExtracting(true);
    setTimeout(() => {
      const alreadyInPool = new Set(memberCandidates.map((e) => e.id));
      const alreadySelected = new Set(selectedMemberIds);
      const supplement = extractSupplementCandidates(
        db.experts,
        {
          applicantName: ledger.applicant_name,
          licenseItemName: ledger.license_item_name,
          totalNeeded: ledger.total_experts_needed,
          excludeExpertIds: [ledger.leader_id],
        },
        Array.from(alreadyInPool),
        Array.from(alreadySelected),
      );
      setMemberCandidates((prev) => [...prev, ...supplement]);
      setExtracting(false);
      if (supplement.length === 0) setToast('已无更多可补抽的候选专家');
      else setToast(`已补抽 ${supplement.length} 名候选专家`);
    }, 500);
  };

  const toggleMember = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleConfirmObserver = (observerId: string) => {
    if (!ledger) return;
    updateLedger(ledger.id, { observer_id: observerId });
    setToast('观察员已选定');
  };

  const handleSaveBatch = () => {
    if (!ledger) return;
    const code = `${batchYear}-${String(batchSeq).padStart(3, '0')}`;
    updateLedger(ledger.id, {
      batch_year: batchYear,
      batch_seq: batchSeq,
      review_batch: code,
      status: 'PENDING_RESULT',
    });
    setToast(`批次已确定：${code}`);
  };

  if (!ledger) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <UserCheck size={48} className="mb-3" />
        <p className="text-sm">请从评审台账列表中选择一条记录进入流程</p>
      </div>
    );
  }

  const leaderExpert = db.experts.find((e) => e.id === ledger.leader_id);
  const observer = db.observers.find((o) => o.id === ledger.observer_id);
  const confirmedMembers = getMembers(ledger.id).map((m) => db.experts.find((e) => e.id === m.expert_id)).filter(Boolean) as Expert[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">组建评审专家组</h2>
          <p className="text-sm text-slate-500">
            {ledger.applicant_name} · {ledger.license_item_name}
          </p>
        </div>
        <Badge color={LEDGER_STATUS_COLORS[ledger.status]}>{LEDGER_STATUS_LABELS[ledger.status]}</Badge>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm overflow-x-auto">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = step === s.num;
          const done = step > s.num;
          return (
            <div key={s.num} className="flex items-center flex-1 min-w-0">
              <button
                onClick={() => setStep(s.num)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 transition ${
                  active ? 'text-sky-700' : done ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition ${
                  active ? 'border-sky-500 bg-sky-50' : done ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300'
                }`}>
                  <Icon size={16} />
                </div>
                <span className="text-sm font-medium whitespace-nowrap">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && <ChevronRight size={18} className="mx-1 text-slate-300" />}
            </div>
          );
        })}
      </div>

      {/* Step 1: Review application info */}
      {step === 1 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">评审申报信息</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoCard label="申请人名称" value={ledger.applicant_name} />
            <InfoCard label="许可类型" value={ledger.license_type} />
            <InfoCard label="许可事项" value={ledger.license_item_name} />
            <InfoCard label="评审方式" value={ledger.review_method} />
            <InfoCard label="申请次数" value={String(ledger.apply_count)} />
            <InfoCard label="专家组人数" value={String(ledger.total_experts_needed)} />
            <InfoCard label="评审起始日期" value={ledger.start_date} />
            <InfoCard label="评审结束日期" value={ledger.end_date} />
            <InfoCard label="当前状态" value={LEDGER_STATUS_LABELS[ledger.status]} />
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={() => setStep(2)}>下一步：专家抽取 <ChevronRight size={16} /></Button>
          </div>
        </div>
      )}

      {/* Step 2: Expert extraction */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Leader section */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Crown size={20} className="text-amber-500" />
                <h3 className="text-lg font-semibold text-slate-800">专家组长抽取</h3>
              </div>
              <div className="flex items-center gap-2">
                {leaderExpert && <Badge color="bg-emerald-100 text-emerald-700 border-emerald-200">已确定：{leaderExpert.name}</Badge>}
                <Button size="sm" variant="secondary" onClick={handleExtractLeader} disabled={extracting}>
                  {extracting ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  {hasExtractedLeader ? '重新抽取' : '开始抽取'}
                </Button>
              </div>
            </div>
            <div className="mb-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-xs text-amber-700 flex items-center gap-2">
              <AlertCircle size={14} />
              候选池规则：目标1人，生成3名候选人；不足3人则全部纳入
            </div>
            {leaderCandidates.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-2 text-left font-medium text-slate-600 w-10">选择</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-600">姓名</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-600">工作单位</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-600">职称</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-600">手机</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-600">资格</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderCandidates.map((e) => (
                      <tr key={e.id} className={`border-b border-slate-100 hover:bg-sky-50/40 ${selectedLeaderId === e.id ? 'bg-sky-50' : ''}`}>
                        <td className="px-4 py-3">
                          <input type="radio" checked={selectedLeaderId === e.id} onChange={() => setSelectedLeaderId(e.id)} />
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">{e.name}</td>
                        <td className="px-4 py-3 text-slate-600">{e.work_unit}</td>
                        <td className="px-4 py-3 text-slate-600">{e.title}</td>
                        <td className="px-4 py-3 text-slate-600">{e.mobile}</td>
                        <td className="px-4 py-3"><Badge color="bg-sky-100 text-sky-700 border-sky-200">组长</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-8 text-center">点击"开始抽取"生成组长候选人列表</p>
            )}
            {leaderCandidates.length > 0 && (
              <div className="mt-4 flex justify-end">
                <Button size="sm" onClick={handleConfirmLeader} disabled={!selectedLeaderId}>
                  <Check size={16} /> 确定组长
                </Button>
              </div>
            )}
          </div>

          {/* Members section */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-sky-500" />
                <h3 className="text-lg font-semibold text-slate-800">组员抽取</h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge color="bg-slate-100 text-slate-600 border-slate-200">
                  已选 {selectedMemberIds.length} / 需求 {needMembers}
                </Badge>
                {hasExtractedMembers && selectedMemberIds.length < needMembers && (
                  <Button size="sm" variant="success" onClick={handleSupplement} disabled={extracting}>
                    <RefreshCw size={16} /> 补抽
                  </Button>
                )}
                <Button size="sm" variant="secondary" onClick={handleExtractMembers} disabled={extracting || !ledger.leader_id}>
                  {extracting ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  {hasExtractedMembers ? '重新抽取' : '开始抽取'}
                </Button>
              </div>
            </div>
            <div className="mb-3 rounded-lg bg-sky-50 border border-sky-200 px-4 py-2 text-xs text-sky-700 flex items-center gap-2">
              <AlertCircle size={14} />
              候选池规则：需求 N={needMembers} 人，候选池 3N={3 * needMembers} 人；不足则全部纳入。排除同单位及已选定组长。
            </div>
            {memberCandidates.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0">
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-2 text-left font-medium text-slate-600 w-10">勾选</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-600">姓名</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-600">工作单位</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-600">职称</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-600">手机</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-600">资格</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberCandidates.map((e) => (
                      <tr key={e.id} className={`border-b border-slate-100 hover:bg-sky-50/40 ${selectedMemberIds.includes(e.id) ? 'bg-sky-50' : ''}`}>
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={selectedMemberIds.includes(e.id)} onChange={() => toggleMember(e.id)} />
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">{e.name}</td>
                        <td className="px-4 py-3 text-slate-600">{e.work_unit}</td>
                        <td className="px-4 py-3 text-slate-600">{e.title}</td>
                        <td className="px-4 py-3 text-slate-600">{e.mobile}</td>
                        <td className="px-4 py-3">
                          <Badge color="bg-slate-100 text-slate-600 border-slate-200">{e.qualifications[Object.keys(e.qualifications).find(k => e.qualifications[k as keyof typeof e.qualifications]) as keyof typeof e.qualifications] || '组员'}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-8 text-center">{ledger.leader_id ? '点击"开始抽取"生成组员候选人列表' : '请先确定专家组长'}</p>
            )}
            {memberCandidates.length > 0 && (
              <div className="mt-4 flex justify-end">
                <Button size="sm" onClick={handleConfirmMembers} disabled={selectedMemberIds.length < needMembers}>
                  <Check size={16} /> 确定组员（{selectedMemberIds.length}/{needMembers}）
                </Button>
              </div>
            )}
          </div>

          {/* Summary */}
          {(leaderExpert || confirmedMembers.length > 0) && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
              <h4 className="mb-3 text-sm font-semibold text-emerald-800">已选定专家组</h4>
              <div className="flex flex-wrap gap-2">
                {leaderExpert && (
                  <Badge color="bg-amber-100 text-amber-800 border-amber-200">
                    <Crown size={12} className="mr-1" /> 组长：{leaderExpert.name}
                  </Badge>
                )}
                {confirmedMembers.map((m) => (
                  <Badge key={m.id} color="bg-sky-100 text-sky-700 border-sky-200">组员：{m.name}</Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep(1)}><ChevronLeft size={16} /> 上一步</Button>
            <Button onClick={() => setStep(3)} disabled={!ledger.leader_id || confirmedMembers.length < needMembers}>
              下一步：选定观察员 <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Observer selection */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Eye size={20} className="text-indigo-500" />
              <h3 className="text-lg font-semibold text-slate-800">选定观察员</h3>
            </div>
            {observer && (
              <div className="mb-4 rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-2 text-sm text-indigo-700">
                已选定观察员：<span className="font-semibold">{observer.name}</span>（{observer.unit}）
              </div>
            )}
            <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0">
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-2 text-left font-medium text-slate-600 w-10">选择</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-600">姓名</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-600">地区</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-600">单位</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-600">部门</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-600">职位</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-600">手机号</th>
                  </tr>
                </thead>
                <tbody>
                  {db.observers.map((o) => (
                    <tr key={o.id} className={`border-b border-slate-100 hover:bg-indigo-50/40 ${(ledger.observer_id === o.id) ? 'bg-indigo-50' : ''}`}>
                      <td className="px-4 py-3">
                        <input type="radio" checked={ledger.observer_id === o.id} onChange={() => handleConfirmObserver(o.id)} />
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{o.name}</td>
                      <td className="px-4 py-3 text-slate-600">{o.region}</td>
                      <td className="px-4 py-3 text-slate-600">{o.unit}</td>
                      <td className="px-4 py-3 text-slate-600">{o.department}</td>
                      <td className="px-4 py-3 text-slate-600">{o.position}</td>
                      <td className="px-4 py-3 text-slate-600">{o.mobile}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep(2)}><ChevronLeft size={16} /> 上一步</Button>
            <Button onClick={() => setStep(4)} disabled={!ledger.observer_id}>
              下一步：确定批次 <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Batch determination */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={20} className="text-emerald-500" />
              <h3 className="text-lg font-semibold text-slate-800">确定评审批次</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 max-w-xl">
              <Field label="批次年份">
                <Input value={batchYear} onChange={(e) => setBatchYear(e.target.value)} />
              </Field>
              <Field label="批序号">
                <Input type="number" value={batchSeq} onChange={(e) => setBatchSeq(Number(e.target.value))} />
              </Field>
              <Field label="批次编号（预览）">
                <Input value={`${batchYear}-${String(batchSeq).padStart(3, '0')}`} readOnly className="bg-slate-50 font-mono" />
              </Field>
            </div>
            <div className="mt-6">
              <Button onClick={handleSaveBatch} disabled={ledger.status === 'PENDING_RESULT' || ledger.status === 'COMPLETED'}>
                <Check size={16} /> 保存批次并推进至结果录入
              </Button>
            </div>
          </div>

          {/* Final summary */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h4 className="mb-4 text-sm font-semibold text-slate-700">专家组完整信息</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                <Crown size={18} className="text-amber-600 mt-0.5" />
                <div>
                  <p className="text-xs text-amber-600">专家组长</p>
                  <p className="text-sm font-medium text-slate-800">{leaderExpert ? `${leaderExpert.name} · ${leaderExpert.work_unit}` : '未选定'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-sky-50 border border-sky-100">
                <Users size={18} className="text-sky-600 mt-0.5" />
                <div>
                  <p className="text-xs text-sky-600">专家组成员（{confirmedMembers.length}人）</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {confirmedMembers.map((m) => (
                      <span key={m.id} className="text-sm text-slate-700">{m.name}（{m.work_unit}）</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                <Eye size={18} className="text-indigo-600 mt-0.5" />
                <div>
                  <p className="text-xs text-indigo-600">观察员</p>
                  <p className="text-sm font-medium text-slate-800">{observer ? `${observer.name} · ${observer.unit}` : '未选定'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-start">
            <Button variant="secondary" onClick={() => setStep(3)}><ChevronLeft size={16} /> 上一步</Button>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value || '—'}</p>
    </div>
  );
}
