import type { Expert, Qualifications } from '@/types';

const QUAL_LABEL_TO_KEY: Record<string, keyof Qualifications> = {
  '公路工程桥梁隧道工程专项': 'highway_bridge_tunnel',
  '公路工程乙级': 'highway_grade_b',
  '公路工程丙级': 'highway_grade_c',
  '水运工程材料乙级': 'waterway_material_b',
  '水运工程材料丙级': 'waterway_material_c',
  '水运工程结构乙级': 'waterway_structure_b',
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function baseEligible(expert: Expert, applicantName: string): boolean {
  if (!expert.is_enabled) return false;
  if (expert.work_unit && applicantName && expert.work_unit === applicantName) return false;
  return true;
}

function qualMatches(expert: Expert, licenseItemName: string, wantLeader: boolean, includeLeaders = false): boolean {
  const qkey = QUAL_LABEL_TO_KEY[licenseItemName];
  if (!qkey) return false;
  const val = expert.qualifications[qkey];
  if (!val) return false;
  if (wantLeader) return val === '组长';
  // For member matching: default only 组员; if includeLeaders, also accept 组长
  return val === '组员' || (includeLeaders && val === '组长');
}

export interface ExtractOptions {
  applicantName: string;
  licenseItemName: string;
  totalNeeded: number;
  excludeExpertIds?: string[]; // already-selected (leader or members)
  includeLeaders?: boolean; // when true, 组长-qualified experts are also eligible for member pool
}

export interface ExtractResult {
  leaderCandidates: Expert[];
  memberCandidates: Expert[];
}

export function getEligibleLeaders(
  experts: Expert[],
  applicantName: string,
  licenseItemName: string,
  excludeIds: string[] = [],
): Expert[] {
  return experts.filter(
    (e) =>
      baseEligible(e, applicantName) &&
      !excludeIds.includes(e.id) &&
      qualMatches(e, licenseItemName, true),
  );
}

export function getEligibleMembers(
  experts: Expert[],
  opts: ExtractOptions,
): Expert[] {
  const excludeIds = opts.excludeExpertIds ?? [];
  return experts.filter(
    (e) =>
      baseEligible(e, opts.applicantName) &&
      !excludeIds.includes(e.id) &&
      qualMatches(e, opts.licenseItemName, false, opts.includeLeaders),
  );
}

/**
 * Leader extraction: 3x pool rule.
 * Target = 1 leader. Pool = 3 candidates (or all eligible if < 3).
 */
export function extractLeaderCandidates(
  experts: Expert[],
  applicantName: string,
  licenseItemName: string,
  excludeIds: string[] = [],
): Expert[] {
  const eligible = experts.filter(
    (e) =>
      baseEligible(e, applicantName) &&
      !excludeIds.includes(e.id) &&
      qualMatches(e, licenseItemName, true),
  );
  const shuffled = shuffle(eligible);
  const poolSize = 3;
  if (shuffled.length <= poolSize) return shuffled;
  return shuffled.slice(0, poolSize);
}

/**
 * Member extraction: 3x pool rule.
 * Need N members (totalNeeded - 1). Pool = 3N (or all eligible if < 3N).
 */
export function extractMemberCandidates(
  experts: Expert[],
  opts: ExtractOptions,
): Expert[] {
  const need = Math.max(0, opts.totalNeeded - 1);
  const excludeIds = opts.excludeExpertIds ?? [];
  const eligible = experts.filter(
    (e) =>
      baseEligible(e, opts.applicantName) &&
      !excludeIds.includes(e.id) &&
      qualMatches(e, opts.licenseItemName, false, opts.includeLeaders),
  );
  const shuffled = shuffle(eligible);
  const poolSize = 3 * need;
  if (shuffled.length <= poolSize) return shuffled;
  return shuffled.slice(0, poolSize);
}

/**
 * Supplementary extraction (补抽):
 * Given missing count, return (missing * 3) candidates from the remaining pool
 * (eligible experts not already selected and not already in the current candidate pool).
 */
export function extractSupplementCandidates(
  experts: Expert[],
  opts: ExtractOptions,
  alreadyInPoolIds: string[],
  alreadySelectedIds: string[],
): Expert[] {
  const missing = Math.max(0, opts.totalNeeded - 1 - alreadySelectedIds.length);
  if (missing <= 0) return [];
  const exclude = new Set([...alreadyInPoolIds, ...alreadySelectedIds]);
  const eligible = experts.filter(
    (e) =>
      baseEligible(e, opts.applicantName) &&
      !exclude.has(e.id) &&
      qualMatches(e, opts.licenseItemName, false, opts.includeLeaders),
  );
  const shuffled = shuffle(eligible);
  const poolSize = missing * 3;
  if (shuffled.length <= poolSize) return shuffled;
  return shuffled.slice(0, poolSize);
}
