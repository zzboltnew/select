import type {
  AppDB,
  Expert,
  InstitutionCertificate,
  Observer,
  BaseDictionaryItem,
  ReviewLedger,
  ReviewLedgerMember,
  Qualifications,
  QualificationRole,
} from '@/types';

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const REGIONS = ['北京市', '上海市', '广东省', '江苏省', '浙江省', '山东省', '四川省', '湖北省', '陕西省', '福建省'];
const TITLES = ['正高级工程师', '高级工程师', '高级工程师', '高级工程师', '工程师'];
const EDUCATIONS = ['博士研究生', '硕士研究生', '大学本科', '大学本科'];
const GENDERS = ['男', '男', '男', '女'];
const UNITS = [
  '中交公路规划设计院有限公司',
  '交通运输部公路科学研究院',
  '同济大学',
  '东南大学',
  '中交第一公路勘察设计研究院',
  '浙江省交通规划设计院',
  '广东省交通科学研究院',
  '上海市政工程设计研究总院',
  '长安大学',
  '河海大学',
  '中铁大桥勘测设计院',
  '中交水运规划设计院',
  '南京水利科学研究院',
  '武汉理工大学',
  '大连理工大学',
];
const POSTS = ['在职', '在职', '在职', '退休返聘'];
const POSITIONS = ['总工程师', '副总工程师', '主任工程师', '教授', '副教授', '部门负责人'];

const QUAL_KEYS: (keyof Qualifications)[] = [
  'highway_bridge_tunnel',
  'highway_grade_b',
  'highway_grade_c',
  'waterway_material_b',
  'waterway_material_c',
  'waterway_structure_b',
];

function genQualifications(): Qualifications {
  const q: Qualifications = {};
  for (const k of QUAL_KEYS) {
    const r = Math.random();
    if (r < 0.15) q[k] = '组长' as QualificationRole;
    else if (r < 0.5) q[k] = '组员' as QualificationRole;
    else q[k] = '' as QualificationRole;
  }
  return q;
}

const SURNAMES = ['王', '李', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴', '徐', '孙', '马', '朱', '胡', '林', '郭', '何', '高', '罗'];
const GIVEN_NAMES = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀英', '霞', '平', '刚', '桂英'];

function genName(): string {
  return pick(SURNAMES) + pick(GIVEN_NAMES);
}

function genIdCard(): string {
  let s = '110';
  for (let i = 0; i < 15; i++) s += randInt(0, 9);
  return s;
}

function genMobile(): string {
  const prefixes = ['138', '139', '136', '135', '137', '158', '159', '186', '188', '189'];
  let s = pick(prefixes);
  for (let i = 0; i < 8; i++) s += randInt(0, 9);
  return s;
}

function genExperts(count: number): Expert[] {
  const experts: Expert[] = [];
  for (let i = 0; i < count; i++) {
    const unit = pick(UNITS);
    experts.push({
      id: uuid(),
      seq_no: i + 1,
      is_enabled: Math.random() > 0.1,
      region: pick(REGIONS),
      name: genName(),
      work_unit: unit,
      post_status: pick(POSTS),
      unit_location: pick(REGIONS),
      title: pick(TITLES),
      is_leader_qualified: Math.random() > 0.4,
      qualifications: genQualifications(),
      id_card: genIdCard(),
      gender: pick(GENDERS),
      birth_year: randInt(1955, 1985),
      education: pick(EDUCATIONS),
      position: pick(POSITIONS),
      phone: '010-' + randInt(10000000, 99999999),
      mobile: genMobile(),
      email: `expert${i + 1}@example.com`,
      address: pick(REGIONS) + 'XX路' + randInt(1, 999) + '号',
      postcode: String(randInt(100000, 999999)),
      remarks: '',
    });
  }
  return experts;
}

const INSTITUTIONS = [
  { name: '中交公路规划设计院有限公司', province: '北京市', nature: '有限责任公司', qualification_type: '公路工程甲级' },
  { name: '浙江省交通规划设计院', province: '浙江省', nature: '事业单位', qualification_type: '公路工程乙级' },
  { name: '广东省交通科学研究院', province: '广东省', nature: '事业单位', qualification_type: '水运工程材料乙级' },
  { name: '上海市政工程设计研究总院', province: '上海市', nature: '国有企业', qualification_type: '公路工程甲级' },
  { name: '中交水运规划设计院有限公司', province: '北京市', nature: '有限责任公司', qualification_type: '水运工程结构乙级' },
  { name: '南京水利科学研究院', province: '江苏省', nature: '事业单位', qualification_type: '水运工程材料丙级' },
  { name: '中铁大桥勘测设计院', province: '湖北省', nature: '国有企业', qualification_type: '公路工程桥梁隧道工程专项' },
  { name: '福建省交通规划设计院', province: '福建省', nature: '事业单位', qualification_type: '公路工程丙级' },
];

function genInstitutionCerts(): InstitutionCertificate[] {
  return INSTITUTIONS.map((inst, i) => ({
    id: uuid(),
    name: inst.name,
    province: inst.province,
    nature: inst.nature,
    qualification_type: inst.qualification_type,
    cert_no: 'CERT-' + String(2026000 + i + 1),
    issuing_unit: '交通运输部',
    issue_date: `20${randInt(15, 22)}-0${randInt(1, 9)}-15`,
    valid_date_range: `2020-01-01 至 2028-12-31`,
    eval_date: `20${randInt(15, 22)}-06-01`,
    renew_date: `20${randInt(22, 25)}-01-01`,
    legal_person: genName(),
    admin_head: genName(),
    tech_head: genName(),
    quality_head: genName(),
    phone: '010-' + randInt(10000000, 99999999),
    address: inst.province + 'XX区XX路' + randInt(1, 999) + '号',
    postcode: String(randInt(100000, 999999)),
    status: '有效',
  }));
}

function genObservers(): Observer[] {
  const observers: Observer[] = [];
  for (let i = 0; i < 12; i++) {
    observers.push({
      id: uuid(),
      name: genName(),
      region: pick(REGIONS),
      unit: pick(UNITS),
      department: pick(['监管处', '审批处', '综合处', '技术处', '质量处']),
      position: pick(['处长', '副处长', '科长', '科员']),
      mobile: genMobile(),
    });
  }
  return observers;
}

function genBaseLicenseTypes(): BaseDictionaryItem[] {
  return [
    { id: uuid(), name: '公路工程' },
    { id: uuid(), name: '水运工程' },
    { id: uuid(), name: '桥梁工程' },
    { id: uuid(), name: '隧道工程' },
  ];
}

function genBaseLicenseItems(): BaseDictionaryItem[] {
  return [
    { id: uuid(), name: '公路工程桥梁隧道工程专项' },
    { id: uuid(), name: '公路工程乙级' },
    { id: uuid(), name: '公路工程丙级' },
    { id: uuid(), name: '水运工程材料乙级' },
    { id: uuid(), name: '水运工程材料丙级' },
    { id: uuid(), name: '水运工程结构乙级' },
  ];
}

function genBaseReviewMethods(): BaseDictionaryItem[] {
  return [
    { id: uuid(), name: '会议评审' },
    { id: uuid(), name: '函审' },
    { id: uuid(), name: '现场核查' },
    { id: uuid(), name: '专家会审' },
  ];
}

function genReviewLedgers(
  experts: Expert[],
  observers: Observer[],
  licenseTypes: BaseDictionaryItem[],
  licenseItems: BaseDictionaryItem[],
  reviewMethods: BaseDictionaryItem[],
): { ledgers: ReviewLedger[]; members: ReviewLedgerMember[] } {
  const ledgers: ReviewLedger[] = [];
  const members: ReviewLedgerMember[] = [];

  // A few sample ledgers in various states
  const samples: Array<Partial<ReviewLedger> & { status: ReviewLedger['status'] }> = [
    { applicant_name: '浙江省交通规划设计院', license_type: '公路工程', license_item_name: '公路工程乙级', review_method: '会议评审', total_experts_needed: 5, status: 'PENDING_EXTRACT' },
    { applicant_name: '广东省交通科学研究院', license_type: '水运工程', license_item_name: '水运工程材料乙级', review_method: '函审', total_experts_needed: 3, status: 'PENDING_EXTRACT' },
    { applicant_name: '福建省交通规划设计院', license_type: '公路工程', license_item_name: '公路工程丙级', review_method: '会议评审', total_experts_needed: 5, status: 'PENDING_RESULT' },
  ];

  samples.forEach((s, i) => {
    const id = uuid();
    const start = `2026-0${randInt(1, 9)}-${String(randInt(1, 28)).padStart(2, '0')}`;
    const ledger: ReviewLedger = {
      id,
      applicant_name: s.applicant_name!,
      license_type: s.license_type!,
      apply_count: randInt(1, 3),
      license_item_name: s.license_item_name!,
      review_method: s.review_method!,
      start_date: start,
      end_date: start,
      total_experts_needed: s.total_experts_needed!,
      leader_id: '',
      observer_id: '',
      batch_year: '2026',
      batch_seq: i + 1,
      review_batch: `2026-${String(i + 1).padStart(3, '0')}`,
      status: s.status,
      review_result: '',
      publicity_batch_year: '',
      publicity_batch_seq: 0,
      publicity_batch: '',
      publicity_start_date: '',
      publicity_end_date: '',
      cert_number: '',
      cert_expire_date: '',
      gov_accept_no: '',
      gov_permit_no: '',
      remarks: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    ledgers.push(ledger);

    // For PENDING_RESULT sample, add leader + members
    if (s.status === 'PENDING_RESULT') {
      const eligible = experts.filter((e) => e.is_enabled && e.work_unit !== s.applicant_name);
      const leader = eligible.find((e) => {
        const q = e.qualifications;
        const key = QUAL_KEYS.find((k) => {
          const labelMap: Record<string, string> = {
            highway_bridge_tunnel: '公路工程桥梁隧道工程专项',
            highway_grade_b: '公路工程乙级',
            highway_grade_c: '公路工程丙级',
            waterway_material_b: '水运工程材料乙级',
            waterway_material_c: '水运工程材料丙级',
            waterway_structure_b: '水运工程结构乙级',
          };
          return labelMap[k] === s.license_item_name;
        });
        return key && q[key] === '组长';
      });
      if (leader) ledger.leader_id = leader.id;
      const memberCount = s.total_experts_needed! - 1;
      const memberPool = eligible.filter((e) => e.id !== leader?.id);
      for (let j = 0; j < memberCount && j < memberPool.length; j++) {
        members.push({
          id: uuid(),
          review_ledger_id: id,
          expert_id: memberPool[j].id,
          role: 'MEMBER',
        });
      }
    }
  });

  return { ledgers, members };
}

export function createInitialDB(): AppDB {
  const experts = genExperts(60);
  const institution_certificates = genInstitutionCerts();
  const observers = genObservers();
  const base_license_types = genBaseLicenseTypes();
  const base_license_items = genBaseLicenseItems();
  const base_review_methods = genBaseReviewMethods();
  const { ledgers, members } = genReviewLedgers(experts, observers, base_license_types, base_license_items, base_review_methods);

  return {
    experts,
    institution_certificates,
    observers,
    base_license_types,
    base_license_items,
    base_review_methods,
    review_ledgers: ledgers,
    review_ledger_members: members,
  };
}

export { uuid };
