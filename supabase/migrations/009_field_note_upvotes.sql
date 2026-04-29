-- Tracks individual upvotes so each lawyer can upvote a given note at most once.
-- The (note_id, upvoter_id) composite primary key enforces the uniqueness server-side;
-- duplicate inserts will fail with 23505 and the API translates that into a 409.

CREATE TABLE IF NOT EXISTS field_note_upvotes (
  note_id UUID NOT NULL REFERENCES field_notes(id) ON DELETE CASCADE,
  upvoter_id UUID NOT NULL REFERENCES lawyers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (note_id, upvoter_id)
);

CREATE INDEX IF NOT EXISTS idx_field_note_upvotes_upvoter
  ON field_note_upvotes(upvoter_id);
