// ============ Core Domain Types ============

export type QualificationRole = '组长' | '组员' | '';

export interface Qualifications {
  highway_bridge_tunnel?: QualificationRole; // 公路工程桥梁隧道工程专项
  highway_grade_b?: QualificationRole; // 公路工程乙级
  highway_grade_c?: QualificationRole; // 公路工程丙级
  waterway_material_b?: QualificationRole; // 水运工程材料乙级
  waterway_material_c?: QualificationRole; // 水运工程材料丙级
  waterway_structure_b?: QualificationRole; // 水运工程结构乙级
}

export interface Expert {
  id: string;
  seq_no: number;
  is_enabled: boolean;
  region: string;
  name: string;
  work_unit: string;
  post_status: string;
  unit_location: string;
  title: string;
  is_leader_qualified: boolean;
  qualifications: Qualifications;
  id_card: string;
  gender: string;
  birth_year: number;
  education: string;
  position: string;
  phone: string;
  mobile: string;
  email: string;
  address: string;
  postcode: string;
  remarks: string;
}

export interface InstitutionCertificate {
  id: string;
  name: string;
  province: string;
  nature: string;
  qualification_type: string;
  cert_no: string;
  issuing_unit: string;
  issue_date: string;
  valid_date_range: string;
  eval_date: string;
  renew_date: string;
  legal_person: string;
  admin_head: string;
  tech_head: string;
  quality_head: string;
  phone: string;
  address: string;
  postcode: string;
  status: string;
}

export interface Observer {
  id: string;
  name: string;
  region: string;
  unit: string;
  department: string;
  position: string;
  mobile: string;
}

export interface BaseDictionaryItem {
  id: string;
  name: string;
}

export type LedgerStatus =
  | 'PENDING_EXTRACT'
  | 'EXTRACTING'
  | 'PENDING_BATCH'
  | 'PENDING_RESULT'
  | 'COMPLETED';

export type ReviewResult = '' | '通过' | '终止' | '不通过';

export interface ReviewLedger {
  id: string;
  applicant_name: string;
  license_type: string;
  apply_count: number;
  license_item_name: string;
  review_method: string;
  start_date: string;
  end_date: string;
  total_experts_needed: number;
  leader_id: string;
  observer_id: string;
  batch_year: string;
  batch_seq: number;
  review_batch: string;
  status: LedgerStatus;
  review_result: ReviewResult;
  publicity_batch_year: string;
  publicity_batch_seq: number;
  publicity_batch: string;
  publicity_start_date: string;
  publicity_end_date: string;
  cert_number: string;
  cert_expire_date: string;
  gov_accept_no: string;
  gov_permit_no: string;
  remarks: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewLedgerMember {
  id: string;
  review_ledger_id: string;
  expert_id: string;
  role: string; // MEMBER
}

// ============ Qualification key metadata ============

export const QUALIFICATION_KEYS: { key: keyof Qualifications; label: string }[] = [
  { key: 'highway_bridge_tunnel', label: '公路工程桥梁隧道工程专项' },
  { key: 'highway_grade_b', label: '公路工程乙级' },
  { key: 'highway_grade_c', label: '公路工程丙级' },
  { key: 'waterway_material_b', label: '水运工程材料乙级' },
  { key: 'waterway_material_c', label: '水运工程材料丙级' },
  { key: 'waterway_structure_b', label: '水运工程结构乙级' },
];

export const LEDGER_STATUS_LABELS: Record<LedgerStatus, string> = {
  PENDING_EXTRACT: '待抽取',
  EXTRACTING: '抽取中',
  PENDING_BATCH: '待确定批次',
  PENDING_RESULT: '待录入结果',
  COMPLETED: '已结案',
};

export const LEDGER_STATUS_COLORS: Record<LedgerStatus, string> = {
  PENDING_EXTRACT: 'bg-amber-100 text-amber-800 border-amber-200',
  EXTRACTING: 'bg-blue-100 text-blue-800 border-blue-200',
  PENDING_BATCH: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  PENDING_RESULT: 'bg-purple-100 text-purple-800 border-purple-200',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

export const REVIEW_RESULT_OPTIONS: ReviewResult[] = ['通过', '终止', '不通过'];

// ============ DB Shape (persisted) ============

export interface AppDB {
  experts: Expert[];
  institution_certificates: InstitutionCertificate[];
  observers: Observer[];
  base_license_types: BaseDictionaryItem[];
  base_license_items: BaseDictionaryItem[];
  base_review_methods: BaseDictionaryItem[];
  review_ledgers: ReviewLedger[];
  review_ledger_members: ReviewLedgerMember[];
}
