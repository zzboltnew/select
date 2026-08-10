import { useMemo, useState } from 'react';
import { BarChart3, CheckCircle2, ClipboardList, Clock3, Search, Users } from 'lucide-react';
import { useDB } from '@/store/db';
import { Badge, Select } from '@/components/ui';
import { DataTable, type Column } from '@/components/DataTable';
import { LEDGER_STATUS_COLORS, LEDGER_STATUS_LABELS, type LedgerStatus, type ReviewLedger } from '@/types';

export default function DashboardPage() {
  const { db, getMembers } = useDB();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [result, setResult] = useState('');

  const expertName = (id: string) => db.experts.find((expert) => expert.id === id)?.name ?? '';
  const observerName = (id: string) => db.observers.find((observer) => observer.id === id)?.name ?? '';
  const memberNames = (ledger: ReviewLedger) => getMembers(ledger.id).map((member) => expertName(member.expert_id)).join('、');
  const searchableText = (ledger: ReviewLedger) => [
    ledger.applicant_name, ledger.license_type, ledger.apply_count, ledger.license_item_name,
    ledger.review_method, ledger.start_date, ledger.end_date, ledger.total_experts_needed,
    ledger.review_batch, LEDGER_STATUS_LABELS[ledger.status], ledger.review_result,
    ledger.publicity_batch, ledger.publicity_start_date, ledger.publicity_end_date,
    ledger.cert_number, ledger.cert_expire_date, ledger.gov_accept_no, ledger.gov_permit_no,
    expertName(ledger.leader_id), memberNames(ledger), observerName(ledger.observer_id), ledger.remarks,
  ].join(' ').toLowerCase();

  const filtered = useMemo(() => db.review_ledgers.filter((ledger) => {
    const matchesQuery = !query.trim() || searchableText(ledger).includes(query.trim().toLowerCase());
    return matchesQuery && (!status || ledger.status === status) && (!result || ledger.review_result === result);
  }), [db.review_ledgers, query, status, result]);

  const statusStats = (Object.keys(LEDGER_STATUS_LABELS) as LedgerStatus[]).map((key) => ({ key, label: LEDGER_STATUS_LABELS[key], count: db.review_ledgers.filter((ledger) => ledger.status === key).length }));
  const resultStats = ['通过', '不通过', '终止'].map((label) => ({ label, count: db.review_ledgers.filter((ledger) => ledger.review_result === label).length }));
  const completed = db.review_ledgers.filter((ledger) => ledger.status === 'COMPLETED').length;
  const assigned = db.review_ledgers.filter((ledger) => ledger.leader_id || getMembers(ledger.id).length > 0).length;
  const batchStats = Object.entries(db.review_ledgers.reduce<Record<string, number>>((acc, ledger) => {
    const key = ledger.review_batch || '未设置批次';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const columns: Column<ReviewLedger>[] = [
    { key: 'applicant_name', label: '申请人名称', sortable: true, render: (ledger) => <span className="font-medium text-slate-800">{ledger.applicant_name}</span> },
    { key: 'license_type', label: '许可类型' },
    { key: 'apply_count', label: '申请次数' },
    { key: 'license_item_name', label: '许可事项名称' },
    { key: 'review_method', label: '评审方式' },
    { key: 'start_date', label: '评审起始日期' },
    { key: 'end_date', label: '评审结束日期' },
    { key: 'total_experts_needed', label: '专家组总人数' },
    { key: 'review_batch', label: '评审批次' },
    { key: 'status', label: '状态', render: (ledger) => <Badge color={LEDGER_STATUS_COLORS[ledger.status]}>{LEDGER_STATUS_LABELS[ledger.status]}</Badge> },
    { key: 'review_result', label: '评审结果' },
    { key: 'publicity_batch', label: '公示批次' },
    { key: 'publicity_start_date', label: '公示起始日期' },
    { key: 'publicity_end_date', label: '公示结束日期' },
    { key: 'cert_number', label: '证书编号' },
    { key: 'cert_expire_date', label: '证书有效截止日期' },
    { key: 'gov_accept_no', label: '政务网受理号' },
    { key: 'gov_permit_no', label: '政务网许可案号' },
    { key: 'leader_id', label: '专家组长', render: (ledger) => expertName(ledger.leader_id) || '—' },
    { key: 'member_names', label: '专家组成员', render: (ledger) => memberNames(ledger) || '—' },
    { key: 'observer_id', label: '观察员', render: (ledger) => observerName(ledger.observer_id) || '—' },
  ];

  return <div className="space-y-6">
    <div><h2 className="text-xl font-bold text-slate-800">评审数据驾驶舱</h2><p className="text-sm text-slate-500">从全量评审台账中搜索、分析和掌握业务进展</p></div>
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {[
        { label: '台账总数', value: db.review_ledgers.length, icon: ClipboardList, color: 'text-sky-600 bg-sky-50' },
        { label: '已组建专家组', value: assigned, icon: Users, color: 'text-emerald-600 bg-emerald-50' },
        { label: '已完成评审', value: completed, icon: CheckCircle2, color: 'text-amber-600 bg-amber-50' },
        { label: '待处理台账', value: db.review_ledgers.length - completed, icon: Clock3, color: 'text-orange-600 bg-orange-50' },
      ].map(({ label, value, icon: Icon, color }) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${color}`}><Icon size={19} /></div><p className="text-2xl font-bold text-slate-800">{value}</p><p className="text-sm text-slate-500">{label}</p></div>)}
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-sky-600" /><h3 className="font-semibold text-slate-800">流程状态分布</h3></div><div className="space-y-3">{statusStats.map((item) => <div key={item.key}><div className="mb-1 flex justify-between text-xs text-slate-600"><span>{item.label}</span><span>{item.count}</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-sky-500 transition-all" style={{ width: `${db.review_ledgers.length ? `${(item.count / db.review_ledgers.length) * 100}%` : '0%'}` }} /></div></div>)}</div></div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-emerald-600" /><h3 className="font-semibold text-slate-800">评审结果与批次</h3></div><div className="grid grid-cols-3 gap-3">{resultStats.map((item) => <div key={item.label} className="rounded-lg bg-slate-50 p-3 text-center"><p className="text-xl font-bold text-slate-800">{item.count}</p><p className="text-xs text-slate-500">{item.label}</p></div>)}</div><div className="mt-4 space-y-2">{batchStats.length ? batchStats.map(([batch, count]) => <div key={batch} className="flex items-center justify-between text-sm"><span className="font-mono text-slate-600">{batch}</span><span className="font-semibold text-slate-800">{count} 条</span></div>) : <p className="text-sm text-slate-400">暂无批次数据</p>}</div></div>
    </div>
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center"><div className="relative flex-1"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索申请人、批次、许可事项、日期、专家、政务编号等全部字段" className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-sky-500" /></div><Select value={status} onChange={(e) => setStatus(e.target.value)} className="lg:w-40"><option value="">全部状态</option>{(Object.keys(LEDGER_STATUS_LABELS) as LedgerStatus[]).map((key) => <option key={key} value={key}>{LEDGER_STATUS_LABELS[key]}</option>)}</Select><Select value={result} onChange={(e) => setResult(e.target.value)} className="lg:w-32"><option value="">全部结果</option>{['通过', '不通过', '终止'].map((value) => <option key={value} value={value}>{value}</option>)}</Select></div>
      <div className="p-4"><p className="mb-3 text-sm text-slate-500">当前展示 {filtered.length} / {db.review_ledgers.length} 条台账</p><DataTable rows={filtered} columns={columns} searchFields={['applicant_name']} getRowId={(ledger) => ledger.id} /></div>
    </div>
  </div>;
}
