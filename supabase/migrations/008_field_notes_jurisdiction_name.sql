-- Migration 008: Add jurisdiction_name to field_notes
-- The column was omitted from the initial schema but is needed for consistent
-- display without a join to a separate lookup table. All other jurisdiction
-- tables (matter_jurisdictions, lawyer_jurisdictions) store both code and name.

ALTER TABLE field_notes
  ADD COLUMN IF NOT EXISTS jurisdiction_name TEXT NOT NULL DEFAULT '';
