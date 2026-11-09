import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type {
  AppDB,
  Expert,
  InstitutionCertificate,
  Observer,
  BaseDictionaryItem,
  ReviewLedger,
  ReviewLedgerMember,
} from '@/types';
import { uuid } from '@/data/mockData';
import { supabase } from '@/lib/supabase';

const EMPTY_DB: AppDB = {
  experts: [],
  institution_certificates: [],
  observers: [],
  base_license_types: [],
  base_license_items: [],
  base_review_methods: [],
  base_review_modes: [],
  review_ledgers: [],
  review_ledger_members: [],
};

async function loadAll(): Promise<AppDB> {
  const [experts, institutions, observers, blt, bli, brm, brmd, ledgers, members] = await Promise.all([
    supabase.from('experts').select('*').then((r) => r.data ?? []),
    supabase.from('institution_certificates').select('*').then((r) => r.data ?? []),
    supabase.from('observers').select('*').then((r) => r.data ?? []),
    supabase.from('base_license_types').select('*').then((r) => r.data ?? []),
    supabase.from('base_license_items').select('*').then((r) => r.data ?? []),
    supabase.from('base_review_methods').select('*').then((r) => r.data ?? []),
    supabase.from('base_review_modes').select('*').then((r) => r.data ?? []),
    supabase.from('review_ledgers').select('*').then((r) => r.data ?? []),
    supabase.from('review_ledger_members').select('*').then((r) => r.data ?? []),
  ]);
  return {
    experts: experts as Expert[],
    institution_certificates: institutions as InstitutionCertificate[],
    observers: observers as Observer[],
    base_license_types: blt as BaseDictionaryItem[],
    base_license_items: bli as BaseDictionaryItem[],
    base_review_methods: brm as BaseDictionaryItem[],
    base_review_modes: brmd as BaseDictionaryItem[],
    review_ledgers: ledgers as ReviewLedger[],
    review_ledger_members: members as ReviewLedgerMember[],
  };
}

interface DBContextValue {
  db: AppDB;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  setDB: (updater: (prev: AppDB) => AppDB) => void;

  // Experts
  addExpert: (e: Omit<Expert, 'id' | 'seq_no'>) => void;
  updateExpert: (id: string, patch: Partial<Expert>) => void;
  deleteExpert: (id: string) => void;

  // Institutions
  addInstitution: (e: Omit<InstitutionCertificate, 'id'>) => void;
  updateInstitution: (id: string, patch: Partial<InstitutionCertificate>) => void;
  deleteInstitution: (id: string) => void;

  // Observers
  addObserver: (e: Omit<Observer, 'id'>) => void;
  updateObserver: (id: string, patch: Partial<Observer>) => void;
  deleteObserver: (id: string) => void;

  // Base dictionaries
  addBaseItem: (table: 'base_license_types' | 'base_license_items' | 'base_review_methods' | 'base_review_modes', name: string) => void;
  updateBaseItem: (table: 'base_license_types' | 'base_license_items' | 'base_review_methods' | 'base_review_modes', id: string, name: string) => void;
  deleteBaseItem: (table: 'base_license_types' | 'base_license_items' | 'base_review_methods' | 'base_review_modes', id: string) => void;

  // Ledgers
  addLedger: (e: Omit<ReviewLedger, 'id' | 'created_at' | 'updated_at' | 'review_batch'>) => string;
  updateLedger: (id: string, patch: Partial<ReviewLedger>) => void;
  deleteLedger: (id: string) => void;

  // Members
  setMembers: (ledgerId: string, expertIds: string[]) => void;
  replaceMember: (ledgerId: string, oldExpertId: string, newExpertId: string) => void;
  getMembers: (ledgerId: string) => ReviewLedgerMember[];
  clearMembers: (ledgerId: string) => void;

  // Bulk replace (for import)
  bulkReplace: (table: keyof AppDB, rows: any[]) => void;
  bulkAppend: (table: keyof AppDB, rows: any[], matchKey?: string) => { added: number; updated: number };
  importLedgersWithMembers: (ledgers: ReviewLedger[], members: ReviewLedgerMember[]) => { added: number; updated: number };

  // Clear entire system database (all tables)
  clearAllDB: () => Promise<void>;
}

const DBContext = createContext<DBContextValue | null>(null);

export function DBProvider({ children }: { children: ReactNode }) {
  const [db, setDbState] = useState<AppDB>(EMPTY_DB);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref to always access the latest db state without re-creating callbacks
  const dbRef = useRef(db);
  dbRef.current = db;

  // Load from Supabase on mount
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadAll();
      setDbState(data);
    } catch (err: any) {
      setError(err.message ?? '加载数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    reload();
  }, [reload]);

  const setDB = useCallback((updater: (prev: AppDB) => AppDB) => {
    setDbState((prev) => updater(prev));
  }, []);

  // Helper: targeted single-row insert
  const insertRow = useCallback(async (table: string, row: any) => {
    const { error: insErr } = await supabase.from(table).insert([row]);
    if (insErr) console.error(`Failed to insert into ${table}:`, insErr);
  }, []);

  // Helper: targeted single-row update
  const updateRow = useCallback(async (table: string, id: string, patch: any) => {
    const { error: updErr } = await supabase.from(table).update(patch).eq('id', id);
    if (updErr) console.error(`Failed to update ${table}:`, updErr);
  }, []);

  // Helper: targeted single-row delete
  const deleteRow = useCallback(async (table: string, id: string) => {
    const { error: delErr } = await supabase.from(table).delete().eq('id', id);
    if (delErr) console.error(`Failed to delete from ${table}:`, delErr);
  }, []);

  // Helper: full table replace (delete all + insert all) — used only for bulk operations
  const persistTableBulk = useCallback(async (table: string, rows: any[]) => {
    const { error: delErr } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delErr) { console.error(`Failed to clear ${table}:`, delErr); return; }
    if (rows.length > 0) {
      const BATCH = 200;
      for (let i = 0; i < rows.length; i += BATCH) {
        const batch = rows.slice(i, i + BATCH);
        const { error: insErr } = await supabase.from(table).insert(batch);
        if (insErr) { console.error(`Failed to insert ${table} (batch ${i}):`, insErr); return; }
      }
    }
  }, []);

  // ---- Experts ----
  const addExpert = useCallback((e: Omit<Expert, 'id' | 'seq_no'>) => {
    const id = uuid();
    const currentExperts = dbRef.current.experts;
    const seq = currentExperts.length ? Math.max(...currentExperts.map((x) => x.seq_no)) + 1 : 1;
    const newExpert = { ...e, id, seq_no: seq };
    setDbState((prev) => ({ ...prev, experts: [...prev.experts, newExpert] }));
    insertRow('experts', newExpert);
  }, [insertRow]);

  const updateExpert = useCallback((id: string, patch: Partial<Expert>) => {
    setDbState((prev) => ({
      ...prev,
      experts: prev.experts.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
    updateRow('experts', id, patch);
  }, [updateRow]);

  const deleteExpert = useCallback((id: string) => {
    setDbState((prev) => ({ ...prev, experts: prev.experts.filter((x) => x.id !== id) }));
    deleteRow('experts', id);
  }, [deleteRow]);

  // ---- Institutions ----
  const addInstitution = useCallback((e: Omit<InstitutionCertificate, 'id'>) => {
    const id = uuid();
    const newInst = { ...e, id };
    setDbState((prev) => ({ ...prev, institution_certificates: [...prev.institution_certificates, newInst] }));
    insertRow('institution_certificates', newInst);
  }, [insertRow]);

  const updateInstitution = useCallback((id: string, patch: Partial<InstitutionCertificate>) => {
    setDbState((prev) => ({
      ...prev,
      institution_certificates: prev.institution_certificates.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
    updateRow('institution_certificates', id, patch);
  }, [updateRow]);

  const deleteInstitution = useCallback((id: string) => {
    setDbState((prev) => ({ ...prev, institution_certificates: prev.institution_certificates.filter((x) => x.id !== id) }));
    deleteRow('institution_certificates', id);
  }, [deleteRow]);

  // ---- Observers ----
  const addObserver = useCallback((e: Omit<Observer, 'id'>) => {
    const id = uuid();
    const newObs = { ...e, id };
    setDbState((prev) => ({ ...prev, observers: [...prev.observers, newObs] }));
    insertRow('observers', newObs);
  }, [insertRow]);

  const updateObserver = useCallback((id: string, patch: Partial<Observer>) => {
    setDbState((prev) => ({
      ...prev,
      observers: prev.observers.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
    updateRow('observers', id, patch);
  }, [updateRow]);

  const deleteObserver = useCallback((id: string) => {
    setDbState((prev) => ({ ...prev, observers: prev.observers.filter((x) => x.id !== id) }));
    deleteRow('observers', id);
  }, [deleteRow]);

  // ---- Base dictionaries ----
  const addBaseItem = useCallback((table: 'base_license_types' | 'base_license_items' | 'base_review_methods' | 'base_review_modes', name: string) => {
    const id = uuid();
    const newItem = { id, name };
    setDbState((prev) => ({ ...prev, [table]: [...(prev[table] as BaseDictionaryItem[]), newItem] }));
    insertRow(table, newItem);
  }, [insertRow]);

  const updateBaseItem = useCallback((table: 'base_license_types' | 'base_license_items' | 'base_review_methods' | 'base_review_modes', id: string, name: string) => {
    setDbState((prev) => ({
      ...prev,
      [table]: (prev[table] as BaseDictionaryItem[]).map((x) => (x.id === id ? { ...x, name } : x)),
    }));
    updateRow(table, id, { name });
  }, [updateRow]);

  const deleteBaseItem = useCallback((table: 'base_license_types' | 'base_license_items' | 'base_review_methods' | 'base_review_modes', id: string) => {
    setDbState((prev) => ({
      ...prev,
      [table]: (prev[table] as BaseDictionaryItem[]).filter((x) => x.id !== id),
    }));
    deleteRow(table, id);
  }, [deleteRow]);

  // ---- Ledgers ----
  const addLedger = useCallback((e: Omit<ReviewLedger, 'id' | 'created_at' | 'updated_at' | 'review_batch'>) => {
    const id = uuid();
    const now = new Date().toISOString();
    const ledger: ReviewLedger = { ...e, id, created_at: now, updated_at: now, review_batch: '' };
    setDbState((prev) => ({ ...prev, review_ledgers: [...prev.review_ledgers, ledger] }));
    insertRow('review_ledgers', ledger);
    return id;
  }, [insertRow]);

  const updateLedger = useCallback((id: string, patch: Partial<ReviewLedger>) => {
    const updatedPatch = { ...patch, updated_at: new Date().toISOString() };
    setDbState((prev) => ({
      ...prev,
      review_ledgers: prev.review_ledgers.map((x) => (x.id === id ? { ...x, ...updatedPatch } : x)),
    }));
    updateRow('review_ledgers', id, updatedPatch);
  }, [updateRow]);

  const deleteLedger = useCallback((id: string) => {
    setDbState((prev) => ({
      ...prev,
      review_ledgers: prev.review_ledgers.filter((x) => x.id !== id),
      review_ledger_members: prev.review_ledger_members.filter((m) => m.review_ledger_id !== id),
    }));
    // Delete ledger (members cascade via FK)
    deleteRow('review_ledgers', id);
  }, [deleteRow]);

  // ---- Members ----
  const setMembers = useCallback((ledgerId: string, expertIds: string[]) => {
    const newMembers: ReviewLedgerMember[] = expertIds.map((eid) => ({
      id: uuid(),
      review_ledger_id: ledgerId,
      expert_id: eid,
      role: 'MEMBER',
    }));
    const currentMembers = dbRef.current.review_ledger_members;
    const others = currentMembers.filter((m) => m.review_ledger_id !== ledgerId);
    const next = [...others, ...newMembers];
    setDbState((prev) => ({ ...prev, review_ledger_members: next }));

    // Targeted: delete only this ledger's members, then insert new ones
    supabase.from('review_ledger_members').delete().eq('review_ledger_id', ledgerId).then(({ error }) => {
      if (error) { console.error('Failed to clear members:', error); return; }
      if (newMembers.length > 0) {
        supabase.from('review_ledger_members').insert(newMembers).then(({ error: insErr }) => {
          if (insErr) console.error('Failed to insert members:', insErr);
        });
      }
    });
  }, []);

  const replaceMember = useCallback((ledgerId: string, oldExpertId: string, newExpertId: string) => {
    setDbState((prev) => ({
      ...prev,
      review_ledger_members: prev.review_ledger_members.map((m) =>
        m.review_ledger_id === ledgerId && m.expert_id === oldExpertId
          ? { ...m, expert_id: newExpertId }
          : m,
      ),
    }));
    // Targeted update: find the member row and update expert_id
    const member = dbRef.current.review_ledger_members.find(
      (m) => m.review_ledger_id === ledgerId && m.expert_id === oldExpertId,
    );
    if (member) {
      updateRow('review_ledger_members', member.id, { expert_id: newExpertId });
    }
  }, [updateRow]);

  const getMembers = useCallback((ledgerId: string) => db.review_ledger_members.filter((m) => m.review_ledger_id === ledgerId), [db.review_ledger_members]);

  const clearMembers = useCallback((ledgerId: string) => {
    setDbState((prev) => ({
      ...prev,
      review_ledger_members: prev.review_ledger_members.filter((m) => m.review_ledger_id !== ledgerId),
    }));
    supabase.from('review_ledger_members').delete().eq('review_ledger_id', ledgerId).then(({ error }) => {
      if (error) console.error('Failed to clear members:', error);
    });
  }, []);

  // ---- Bulk import ----
  const bulkReplace = useCallback((table: keyof AppDB, rows: any[]) => {
    setDbState((prev) => ({ ...prev, [table]: rows }));
    persistTableBulk(table as string, rows);
  }, [persistTableBulk]);

  const bulkAppend = useCallback((table: keyof AppDB, rows: any[], matchKey?: string) => {
    const existing = dbRef.current[table] as any[];
    let added = 0;
    let updated = 0;
    let next: any[];

    if (!matchKey) {
      // Ensure ids exist
      for (const row of rows) {
        if (!row.id) row.id = uuid();
        if (!row.seq_no && table === 'experts') row.seq_no = existing.length + added + 1;
        added++;
      }
      next = [...existing, ...rows];
    } else {
      const map = new Map(existing.map((r: any) => [r[matchKey], r]));
      for (const row of rows) {
        const key = row[matchKey];
        if (key && map.has(key)) {
          map.set(key, { ...map.get(key), ...row });
          updated++;
        } else {
          if (!row.id) row.id = uuid();
          if (!row.seq_no && table === 'experts') row.seq_no = existing.length + added + 1;
          map.set(key || uuid(), row);
          added++;
        }
      }
      next = Array.from(map.values());
    }

    setDbState((prev) => ({ ...prev, [table]: next }));
    // Persist the full table after state update
    persistTableBulk(table as string, next);
    return { added, updated };
  }, [persistTableBulk]);

  // ---- Import ledgers + members ----
  const importLedgersWithMembers = useCallback((ledgers: ReviewLedger[], members: ReviewLedgerMember[]) => {
    const existing = dbRef.current.review_ledgers;
    const existingMembers = dbRef.current.review_ledger_members;
    const dedupKey = (l: ReviewLedger) => `${l.applicant_name}||${l.license_item_name}`;
    const map = new Map(existing.map((r) => [dedupKey(r), r]));
    const importedIds = new Set<string>();
    const idMap = new Map<string, string>();
    let added = 0;
    let updated = 0;

    for (const ledger of ledgers) {
      const key = dedupKey(ledger);
      if (key && map.has(key)) {
        const existingLedger = map.get(key)!;
        map.set(key, { ...existingLedger, ...ledger, id: existingLedger.id });
        importedIds.add(existingLedger.id);
        idMap.set(ledger.id, existingLedger.id);
        updated++;
      } else {
        map.set(key || ledger.id, ledger);
        importedIds.add(ledger.id);
        idMap.set(ledger.id, ledger.id);
        added++;
      }
    }

    const otherMembers = existingMembers.filter((m) => !importedIds.has(m.review_ledger_id));
    const importedMembers = members.map((member) => ({
      ...member,
      review_ledger_id: idMap.get(member.review_ledger_id) ?? member.review_ledger_id,
    }));
    const nextLedgers = Array.from(map.values());
    const nextMembers = [...otherMembers, ...importedMembers];

    setDbState((prev) => ({
      ...prev,
      review_ledgers: nextLedgers,
      review_ledger_members: nextMembers,
    }));

    persistTableBulk('review_ledgers', nextLedgers);
    persistTableBulk('review_ledger_members', nextMembers);
    return { added, updated };
  }, [persistTableBulk]);

  // ---- Clear entire system database ----
  const clearAllDB = useCallback(async () => {
    const tables = [
      'review_ledger_members',
      'review_ledgers',
      'experts',
      'institution_certificates',
      'observers',
      'base_license_types',
      'base_license_items',
      'base_review_methods',
      'base_review_modes',
    ];
    for (const table of tables) {
      const { error: delErr } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (delErr) console.error(`Failed to clear ${table}:`, delErr);
    }
    setDbState(EMPTY_DB);
  }, []);

  const value: DBContextValue = {
    db,
    loading,
    error,
    reload,
    setDB,
    addExpert,
    updateExpert,
    deleteExpert,
    addInstitution,
    updateInstitution,
    deleteInstitution,
    addObserver,
    updateObserver,
    deleteObserver,
    addBaseItem,
    updateBaseItem,
    deleteBaseItem,
    addLedger,
    updateLedger,
    deleteLedger,
    setMembers,
    replaceMember,
    getMembers,
    clearMembers,
    bulkReplace,
    bulkAppend,
    importLedgersWithMembers,
    clearAllDB,
  };

  return <DBContext.Provider value={value}>{children}</DBContext.Provider>;
}

export function useDB() {
  const ctx = useContext(DBContext);
  if (!ctx) throw new Error('useDB must be used within DBProvider');
  return ctx;
}
