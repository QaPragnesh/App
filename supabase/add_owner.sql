-- Run this in Supabase SQL Editor

-- 1) Add owner column to workspaces
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS owner_name TEXT;

-- 2) Set Pragnesh as owner on all existing workspaces (change WHERE if you only want one workspace)
UPDATE workspaces
SET owner_name = 'Pragnesh'
WHERE owner_name IS NULL OR owner_name = '';

-- Or set owner on one workspace by name:
-- UPDATE workspaces SET owner_name = 'Pragnesh' WHERE name ILIKE 'YOUR WORKSPACE NAME';

-- 3) Allow updating owner_name from the app
DROP POLICY IF EXISTS "Allow anon update workspaces" ON workspaces;
CREATE POLICY "Allow anon update workspaces"
  ON workspaces FOR UPDATE TO anon, authenticated
  USING (true) WITH CHECK (true);
