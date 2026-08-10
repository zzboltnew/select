import * as XLSX from 'xlsx';
import type {
  Expert,
  InstitutionCertificate,
  Observer,
  BaseDictionaryItem,
  Qualifications,
} from '@/types';
import { QUALIFICATION_KEYS } from '@/types';
import { uuid } from '@/data/mockData';
import type { ReviewLedgerMember } from '@/types';

// ============ Column definitions per table ============

export const EXPERT_COLUMNS: { key: keyof Expert; label: string; type: 'string' | 'number' | 'boolean' }[] = [
  { key: 'seq_no', label: '序号', type: 'number' },
  { key: 'is_enabled', label: '是否启用', type: 'boolean' },
  { key: 'region', label: '专家区域', type: 'string' },
  { key: 'name', label: '姓名', type: 'string' },
  { key: 'work_unit', label: '工作单位', type: 'string' },
  { key: 'post_status', label: '岗位状态', type: 'string' },
  { key: 'unit_location', label: '单位所在地', type: 'string' },
  { key: 'title', label: '职称', type: 'string' },
  { key: 'is_leader_qualified', label: '是否担任组长', type: 'boolean' },
  { key: 'id_card', label: '身份证号', type: 'string' },
  { key: 'gender', label: '性别', type: 'string' },
  { key: 'birth_year', label: '出生年份', type: 'number' },
  { key: 'education', label: '学历', type: 'string' },
  { key: 'position', label: '职务', type: 'string' },
  { key: 'phone', label: '电话', type: 'string' },
  { key: 'mobile', label: '手机', type: 'string' },
  { key: 'email', label: '电子邮箱', type: 'string' },
  { key: 'address', label: '通讯地址', type: 'string' },
  { key: 'postcode', label: '邮编', type: 'string' },
  { key: 'remarks', label: '备注', type: 'string' },
];

function qualColumns(): { key: string; label: string }[] {
  return QUALIFICATION_KEYS.map((qk) => ({ key: `qual_${qk.key}`, label: qk.label }));
}

export const INSTITUTION_COLUMNS: { key: keyof InstitutionCertificate; label: string; type: 'string' }[] = [
  { key: 'name', label: '名称', type: 'string' },
  { key: 'province', label: '省', type: 'string' },
  { key: 'nature', label: '机构性质', type: 'string' },
  { key: 'qualification_type', label: '资质类型', type: 'string' },
  { key: 'cert_no', label: '证书编号', type: 'string' },
  { key: 'issuing_unit', label: '颁布单位', type: 'string' },
  { key: 'issue_date', label: '获取日期', type: 'string' },
  { key: 'valid_date_range', label: '有效起止日期', type: 'string' },
  { key: 'eval_date', label: '评定日期', type: 'string' },
  { key: 'renew_date', label: '换证日期', type: 'string' },
  { key: 'legal_person', label: '法人', type: 'string' },
  { key: 'admin_head', label: '行政负责人', type: 'string' },
  { key: 'tech_head', label: '技术负责人', type: 'string' },
  { key: 'quality_head', label: '质量负责人', type: 'string' },
  { key: 'phone', label: '联系电话', type: 'string' },
  { key: 'address', label: '地址', type: 'string' },
  { key: 'postcode', label: '邮编', type: 'string' },
  { key: 'status', label: '证书状态', type: 'string' },
];

export const OBSERVER_COLUMNS: { key: keyof Observer; label: string; type: 'string' }[] = [
  { key: 'name', label: '姓名', type: 'string' },
  { key: 'region', label: '地区', type: 'string' },
  { key: 'unit', label: '单位', type: 'string' },
  { key: 'department', label: '部门', type: 'string' },
  { key: 'position', label: '职位', type: 'string' },
  { key: 'mobile', label: '手机号', type: 'string' },
];

export const BASE_DICT_COLUMNS: { key: keyof BaseDictionaryItem; label: string; type: 'string' }[] = [
  { key: 'name', label: '名称', type: 'string' },
];

import type { ReviewLedger, LedgerStatus, ReviewResult } from '@/types';
import { LEDGER_STATUS_LABELS } from '@/types';

export const LEDGER_COLUMNS: { key: keyof ReviewLedger | '_leader_name' | '_member_names' | '_observer_name'; label: string; type: 'string' | 'number' }[] = [
  { key: 'applicant_name', label: '申请人名称', type: 'string' },
  { key: 'license_type', label: '许可类型', type: 'string' },
  { key: 'apply_count', label: '申请次数', type: 'number' },
  { key: 'license_item_name', label: '许可事项名称', type: 'string' },
  { key: 'review_method', label: '评审方式', type: 'string' },
  { key: 'start_date', label: '评审起始日期', type: 'string' },
  { key: 'end_date', label: '评审结束日期', type: 'string' },
  { key: 'total_experts_needed', label: '专家组总人数', type: 'number' },
  { key: 'batch_year', label: '批次年份', type: 'string' },
  { key: 'batch_seq', label: '批序号', type: 'number' },
  { key: 'review_batch', label: '评审批次', type: 'string' },
  { key: 'status', label: '状态', type: 'string' },
  { key: 'review_result', label: '评审结果', type: 'string' },
  { key: 'publicity_batch_year', label: '公示批次年份', type: 'string' },
  { key: 'publicity_batch_seq', label: '公示批序号', type: 'number' },
  { key: 'publicity_batch', label: '公示批次', type: 'string' },
  { key: 'publicity_start_date', label: '公示起始日期', type: 'string' },
  { key: 'publicity_end_date', label: '公示结束日期', type: 'string' },
  { key: 'cert_number', label: '证书编号', type: 'string' },
  { key: 'cert_expire_date', label: '证书有效截止日期', type: 'string' },
  { key: 'gov_accept_no', label: '政务网受理号', type: 'string' },
  { key: 'gov_permit_no', label: '政务网许可案号', type: 'string' },
  { key: '_leader_name', label: '专家组长', type: 'string' },
  { key: '_member_names', label: '专家组成员', type: 'string' },
  { key: '_observer_name', label: '观察员', type: 'string' },
  { key: 'remarks', label: '备注', type: 'string' },
];

// ============ Browser-native download helper ============
//
// XLSX.writeFile() relies on Node's `fs` module, which is stubbed to `false`
// by the xlsx package's browser field. In the browser we must serialize the
// workbook to an ArrayBuffer via XLSX.write(), wrap it in a Blob, and trigger
// a download through a dynamically created <a> element with an object URL.

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function downloadBlob(data: BlobPart, filename: string, mime: string) {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  // Cleanup: revoke the object URL and remove the anchor on the next tick so
  // the browser has a chance to initiate the navigation/download.
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 0);
}

function downloadWorkbook(wb: XLSX.WorkBook, filename: string) {
  const arr = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  downloadBlob(arr, filename, XLSX_MIME);
}

// ============ Export to Excel ============

function expertToRow(e: Expert): Record<string, any> {
  const row: Record<string, any> = {};
  for (const c of EXPERT_COLUMNS) {
    if (c.type === 'boolean') {
      row[c.label] = (e as any)[c.key] ? '是' : '否';
    } else {
      row[c.label] = (e as any)[c.key] ?? '';
    }
  }
  for (const qc of qualColumns()) {
    const qkey = qc.key.replace('qual_', '') as keyof Qualifications;
    row[qc.label] = e.qualifications[qkey] ?? '';
  }
  return row;
}

function rowToExpert(row: Record<string, any>): Omit<Expert, 'id'> {
  const e: any = { qualifications: {} };
  for (const c of EXPERT_COLUMNS) {
    const val = row[c.label];
    if (c.type === 'boolean') {
      e[c.key] = val === '是' || val === 'true' || val === true;
    } else if (c.type === 'number') {
      e[c.key] = val !== '' && val != null ? Number(val) : 0;
    } else {
      e[c.key] = val ?? '';
    }
  }
  for (const qc of qualColumns()) {
    const qkey = qc.key.replace('qual_', '') as keyof Qualifications;
    e.qualifications[qkey] = (row[qc.label] as any) ?? '';
  }
  return e as Omit<Expert, 'id'>;
}

export function exportExperts(experts: Expert[], filename = '专家库.xlsx') {
  const rows = experts.map(expertToRow);
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '专家库');
  downloadWorkbook(wb, filename);
}

export function exportInstitutions(items: InstitutionCertificate[], filename = '机构证书库.xlsx') {
  const rows = items.map((item) => {
    const row: Record<string, any> = {};
    for (const c of INSTITUTION_COLUMNS) row[c.label] = (item as any)[c.key] ?? '';
    return row;
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '机构证书库');
  downloadWorkbook(wb, filename);
}

export function exportObservers(items: Observer[], filename = '观察员库.xlsx') {
  const rows = items.map((item) => {
    const row: Record<string, any> = {};
    for (const c of OBSERVER_COLUMNS) row[c.label] = (item as any)[c.key] ?? '';
    return row;
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '观察员库');
  downloadWorkbook(wb, filename);
}

export function exportBaseDict(items: BaseDictionaryItem[], filename: string, sheetName: string) {
  const rows = items.map((item) => {
    const row: Record<string, any> = {};
    for (const c of BASE_DICT_COLUMNS) row[c.label] = (item as any)[c.key] ?? '';
    return row;
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  downloadWorkbook(wb, filename);
}

// ============ Template generation ============

export function downloadExpertTemplate() {
  const headers: Record<string, string> = {};
  for (const c of EXPERT_COLUMNS) headers[c.label] = '';
  for (const qc of qualColumns()) headers[qc.label] = '';
  const ws = XLSX.utils.json_to_sheet([headers], { header: Object.keys(headers) });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '专家库模板');
  downloadWorkbook(wb, '专家库导入模板.xlsx');
}

export function downloadInstitutionTemplate() {
  const headers: Record<string, string> = {};
  for (const c of INSTITUTION_COLUMNS) headers[c.label] = '';
  const ws = XLSX.utils.json_to_sheet([headers], { header: Object.keys(headers) });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '机构证书库模板');
  downloadWorkbook(wb, '机构证书库导入模板.xlsx');
}

export function downloadObserverTemplate() {
  const headers: Record<string, string> = {};
  for (const c of OBSERVER_COLUMNS) headers[c.label] = '';
  const ws = XLSX.utils.json_to_sheet([headers], { header: Object.keys(headers) });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '观察员库模板');
  downloadWorkbook(wb, '观察员库导入模板.xlsx');
}

export function downloadBaseDictTemplate(sheetName: string, filename: string) {
  const headers: Record<string, string> = {};
  for (const c of BASE_DICT_COLUMNS) headers[c.label] = '';
  const ws = XLSX.utils.json_to_sheet([headers], { header: Object.keys(headers) });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  downloadWorkbook(wb, filename);
}

// ============ Import from Excel ============

export function parseExcelFile(file: File): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function rowsToExperts(rows: Record<string, any>[]): Expert[] {
  return rows.map((row) => {
    const base = rowToExpert(row);
    return { ...base, id: uuid() } as Expert;
  });
}

export function rowsToInstitutions(rows: Record<string, any>[]): InstitutionCertificate[] {
  return rows.map((row) => {
    const item: any = { id: uuid() };
    for (const c of INSTITUTION_COLUMNS) item[c.key] = row[c.label] ?? '';
    return item as InstitutionCertificate;
  });
}

export function rowsToObservers(rows: Record<string, any>[]): Observer[] {
  return rows.map((row) => {
    const item: any = { id: uuid() };
    for (const c of OBSERVER_COLUMNS) item[c.key] = row[c.label] ?? '';
    return item as Observer;
  });
}

export function rowsToBaseDict(rows: Record<string, any>[]): BaseDictionaryItem[] {
  return rows.map((row) => {
    const item: any = { id: uuid() };
    for (const c of BASE_DICT_COLUMNS) item[c.key] = row[c.label] ?? '';
    return item as BaseDictionaryItem;
  });
}

// ============ Data preview / copy helpers ============
//
// Fallback path: if the blob download is blocked by a popup blocker or
// browser policy, the user can open a preview modal and copy the raw data
// (JSON / CSV) to paste into a file manually.

export type PreviewFormat = 'json' | 'csv';

export function toCSV(rows: Record<string, any>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    const s = String(v ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','));
  }
  // Prepend BOM so Excel opens UTF-8 CSV correctly
  return '\uFEFF' + lines.join('\n');
}

export function downloadJSON(data: unknown, filename: string) {
  const json = JSON.stringify(data, null, 2);
  downloadBlob(json, filename, 'application/json;charset=utf-8');
}

export function downloadCSV(rows: Record<string, any>[], filename: string) {
  const csv = toCSV(rows);
  downloadBlob(csv, filename, 'text/csv;charset=utf-8');
}

export function downloadText(text: string, filename: string, mime = 'text/plain;charset=utf-8') {
  downloadBlob(text, filename, mime);
}

// ============ Review Ledger export / template / import ============

export function exportLedgers(
  items: ReviewLedger[],
  experts: Expert[],
  observers: Observer[],
  members: ReviewLedgerMember[],
  filename = '评审台账.xlsx',
) {
  const rows = items.map((item) => {
    const row: Record<string, any> = {};
    for (const c of LEDGER_COLUMNS) {
      if (c.key === 'status') {
        row[c.label] = LEDGER_STATUS_LABELS[item.status] ?? item.status;
      } else if (c.key === '_leader_name') {
        row[c.label] = experts.find((e) => e.id === item.leader_id)?.name ?? '';
      } else if (c.key === '_member_names') {
        row[c.label] = members
          .filter((m) => m.review_ledger_id === item.id)
          .map((m) => experts.find((e) => e.id === m.expert_id)?.name ?? '')
          .filter(Boolean)
          .join('、');
      } else if (c.key === '_observer_name') {
        row[c.label] = observers.find((o) => o.id === item.observer_id)?.name ?? '';
      } else {
        row[c.label] = (item as any)[c.key] ?? '';
      }
    }
    return row;
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '评审台账');
  downloadWorkbook(wb, filename);
}

export function downloadLedgerTemplate() {
  const headers: Record<string, string> = {};
  for (const c of LEDGER_COLUMNS) headers[c.label] = '';
  const ws = XLSX.utils.json_to_sheet([headers], { header: Object.keys(headers) });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '评审台账模板');
  downloadWorkbook(wb, '评审台账导入模板.xlsx');
}

export interface LedgerImportResult {
  ledgers: ReviewLedger[];
  members: ReviewLedgerMember[];
}

export function rowsToLedgers(
  rows: Record<string, any>[],
  experts: Expert[],
  observers: Observer[],
): LedgerImportResult {
  const statusReverse: Record<string, LedgerStatus> = {};
  for (const [k, v] of Object.entries(LEDGER_STATUS_LABELS)) {
    statusReverse[v] = k as LedgerStatus;
  }
  const allMembers: ReviewLedgerMember[] = [];
  const ledgers = rows.map((row) => {
    const ledgerId = uuid();
    const item: any = {
      id: ledgerId,
      leader_id: '',
      observer_id: '',
      review_batch: '',
      publicity_batch: '',
      remarks: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    for (const c of LEDGER_COLUMNS) {
      const val = row[c.label];
      if (c.key === '_leader_name') {
        const ex = experts.find((e) => e.name === (val ?? '').trim());
        item.leader_id = ex?.id ?? '';
      } else if (c.key === '_member_names') {
        const names = String(val ?? '')
          .split(/[、,，;；\n]/)
          .map((s) => s.trim())
          .filter(Boolean);
        for (const name of names) {
          const ex = experts.find((e) => e.name === name);
          if (ex) {
            allMembers.push({ id: uuid(), review_ledger_id: ledgerId, expert_id: ex.id, role: 'MEMBER' });
          }
        }
      } else if (c.key === '_observer_name') {
        const ob = observers.find((o) => o.name === (val ?? '').trim());
        item.observer_id = ob?.id ?? '';
      } else if (c.type === 'number') {
        item[c.key] = val !== '' && val != null ? Number(val) : 0;
      } else if (c.key === 'status') {
        item[c.key] = (statusReverse[val] ?? 'PENDING_EXTRACT') as LedgerStatus;
      } else if (c.key === 'review_result') {
        item[c.key] = (val || '') as ReviewResult;
      } else {
        item[c.key] = val ?? '';
      }
    }
    // Auto-derive review_batch and publicity_batch from year+seq if provided
    if (item.batch_year && item.batch_seq) {
      item.review_batch = `${item.batch_year}-${String(item.batch_seq).padStart(3, '0')}`;
    }
    if (item.publicity_batch_year && item.publicity_batch_seq) {
      item.publicity_batch = `${item.publicity_batch_year}-${String(item.publicity_batch_seq).padStart(3, '0')}`;
    }
    return item as ReviewLedger;
  });
  return { ledgers, members: allMembers };
}
