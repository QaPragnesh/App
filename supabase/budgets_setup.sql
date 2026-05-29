-- ============================================================
-- BUDGETS TABLE — run ALL of this in Supabase → SQL Editor
-- ============================================================

-- 1) Create table if missing
CREATE TABLE IF NOT EXISTS budgets (
  id BIGSERIAL PRIMARY KEY,
  amount NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  workspace_id TEXT NOT NULL
);

-- 2) Auto-increment id (fixes null id on insert)
CREATE SEQUENCE IF NOT EXISTS budgets_id_seq;
ALTER TABLE budgets
  ALTER COLUMN id SET DEFAULT nextval('budgets_id_seq');
ALTER SEQUENCE budgets_id_seq OWNED BY budgets.id;
SELECT setval(
  'budgets_id_seq',
  COALESCE((SELECT MAX(id) FROM budgets), 0) + 1,
  false
);

-- 3) Remove duplicate workspace rows (keep newest id)
DELETE FROM budgets old
USING budgets newer
WHERE old.workspace_id = newer.workspace_id
  AND old.id < newer.id;

-- 4) Unique constraint (required for app + upsert)
ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_workspace_id_key;
ALTER TABLE budgets
  ADD CONSTRAINT budgets_workspace_id_key UNIQUE (workspace_id);

-- 5) Row Level Security
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read budgets" ON budgets;
DROP POLICY IF EXISTS "Allow anon insert budgets" ON budgets;
DROP POLICY IF EXISTS "Allow anon update budgets" ON budgets;

CREATE POLICY "Allow anon read budgets"
  ON budgets FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow anon insert budgets"
  ON budgets FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow anon update budgets"
  ON budgets FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 6) ADD BUDGET — change 'TEST' and 50000 below
-- (works even without ON CONFLICT)
-- ============================================================

UPDATE budgets
SET amount = 50000,
    updated_at = NOW()
WHERE workspace_id = 'TEST';

INSERT INTO budgets (workspace_id, amount, updated_at)
SELECT 'TEST', 50000, NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM budgets WHERE workspace_id = 'TEST'
);

-- Verify:
SELECT * FROM budgets;
