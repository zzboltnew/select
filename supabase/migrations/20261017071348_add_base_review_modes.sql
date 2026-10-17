/*
# Create base_review_modes table and seed initial data

1. New Table
- `base_review_modes` — 评审模式字典
  - id (uuid PK), name (text)

2. Seed Data
- 书面现场同组专家
- 书面现场不同专家
- 仅书面专家
- 仅现场专家

3. Security
- RLS enabled, anon+authenticated CRUD (single-tenant, no auth)
*/

CREATE TABLE IF NOT EXISTS base_review_modes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT ''
);

ALTER TABLE base_review_modes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_base_review_modes" ON base_review_modes;
CREATE POLICY "anon_select_base_review_modes" ON base_review_modes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_base_review_modes" ON base_review_modes;
CREATE POLICY "anon_insert_base_review_modes" ON base_review_modes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_base_review_modes" ON base_review_modes;
CREATE POLICY "anon_update_base_review_modes" ON base_review_modes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_base_review_modes" ON base_review_modes;
CREATE POLICY "anon_delete_base_review_modes" ON base_review_modes FOR DELETE TO anon, authenticated USING (true);

-- Seed initial data (only if table is empty)
INSERT INTO base_review_modes (name)
SELECT * FROM (VALUES
  ('书面现场同组专家'),
  ('书面现场不同专家'),
  ('仅书面专家'),
  ('仅现场专家')
) AS t(name)
WHERE NOT EXISTS (SELECT 1 FROM base_review_modes);
