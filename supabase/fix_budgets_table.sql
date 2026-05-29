-- Fix: null value in column "id" on budgets insert
-- Run this entire script in Supabase SQL Editor

-- 1) Create sequence and attach to budgets.id
CREATE SEQUENCE IF NOT EXISTS budgets_id_seq;

ALTER TABLE budgets
  ALTER COLUMN id SET DEFAULT nextval('budgets_id_seq');

ALTER SEQUENCE budgets_id_seq OWNED BY budgets.id;

-- 2) Sync sequence to max existing id
SELECT setval(
  'budgets_id_seq',
  COALESCE((SELECT MAX(id) FROM budgets), 0) + 1,
  false
);

-- 3) One budget per workspace
DELETE FROM budgets old
USING budgets newer
WHERE old.workspace_id = newer.workspace_id
  AND old.id < newer.id;

ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_workspace_id_key;
ALTER TABLE budgets
  ADD CONSTRAINT budgets_workspace_id_key UNIQUE (workspace_id);

-- 4) Test insert (change TEST / 50000 if needed)
INSERT INTO budgets (id, workspace_id, amount, updated_at)
VALUES (nextval('budgets_id_seq'), 'TEST', 50000, NOW());

SELECT * FROM budgets;
