-- Workspace-wise monthly budget (one budget per workspace)

CREATE TABLE IF NOT EXISTS budgets (
  workspace_id TEXT PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- If table already exists without PK, run this in SQL Editor:
-- ALTER TABLE budgets ADD CONSTRAINT budgets_workspace_id_key UNIQUE (workspace_id);

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
