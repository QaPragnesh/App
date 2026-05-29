-- Run once: set workspace name = workspace id for all rows
UPDATE workspaces SET name = UPPER(id) WHERE name IS DISTINCT FROM UPPER(id);
