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
  dbError: string | null;
  clearDbError: () => void;
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
  const [dbError, setDbError] = useState<string | null>(null);

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

  // Helper: targeted single-row insert — returns error string on failure
  const insertRow = useCallback(async (table: string, row: any): Promise<string | null> => {
    const { error: insErr } = await supabase.from(table).insert([row]);
    if (insErr) {
      console.error(`Failed to insert into ${table}:`, insErr);
      return insErr.message;
    }
    return null;
  }, []);

  // Helper: targeted single-row update — returns error string on failure
  const updateRow = useCallback(async (table: string, id: string, patch: any): Promise<string | null> => {
    const { error: updErr } = await supabase.from(table).update(patch).eq('id', id);
    if (updErr) {
      console.error(`Failed to update ${table}:`, updErr);
      return updErr.message;
    }
    return null;
  }, []);

  // Helper: targeted single-row delete — returns error string on failure
  const deleteRow = useCallback(async (table: string, id: string): Promise<string | null> => {
    const { error: delErr } = await supabase.from(table).delete().eq('id', id);
    if (delErr) {
      console.error(`Failed to delete from ${table}:`, delErr);
      return delErr.message;
    }
    return null;
  }, []);

  // On any DB write failure: show error and reload from server to re-sync
  const handleWriteError = useCallback((msg: string) => {
    setDbError(msg);
    reload();
  }, [reload]);

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
    insertRow('experts', newExpert).then((err) => { if (err) handleWriteError(`保存专家失败：${err}`); });
  }, [insertRow, handleWriteError]);

  const updateExpert = useCallback((id: string, patch: Partial<Expert>) => {
    setDbState((prev) => ({
      ...prev,
      experts: prev.experts.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
    updateRow('experts', id, patch).then((err) => { if (err) handleWriteError(`更新专家失败：${err}`); });
  }, [updateRow, handleWriteError]);

  const deleteExpert = useCallback((id: string) => {
    setDbState((prev) => ({ ...prev, experts: prev.experts.filter((x) => x.id !== id) }));
    deleteRow('experts', id).then((err) => { if (err) handleWriteError(`删除专家失败：${err}`); });
  }, [deleteRow, handleWriteError]);

  // ---- Institutions ----
  const addInstitution = useCallback((e: Omit<InstitutionCertificate, 'id'>) => {
    const id = uuid();
    const newInst = { ...e, id };
    setDbState((prev) => ({ ...prev, institution_certificates: [...prev.institution_certificates, newInst] }));
    insertRow('institution_certificates', newInst).then((err) => { if (err) handleWriteError(`保存机构失败：${err}`); });
  }, [insertRow, handleWriteError]);

  const updateInstitution = useCallback((id: string, patch: Partial<InstitutionCertificate>) => {
    setDbState((prev) => ({
      ...prev,
      institution_certificates: prev.institution_certificates.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
    updateRow('institution_certificates', id, patch).then((err) => { if (err) handleWriteError(`更新机构失败：${err}`); });
  }, [updateRow, handleWriteError]);

  const deleteInstitution = useCallback((id: string) => {
    setDbState((prev) => ({ ...prev, institution_certificates: prev.institution_certificates.filter((x) => x.id !== id) }));
    deleteRow('institution_certificates', id).then((err) => { if (err) handleWriteError(`删除机构失败：${err}`); });
  }, [deleteRow, handleWriteError]);

  // ---- Observers ----
  const addObserver = useCallback((e: Omit<Observer, 'id'>) => {
    const id = uuid();
    const newObs = { ...e, id };
    setDbState((prev) => ({ ...prev, observers: [...prev.observers, newObs] }));
    insertRow('observers', newObs).then((err) => { if (err) handleWriteError(`保存观察员失败：${err}`); });
  }, [insertRow, handleWriteError]);

  const updateObserver = useCallback((id: string, patch: Partial<Observer>) => {
    setDbState((prev) => ({
      ...prev,
      observers: prev.observers.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
    updateRow('observers', id, patch).then((err) => { if (err) handleWriteError(`更新观察员失败：${err}`); });
  }, [updateRow, handleWriteError]);

  const deleteObserver = useCallback((id: string) => {
    setDbState((prev) => ({ ...prev, observers: prev.observers.filter((x) => x.id !== id) }));
    deleteRow('observers', id).then((err) => { if (err) handleWriteError(`删除观察员失败：${err}`); });
  }, [deleteRow, handleWriteError]);

  // ---- Base dictionaries ----
  const addBaseItem = useCallback((table: 'base_license_types' | 'base_license_items' | 'base_review_methods' | 'base_review_modes', name: string) => {
    const id = uuid();
    const newItem = { id, name };
    setDbState((prev) => ({ ...prev, [table]: [...(prev[table] as BaseDictionaryItem[]), newItem] }));
    insertRow(table, newItem).then((err) => { if (err) handleWriteError(`保存失败：${err}`); });
  }, [insertRow, handleWriteError]);

  const updateBaseItem = useCallback((table: 'base_license_types' | 'base_license_items' | 'base_review_methods' | 'base_review_modes', id: string, name: string) => {
    setDbState((prev) => ({
      ...prev,
      [table]: (prev[table] as BaseDictionaryItem[]).map((x) => (x.id === id ? { ...x, name } : x)),
    }));
    updateRow(table, id, { name }).then((err) => { if (err) handleWriteError(`更新失败：${err}`); });
  }, [updateRow, handleWriteError]);

  const deleteBaseItem = useCallback((table: 'base_license_types' | 'base_license_items' | 'base_review_methods' | 'base_review_modes', id: string) => {
    setDbState((prev) => ({
      ...prev,
      [table]: (prev[table] as BaseDictionaryItem[]).filter((x) => x.id !== id),
    }));
    deleteRow(table, id).then((err) => { if (err) handleWriteError(`删除失败：${err}`); });
  }, [deleteRow, handleWriteError]);

  // ---- Ledgers ----
  const addLedger = useCallback((e: Omit<ReviewLedger, 'id' | 'created_at' | 'updated_at' | 'review_batch'>) => {
    const id = uuid();
    const now = new Date().toISOString();
    const ledger: ReviewLedger = { ...e, id, created_at: now, updated_at: now, review_batch: '' };
    setDbState((prev) => ({ ...prev, review_ledgers: [...prev.review_ledgers, ledger] }));
    insertRow('review_ledgers', ledger).then((err) => { if (err) handleWriteError(`保存台账失败：${err}`); });
    return id;
  }, [insertRow, handleWriteError]);

  const updateLedger = useCallback((id: string, patch: Partial<ReviewLedger>) => {
    const updatedPatch = { ...patch, updated_at: new Date().toISOString() };
    setDbState((prev) => ({
      ...prev,
      review_ledgers: prev.review_ledgers.map((x) => (x.id === id ? { ...x, ...updatedPatch } : x)),
    }));
    updateRow('review_ledgers', id, updatedPatch).then((err) => { if (err) handleWriteError(`更新台账失败：${err}`); });
  }, [updateRow, handleWriteError]);

  const deleteLedger = useCallback((id: string) => {
    setDbState((prev) => ({
      ...prev,
      review_ledgers: prev.review_ledgers.filter((x) => x.id !== id),
      review_ledger_members: prev.review_ledger_members.filter((m) => m.review_ledger_id !== id),
    }));
    deleteRow('review_ledgers', id).then((err) => { if (err) handleWriteError(`删除台账失败：${err}`); });
  }, [deleteRow, handleWriteError]);

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

    (async () => {
      const { error: delErr } = await supabase.from('review_ledger_members').delete().eq('review_ledger_id', ledgerId);
      if (delErr) { handleWriteError(`清空组员失败：${delErr.message}`); return; }
      if (newMembers.length > 0) {
        const { error: insErr } = await supabase.from('review_ledger_members').insert(newMembers);
        if (insErr) handleWriteError(`保存组员失败：${insErr.message}`);
      }
    })();
  }, [handleWriteError]);

  const replaceMember = useCallback((ledgerId: string, oldExpertId: string, newExpertId: string) => {
    setDbState((prev) => ({
      ...prev,
      review_ledger_members: prev.review_ledger_members.map((m) =>
        m.review_ledger_id === ledgerId && m.expert_id === oldExpertId
          ? { ...m, expert_id: newExpertId }
          : m,
      ),
    }));
    const member = dbRef.current.review_ledger_members.find(
      (m) => m.review_ledger_id === ledgerId && m.expert_id === oldExpertId,
    );
    if (member) {
      updateRow('review_ledger_members', member.id, { expert_id: newExpertId }).then((err) => { if (err) handleWriteError(`替换组员失败：${err}`); });
    }
  }, [updateRow, handleWriteError]);

  const getMembers = useCallback((ledgerId: string) => db.review_ledger_members.filter((m) => m.review_ledger_id === ledgerId), [db.review_ledger_members]);

  const clearMembers = useCallback((ledgerId: string) => {
    setDbState((prev) => ({
      ...prev,
      review_ledger_members: prev.review_ledger_members.filter((m) => m.review_ledger_id !== ledgerId),
    }));
    supabase.from('review_ledger_members').delete().eq('review_ledger_id', ledgerId).then(({ error }) => {
      if (error) handleWriteError(`清空组员失败：${error.message}`);
    });
  }, [handleWriteError]);

  // ---- Bulk import ----
  const bulkReplace = useCallback((table: keyof AppDB, rows: any[]) => {
    setDbState((prev) => ({ ...prev, [table]: rows }));
    persistTableBulk(table as string, rows).then(() => {});
  }, [persistTableBulk]);

  const bulkAppend = useCallback((table: keyof AppDB, rows: any[], matchKey?: string) => {
    const existing = dbRef.current[table] as any[];
    let added = 0;
    let updated = 0;
    let next: any[];
    const toInsert: any[] = [];
    const toUpdate: { id: string; patch: any }[] = [];

    if (!matchKey) {
      for (const row of rows) {
        if (!row.id) row.id = uuid();
        if (!row.seq_no && table === 'experts') row.seq_no = existing.length + added + 1;
        toInsert.push(row);
        added++;
      }
      next = [...existing, ...rows];
    } else {
      const map = new Map(existing.map((r: any) => [r[matchKey], r]));
      for (const row of rows) {
        const key = row[matchKey];
        if (key && map.has(key)) {
          const existingRow = map.get(key)!;
          const merged = { ...existingRow, ...row };
          map.set(key, merged);
          toUpdate.push({ id: existingRow.id, patch: row });
          updated++;
        } else {
          if (!row.id) row.id = uuid();
          if (!row.seq_no && table === 'experts') row.seq_no = existing.length + added + 1;
          map.set(key || uuid(), row);
          toInsert.push(row);
          added++;
        }
      }
      next = Array.from(map.values());
    }

    setDbState((prev) => ({ ...prev, [table]: next }));

    // Persist: targeted inserts and updates — no destructive delete-all
    (async () => {
      let hadError = false;
      let errMsg = '';
      if (toInsert.length > 0) {
        const BATCH = 200;
        for (let i = 0; i < toInsert.length; i += BATCH) {
          const batch = toInsert.slice(i, i + BATCH);
          const { error: insErr } = await supabase.from(table as string).insert(batch);
          if (insErr) { console.error(`Failed to bulk-insert into ${table} (batch ${i}):`, insErr); hadError = true; errMsg = insErr.message; }
        }
      }
      for (const { id, patch } of toUpdate) {
        const { error: updErr } = await supabase.from(table as string).update(patch).eq('id', id);
        if (updErr) { console.error(`Failed to bulk-update ${table} row ${id}:`, updErr); hadError = true; errMsg = updErr.message; }
      }
      if (hadError) handleWriteError(`部分数据保存失败：${errMsg}`);
    })();

    return { added, updated };
  }, [handleWriteError]);

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

    // Targeted persist: insert new ledgers, update matched ones
    (async () => {
      let hadError = false;
      let errMsg = '';
      for (const ledger of ledgers) {
        const mappedId = idMap.get(ledger.id) ?? ledger.id;
        if (mappedId === ledger.id && !existing.some((e) => e.id === ledger.id)) {
          const { error: insErr } = await supabase.from('review_ledgers').insert([ledger]);
          if (insErr) { console.error(`Failed to insert ledger ${ledger.id}:`, insErr); hadError = true; errMsg = insErr.message; }
        } else {
          const { error: updErr } = await supabase.from('review_ledgers').update(ledger).eq('id', mappedId);
          if (updErr) { console.error(`Failed to update ledger ${mappedId}:`, updErr); hadError = true; errMsg = updErr.message; }
        }
      }
      for (const ledgerId of importedIds) {
        await supabase.from('review_ledger_members').delete().eq('review_ledger_id', ledgerId);
      }
      if (importedMembers.length > 0) {
        const BATCH = 200;
        for (let i = 0; i < importedMembers.length; i += BATCH) {
          const batch = importedMembers.slice(i, i + BATCH);
          const { error: insErr } = await supabase.from('review_ledger_members').insert(batch);
          if (insErr) { console.error(`Failed to insert members (batch ${i}):`, insErr); hadError = true; errMsg = insErr.message; }
        }
      }
      if (hadError) handleWriteError(`部分台账数据保存失败：${errMsg}`);
    })();

    return { added, updated };
  }, [handleWriteError]);

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
    dbError,
    clearDbError: () => setDbError(null),
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
