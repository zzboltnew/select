/*
# Create all application tables (single-tenant, no auth)

This migration creates 8 tables for the expert review management system.
The app has no sign-in screen, so all policies use `TO anon, authenticated`
with `USING (true)` — the data is intentionally shared/public.

## New Tables

1. **experts** — 专家库
   - id (uuid PK), seq_no (int), is_enabled (bool), region, name, work_unit,
     post_status, unit_location, title, is_leader_qualified (bool),
     qualifications (jsonb), id_card, gender, birth_year (int), education,
     position, phone, mobile, email, address, postcode, remarks

2. **institution_certificates** — 机构证书库
   - id (uuid PK), name, province, nature, qualification_type, cert_no,
     issuing_unit, issue_date, valid_date_range, eval_date, renew_date,
     legal_person, admin_head, tech_head, quality_head, phone, address,
     postcode, status

3. **observers** — 观察员库
   - id (uuid PK), name, region, unit, department, position, mobile

4. **base_license_types** — 许可类型字典
   - id (uuid PK), name

5. **base_license_items** — 许可事项字典
   - id (uuid PK), name

6. **base_review_methods** — 评审方式字典
   - id (uuid PK), name

7. **review_ledgers** — 评审台账
   - id (uuid PK), applicant_name, license_type, apply_count (int),
     license_item_name, review_method, start_date, end_date,
     total_experts_needed (int), leader_id, observer_id, batch_year,
     batch_seq (int), review_batch, status, review_result,
     publicity_batch_year, publicity_batch_seq (int), publicity_batch,
     publicity_start_date, publicity_end_date, cert_number,
     cert_expire_date, gov_accept_no, gov_permit_no, remarks,
     created_at, updated_at

8. **review_ledger_members** — 台账专家组成员关联
   - id (uuid PK), review_ledger_id (fk), expert_id, role

## Security
- RLS enabled on all tables.
- All policies use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`
  because this is a single-tenant app with no sign-in — data is intentionally shared.
*/

-- ============ experts ============
CREATE TABLE IF NOT EXISTS experts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seq_no integer NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  region text NOT NULL DEFAULT '',
  name text NOT NULL DEFAULT '',
  work_unit text NOT NULL DEFAULT '',
  post_status text NOT NULL DEFAULT '',
  unit_location text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  is_leader_qualified boolean NOT NULL DEFAULT false,
  qualifications jsonb NOT NULL DEFAULT '{}'::jsonb,
  id_card text NOT NULL DEFAULT '',
  gender text NOT NULL DEFAULT '',
  birth_year integer NOT NULL DEFAULT 0,
  education text NOT NULL DEFAULT '',
  position text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  mobile text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  postcode text NOT NULL DEFAULT '',
  remarks text NOT NULL DEFAULT ''
);

ALTER TABLE experts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_experts" ON experts;
CREATE POLICY "anon_select_experts" ON experts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_experts" ON experts;
CREATE POLICY "anon_insert_experts" ON experts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_experts" ON experts;
CREATE POLICY "anon_update_experts" ON experts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_experts" ON experts;
CREATE POLICY "anon_delete_experts" ON experts FOR DELETE TO anon, authenticated USING (true);

-- ============ institution_certificates ============
CREATE TABLE IF NOT EXISTS institution_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  province text NOT NULL DEFAULT '',
  nature text NOT NULL DEFAULT '',
  qualification_type text NOT NULL DEFAULT '',
  cert_no text NOT NULL DEFAULT '',
  issuing_unit text NOT NULL DEFAULT '',
  issue_date text NOT NULL DEFAULT '',
  valid_date_range text NOT NULL DEFAULT '',
  eval_date text NOT NULL DEFAULT '',
  renew_date text NOT NULL DEFAULT '',
  legal_person text NOT NULL DEFAULT '',
  admin_head text NOT NULL DEFAULT '',
  tech_head text NOT NULL DEFAULT '',
  quality_head text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  postcode text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT ''
);

ALTER TABLE institution_certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_institutions" ON institution_certificates;
CREATE POLICY "anon_select_institutions" ON institution_certificates FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_institutions" ON institution_certificates;
CREATE POLICY "anon_insert_institutions" ON institution_certificates FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_institutions" ON institution_certificates;
CREATE POLICY "anon_update_institutions" ON institution_certificates FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_institutions" ON institution_certificates;
CREATE POLICY "anon_delete_institutions" ON institution_certificates FOR DELETE TO anon, authenticated USING (true);

-- ============ observers ============
CREATE TABLE IF NOT EXISTS observers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  region text NOT NULL DEFAULT '',
  unit text NOT NULL DEFAULT '',
  department text NOT NULL DEFAULT '',
  position text NOT NULL DEFAULT '',
  mobile text NOT NULL DEFAULT ''
);

ALTER TABLE observers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_observers" ON observers;
CREATE POLICY "anon_select_observers" ON observers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_observers" ON observers;
CREATE POLICY "anon_insert_observers" ON observers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_observers" ON observers;
CREATE POLICY "anon_update_observers" ON observers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_observers" ON observers;
CREATE POLICY "anon_delete_observers" ON observers FOR DELETE TO anon, authenticated USING (true);

-- ============ base_license_types ============
CREATE TABLE IF NOT EXISTS base_license_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT ''
);

ALTER TABLE base_license_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_base_license_types" ON base_license_types;
CREATE POLICY "anon_select_base_license_types" ON base_license_types FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_base_license_types" ON base_license_types;
CREATE POLICY "anon_insert_base_license_types" ON base_license_types FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_base_license_types" ON base_license_types;
CREATE POLICY "anon_update_base_license_types" ON base_license_types FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_base_license_types" ON base_license_types;
CREATE POLICY "anon_delete_base_license_types" ON base_license_types FOR DELETE TO anon, authenticated USING (true);

-- ============ base_license_items ============
CREATE TABLE IF NOT EXISTS base_license_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT ''
);

ALTER TABLE base_license_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_base_license_items" ON base_license_items;
CREATE POLICY "anon_select_base_license_items" ON base_license_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_base_license_items" ON base_license_items;
CREATE POLICY "anon_insert_base_license_items" ON base_license_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_base_license_items" ON base_license_items;
CREATE POLICY "anon_update_base_license_items" ON base_license_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_base_license_items" ON base_license_items;
CREATE POLICY "anon_delete_base_license_items" ON base_license_items FOR DELETE TO anon, authenticated USING (true);

-- ============ base_review_methods ============
CREATE TABLE IF NOT EXISTS base_review_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT ''
);

ALTER TABLE base_review_methods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_base_review_methods" ON base_review_methods;
CREATE POLICY "anon_select_base_review_methods" ON base_review_methods FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_base_review_methods" ON base_review_methods;
CREATE POLICY "anon_insert_base_review_methods" ON base_review_methods FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_base_review_methods" ON base_review_methods;
CREATE POLICY "anon_update_base_review_methods" ON base_review_methods FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_base_review_methods" ON base_review_methods;
CREATE POLICY "anon_delete_base_review_methods" ON base_review_methods FOR DELETE TO anon, authenticated USING (true);

-- ============ review_ledgers ============
CREATE TABLE IF NOT EXISTS review_ledgers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_name text NOT NULL DEFAULT '',
  license_type text NOT NULL DEFAULT '',
  apply_count integer NOT NULL DEFAULT 0,
  license_item_name text NOT NULL DEFAULT '',
  review_method text NOT NULL DEFAULT '',
  start_date text NOT NULL DEFAULT '',
  end_date text NOT NULL DEFAULT '',
  total_experts_needed integer NOT NULL DEFAULT 0,
  leader_id text NOT NULL DEFAULT '',
  observer_id text NOT NULL DEFAULT '',
  batch_year text NOT NULL DEFAULT '',
  batch_seq integer NOT NULL DEFAULT 0,
  review_batch text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'PENDING_EXTRACT',
  review_result text NOT NULL DEFAULT '',
  publicity_batch_year text NOT NULL DEFAULT '',
  publicity_batch_seq integer NOT NULL DEFAULT 0,
  publicity_batch text NOT NULL DEFAULT '',
  publicity_start_date text NOT NULL DEFAULT '',
  publicity_end_date text NOT NULL DEFAULT '',
  cert_number text NOT NULL DEFAULT '',
  cert_expire_date text NOT NULL DEFAULT '',
  gov_accept_no text NOT NULL DEFAULT '',
  gov_permit_no text NOT NULL DEFAULT '',
  remarks text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE review_ledgers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_review_ledgers" ON review_ledgers;
CREATE POLICY "anon_select_review_ledgers" ON review_ledgers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_review_ledgers" ON review_ledgers;
CREATE POLICY "anon_insert_review_ledgers" ON review_ledgers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_review_ledgers" ON review_ledgers;
CREATE POLICY "anon_update_review_ledgers" ON review_ledgers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_review_ledgers" ON review_ledgers;
CREATE POLICY "anon_delete_review_ledgers" ON review_ledgers FOR DELETE TO anon, authenticated USING (true);

-- ============ review_ledger_members ============
CREATE TABLE IF NOT EXISTS review_ledger_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_ledger_id uuid NOT NULL REFERENCES review_ledgers(id) ON DELETE CASCADE,
  expert_id text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'MEMBER'
);

ALTER TABLE review_ledger_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_review_ledger_members" ON review_ledger_members;
CREATE POLICY "anon_select_review_ledger_members" ON review_ledger_members FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_review_ledger_members" ON review_ledger_members;
CREATE POLICY "anon_insert_review_ledger_members" ON review_ledger_members FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_review_ledger_members" ON review_ledger_members;
CREATE POLICY "anon_update_review_ledger_members" ON review_ledger_members FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_review_ledger_members" ON review_ledger_members;
CREATE POLICY "anon_delete_review_ledger_members" ON review_ledger_members FOR DELETE TO anon, authenticated USING (true);

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_review_ledger_members_ledger_id ON review_ledger_members(review_ledger_id);
CREATE INDEX IF NOT EXISTS idx_review_ledgers_review_batch ON review_ledgers(review_batch);
