-- Run this in Supabase SQL Editor to enable owner-managed members

CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (workspace_id, name)
);

ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read workspace_members" ON workspace_members;
DROP POLICY IF EXISTS "Allow anon insert workspace_members" ON workspace_members;

CREATE POLICY "Allow anon read workspace_members"
  ON workspace_members FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow anon insert workspace_members"
  ON workspace_members FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update workspace_members" ON workspace_members;
DROP POLICY IF EXISTS "Allow anon delete workspace_members" ON workspace_members;

CREATE POLICY "Allow anon update workspace_members"
  ON workspace_members FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon delete workspace_members"
  ON workspace_members FOR DELETE TO anon, authenticated USING (true);
