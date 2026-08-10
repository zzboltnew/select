import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type {
  AppDB,
  Expert,
  InstitutionCertificate,
  Observer,
  BaseDictionaryItem,
  ReviewLedger,
  ReviewLedgerMember,
} from '@/types';
import { createInitialDB, uuid } from '@/data/mockData';

const STORAGE_KEY = 'expert-selection-db-v1';

function loadDB(): AppDB {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppDB;
  } catch {
    // ignore
  }
  const db = createInitialDB();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  return db;
}

function saveDB(db: AppDB) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

interface DBContextValue {
  db: AppDB;
  setDB: (updater: (prev: AppDB) => AppDB) => void;
  resetDB: () => void;
  clearDB: () => void;

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
  addBaseItem: (table: 'base_license_types' | 'base_license_items' | 'base_review_methods', name: string) => void;
  updateBaseItem: (table: 'base_license_types' | 'base_license_items' | 'base_review_methods', id: string, name: string) => void;
  deleteBaseItem: (table: 'base_license_types' | 'base_license_items' | 'base_review_methods', id: string) => void;

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
  // Import ledgers + members together
  importLedgersWithMembers: (ledgers: ReviewLedger[], members: ReviewLedgerMember[]) => { added: number; updated: number };
}

const DBContext = createContext<DBContextValue | null>(null);

export function DBProvider({ children }: { children: ReactNode }) {
  const [db, setDbState] = useState<AppDB>(() => loadDB());

  useEffect(() => {
    saveDB(db);
  }, [db]);

  const setDB = useCallback((updater: (prev: AppDB) => AppDB) => {
    setDbState((prev) => updater(prev));
  }, []);

  const resetDB = useCallback(() => {
    const fresh = createInitialDB();
    setDbState(fresh);
  }, []);

  const clearDB = useCallback(() => {
    const empty: AppDB = {
      experts: [],
      institution_certificates: [],
      observers: [],
      base_license_types: [],
      base_license_items: [],
      base_review_methods: [],
      review_ledgers: [],
      review_ledger_members: [],
    };
    setDbState(empty);
  }, []);

  // ---- Experts ----
  const addExpert = useCallback((e: Omit<Expert, 'id' | 'seq_no'>) => {
    setDB((prev) => {
      const seq = prev.experts.length ? Math.max(...prev.experts.map((x) => x.seq_no)) + 1 : 1;
      return { ...prev, experts: [...prev.experts, { ...e, id: uuid(), seq_no: seq }] };
    });
  }, [setDB]);

  const updateExpert = useCallback((id: string, patch: Partial<Expert>) => {
    setDB((prev) => ({ ...prev, experts: prev.experts.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  }, [setDB]);

  const deleteExpert = useCallback((id: string) => {
    setDB((prev) => ({ ...prev, experts: prev.experts.filter((x) => x.id !== id) }));
  }, [setDB]);

  // ---- Institutions ----
  const addInstitution = useCallback((e: Omit<InstitutionCertificate, 'id'>) => {
    setDB((prev) => ({ ...prev, institution_certificates: [...prev.institution_certificates, { ...e, id: uuid() }] }));
  }, [setDB]);

  const updateInstitution = useCallback((id: string, patch: Partial<InstitutionCertificate>) => {
    setDB((prev) => ({ ...prev, institution_certificates: prev.institution_certificates.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  }, [setDB]);

  const deleteInstitution = useCallback((id: string) => {
    setDB((prev) => ({ ...prev, institution_certificates: prev.institution_certificates.filter((x) => x.id !== id) }));
  }, [setDB]);

  // ---- Observers ----
  const addObserver = useCallback((e: Omit<Observer, 'id'>) => {
    setDB((prev) => ({ ...prev, observers: [...prev.observers, { ...e, id: uuid() }] }));
  }, [setDB]);

  const updateObserver = useCallback((id: string, patch: Partial<Observer>) => {
    setDB((prev) => ({ ...prev, observers: prev.observers.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  }, [setDB]);

  const deleteObserver = useCallback((id: string) => {
    setDB((prev) => ({ ...prev, observers: prev.observers.filter((x) => x.id !== id) }));
  }, [setDB]);

  // ---- Base dictionaries ----
  const addBaseItem = useCallback((table: 'base_license_types' | 'base_license_items' | 'base_review_methods', name: string) => {
    setDB((prev) => ({ ...prev, [table]: [...prev[table], { id: uuid(), name }] }));
  }, [setDB]);

  const updateBaseItem = useCallback((table: 'base_license_types' | 'base_license_items' | 'base_review_methods', id: string, name: string) => {
    setDB((prev) => ({ ...prev, [table]: (prev[table] as BaseDictionaryItem[]).map((x) => (x.id === id ? { ...x, name } : x)) }));
  }, [setDB]);

  const deleteBaseItem = useCallback((table: 'base_license_types' | 'base_license_items' | 'base_review_methods', id: string) => {
    setDB((prev) => ({ ...prev, [table]: (prev[table] as BaseDictionaryItem[]).filter((x) => x.id !== id) }));
  }, [setDB]);

  // ---- Ledgers ----
  const addLedger = useCallback((e: Omit<ReviewLedger, 'id' | 'created_at' | 'updated_at' | 'review_batch'>) => {
    const id = uuid();
    const now = new Date().toISOString();
    setDB((prev) => {
      const ledger: ReviewLedger = { ...e, id, created_at: now, updated_at: now, review_batch: '' };
      return { ...prev, review_ledgers: [...prev.review_ledgers, ledger] };
    });
    return id;
  }, [setDB]);

  const updateLedger = useCallback((id: string, patch: Partial<ReviewLedger>) => {
    setDB((prev) => ({
      ...prev,
      review_ledgers: prev.review_ledgers.map((x) =>
        x.id === id ? { ...x, ...patch, updated_at: new Date().toISOString() } : x,
      ),
    }));
  }, [setDB]);

  const deleteLedger = useCallback((id: string) => {
    setDB((prev) => ({
      ...prev,
      review_ledgers: prev.review_ledgers.filter((x) => x.id !== id),
      review_ledger_members: prev.review_ledger_members.filter((m) => m.review_ledger_id !== id),
    }));
  }, [setDB]);

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
      return { ...prev, review_ledger_members: [...others, ...newMembers] };
    });
  }, [setDB]);

  const getMembers = useCallback((ledgerId: string) => db.review_ledger_members.filter((m) => m.review_ledger_id === ledgerId), [db.review_ledger_members]);

  const clearMembers = useCallback((ledgerId: string) => {
    setDB((prev) => ({ ...prev, review_ledger_members: prev.review_ledger_members.filter((m) => m.review_ledger_id !== ledgerId) }));
  }, [setDB]);

  // ---- Bulk import ----
  const bulkReplace = useCallback((table: keyof AppDB, rows: any[]) => {
    setDB((prev) => ({ ...prev, [table]: rows }));
  }, [setDB]);

  const bulkAppend = useCallback((table: keyof AppDB, rows: any[], matchKey?: string) => {
    let added = 0;
    let updated = 0;
    setDB((prev) => {
      const existing = prev[table] as any[];
      if (!matchKey) {
        added = rows.length;
        return { ...prev, [table]: [...existing, ...rows] };
      }
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
      return { ...prev, [table]: Array.from(map.values()) };
    });
    return { added, updated };
  }, [setDB]);

  // ---- Import ledgers + members ----
  const importLedgersWithMembers = useCallback((ledgers: ReviewLedger[], members: ReviewLedgerMember[]) => {
    let added = 0;
    let updated = 0;
    setDB((prev) => {
      const existing = prev.review_ledgers;
      const map = new Map(existing.map((r) => [r.review_batch, r]));
      const importedIds = new Set<string>();
      const idMap = new Map<string, string>();
      for (const ledger of ledgers) {
        const key = ledger.review_batch;
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
      return {
        ...prev,
        review_ledgers: Array.from(map.values()),
        review_ledger_members: [...otherMembers, ...importedMembers],
      };
    });
    return { added, updated };
  }, [setDB]);

  const value: DBContextValue = {
    db,
    setDB,
    resetDB,
    clearDB,
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
  };

  return <DBContext.Provider value={value}>{children}</DBContext.Provider>;
}

export function useDB() {
  const ctx = useContext(DBContext);
  if (!ctx) throw new Error('useDB must be used within DBProvider');
  return ctx;
}
