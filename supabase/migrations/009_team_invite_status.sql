-- Add invite status to matter_team
-- Existing rows default to 'accepted' since they were added before this flow existed
ALTER TABLE matter_team
  ADD COLUMN status TEXT NOT NULL DEFAULT 'accepted'
    CHECK (status IN ('pending', 'accepted', 'declined'));
