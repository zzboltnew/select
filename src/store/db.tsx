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

  // Helper: optimistic update + persist to Supabase
  const persistTable = useCallback(async (table: string, rows: any[]) => {
    const { error: delErr } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delErr) console.error(`Failed to clear ${table}:`, delErr);
    if (rows.length > 0) {
      const { error: insErr } = await supabase.from(table).insert(rows);
      if (insErr) console.error(`Failed to insert ${table}:`, insErr);
    }
  }, []);

  // ---- Experts ----
  const addExpert = useCallback((e: Omit<Expert, 'id' | 'seq_no'>) => {
    const id = uuid();
    setDB((prev) => {
      const seq = prev.experts.length ? Math.max(...prev.experts.map((x) => x.seq_no)) + 1 : 1;
      const newExpert = { ...e, id, seq_no: seq };
      persistTable('experts', [...prev.experts, newExpert]);
      return { ...prev, experts: [...prev.experts, newExpert] };
    });
  }, [setDB, persistTable]);

  const updateExpert = useCallback((id: string, patch: Partial<Expert>) => {
    setDB((prev) => {
      const next = prev.experts.map((x) => (x.id === id ? { ...x, ...patch } : x));
      persistTable('experts', next);
      return { ...prev, experts: next };
    });
  }, [setDB, persistTable]);

  const deleteExpert = useCallback((id: string) => {
    setDB((prev) => {
      const next = prev.experts.filter((x) => x.id !== id);
      persistTable('experts', next);
      return { ...prev, experts: next };
    });
  }, [setDB, persistTable]);

  // ---- Institutions ----
  const addInstitution = useCallback((e: Omit<InstitutionCertificate, 'id'>) => {
    const id = uuid();
    setDB((prev) => {
      const newInst = { ...e, id };
      persistTable('institution_certificates', [...prev.institution_certificates, newInst]);
      return { ...prev, institution_certificates: [...prev.institution_certificates, newInst] };
    });
  }, [setDB, persistTable]);

  const updateInstitution = useCallback((id: string, patch: Partial<InstitutionCertificate>) => {
    setDB((prev) => {
      const next = prev.institution_certificates.map((x) => (x.id === id ? { ...x, ...patch } : x));
      persistTable('institution_certificates', next);
      return { ...prev, institution_certificates: next };
    });
  }, [setDB, persistTable]);

  const deleteInstitution = useCallback((id: string) => {
    setDB((prev) => {
      const next = prev.institution_certificates.filter((x) => x.id !== id);
      persistTable('institution_certificates', next);
      return { ...prev, institution_certificates: next };
    });
  }, [setDB, persistTable]);

  // ---- Observers ----
  const addObserver = useCallback((e: Omit<Observer, 'id'>) => {
    const id = uuid();
    setDB((prev) => {
      const newObs = { ...e, id };
      persistTable('observers', [...prev.observers, newObs]);
      return { ...prev, observers: [...prev.observers, newObs] };
    });
  }, [setDB, persistTable]);

  const updateObserver = useCallback((id: string, patch: Partial<Observer>) => {
    setDB((prev) => {
      const next = prev.observers.map((x) => (x.id === id ? { ...x, ...patch } : x));
      persistTable('observers', next);
      return { ...prev, observers: next };
    });
  }, [setDB, persistTable]);

  const deleteObserver = useCallback((id: string) => {
    setDB((prev) => {
      const next = prev.observers.filter((x) => x.id !== id);
      persistTable('observers', next);
      return { ...prev, observers: next };
    });
  }, [setDB, persistTable]);

  // ---- Base dictionaries ----
  const addBaseItem = useCallback((table: 'base_license_types' | 'base_license_items' | 'base_review_methods' | 'base_review_modes', name: string) => {
    const id = uuid();
    setDB((prev) => {
      const newItem = { id, name };
      const next = [...(prev[table] as BaseDictionaryItem[]), newItem];
      persistTable(table, next);
      return { ...prev, [table]: next };
    });
  }, [setDB, persistTable]);

  const updateBaseItem = useCallback((table: 'base_license_types' | 'base_license_items' | 'base_review_methods' | 'base_review_modes', id: string, name: string) => {
    setDB((prev) => {
      const next = (prev[table] as BaseDictionaryItem[]).map((x) => (x.id === id ? { ...x, name } : x));
      persistTable(table, next);
      return { ...prev, [table]: next };
    });
  }, [setDB, persistTable]);

  const deleteBaseItem = useCallback((table: 'base_license_types' | 'base_license_items' | 'base_review_methods' | 'base_review_modes', id: string) => {
    setDB((prev) => {
      const next = (prev[table] as BaseDictionaryItem[]).filter((x) => x.id !== id);
      persistTable(table, next);
      return { ...prev, [table]: next };
    });
  }, [setDB, persistTable]);

  // ---- Ledgers ----
  const addLedger = useCallback((e: Omit<ReviewLedger, 'id' | 'created_at' | 'updated_at' | 'review_batch'>) => {
    const id = uuid();
    const now = new Date().toISOString();
    setDB((prev) => {
      const ledger: ReviewLedger = { ...e, id, created_at: now, updated_at: now, review_batch: '' };
      persistTable('review_ledgers', [...prev.review_ledgers, ledger]);
      return { ...prev, review_ledgers: [...prev.review_ledgers, ledger] };
    });
    return id;
  }, [setDB, persistTable]);

  const updateLedger = useCallback((id: string, patch: Partial<ReviewLedger>) => {
    setDB((prev) => {
      const next = prev.review_ledgers.map((x) =>
        x.id === id ? { ...x, ...patch, updated_at: new Date().toISOString() } : x,
      );
      persistTable('review_ledgers', next);
      return { ...prev, review_ledgers: next };
    });
  }, [setDB, persistTable]);

  const deleteLedger = useCallback((id: string) => {
    setDB((prev) => {
      const nextLedgers = prev.review_ledgers.filter((x) => x.id !== id);
      const nextMembers = prev.review_ledger_members.filter((m) => m.review_ledger_id !== id);
      persistTable('review_ledgers', nextLedgers);
      persistTable('review_ledger_members', nextMembers);
      return { ...prev, review_ledgers: nextLedgers, review_ledger_members: nextMembers };
    });
  }, [setDB, persistTable]);

  // ---- Members ----
  const setMembers = useCallback((ledgerId: string, expertIds: string[]) => {
    setDB((prev) => {
      const others = prev.review_ledger_members.filter((m) => m.review_ledger_id !== ledgerId);
      const newMembers: ReviewLedgerMember[] = expertIds.map((eid) => ({
        id: uuid(),
        review_ledger_id: ledgerId,
        expert_id: eid,
        role: 'MEMBER',
      }));
      const next = [...others, ...newMembers];
      persistTable('review_ledger_members', next);
      return { ...prev, review_ledger_members: next };
    });
  }, [setDB, persistTable]);

  const getMembers = useCallback((ledgerId: string) => db.review_ledger_members.filter((m) => m.review_ledger_id === ledgerId), [db.review_ledger_members]);

  const clearMembers = useCallback((ledgerId: string) => {
    setDB((prev) => {
      const next = prev.review_ledger_members.filter((m) => m.review_ledger_id !== ledgerId);
      persistTable('review_ledger_members', next);
      return { ...prev, review_ledger_members: next };
    });
  }, [setDB, persistTable]);

  // ---- Bulk import ----
  const bulkReplace = useCallback((table: keyof AppDB, rows: any[]) => {
    setDB((prev) => {
      persistTable(table as string, rows);
      return { ...prev, [table]: rows };
    });
  }, [setDB, persistTable]);

  const bulkAppend = useCallback((table: keyof AppDB, rows: any[], matchKey?: string) => {
    let added = 0;
    let updated = 0;
    setDB((prev) => {
      const existing = prev[table] as any[];
      let next: any[];
      if (!matchKey) {
        added = rows.length;
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
      persistTable(table as string, next);
      return { ...prev, [table]: next };
    });
    return { added, updated };
  }, [setDB, persistTable]);

  // ---- Import ledgers + members ----
  // Dedup key: applicant_name + license_item_name (same batch can have multiple applicants/items)
  const importLedgersWithMembers = useCallback((ledgers: ReviewLedger[], members: ReviewLedgerMember[]) => {
    let added = 0;
    let updated = 0;
    setDB((prev) => {
      const existing = prev.review_ledgers;
      const dedupKey = (l: ReviewLedger) => `${l.applicant_name}||${l.license_item_name}`;
      const map = new Map(existing.map((r) => [dedupKey(r), r]));
      const importedIds = new Set<string>();
      const idMap = new Map<string, string>();
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
      const otherMembers = prev.review_ledger_members.filter((m) => !importedIds.has(m.review_ledger_id));
      const importedMembers = members.map((member) => ({
        ...member,
        review_ledger_id: idMap.get(member.review_ledger_id) ?? member.review_ledger_id,
      }));
      const nextLedgers = Array.from(map.values());
      const nextMembers = [...otherMembers, ...importedMembers];
      persistTable('review_ledgers', nextLedgers);
      persistTable('review_ledger_members', nextMembers);
      return {
        ...prev,
        review_ledgers: nextLedgers,
        review_ledger_members: nextMembers,
      };
    });
    return { added, updated };
  }, [setDB, persistTable]);

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
