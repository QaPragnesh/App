-- Run in Supabase SQL Editor if login or add-member fails
-- Also run add_owner.sql to set workspace owner (e.g. Pragnesh)

-- Allow reading workspaces (needed for login)
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read workspaces" ON workspaces;
CREATE POLICY "Allow anon read workspaces"
  ON workspaces FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon insert workspaces" ON workspaces;
CREATE POLICY "Allow anon insert workspaces"
  ON workspaces FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update workspaces" ON workspaces;
CREATE POLICY "Allow anon update workspaces"
  ON workspaces FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Members table (see workspace_members.sql)
-- \i workspace_members.sql
