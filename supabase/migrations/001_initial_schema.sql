-- ============================================================
-- Doly — Initial Schema
-- Run this in Supabase SQL editor or via supabase db push
-- ============================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- TABLES
-- ============================================================

-- Lawyers (base profile)
CREATE TABLE lawyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  title TEXT NOT NULL,
  office_city TEXT NOT NULL,
  office_country TEXT NOT NULL,
  timezone TEXT NOT NULL, -- IANA timezone e.g. "America/Bogota"
  languages TEXT[] NOT NULL DEFAULT '{}',
  bio TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  reputation_score INTEGER NOT NULL DEFAULT 0,
  matters_count INTEGER NOT NULL DEFAULT 0,
  contributions INTEGER NOT NULL DEFAULT 0,
  embedding vector(384),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lawyer jurisdiction expertise matrix
CREATE TABLE lawyer_jurisdictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id UUID NOT NULL REFERENCES lawyers(id) ON DELETE CASCADE,
  jurisdiction_code TEXT NOT NULL, -- ISO 3166-1 alpha-2 e.g. "CO", "DE"
  jurisdiction_name TEXT NOT NULL,
  expertise_level INTEGER NOT NULL CHECK (expertise_level BETWEEN 1 AND 5),
  matter_types TEXT[] NOT NULL DEFAULT '{}',
  years_experience INTEGER NOT NULL DEFAULT 0,
  UNIQUE(lawyer_id, jurisdiction_code)
);

-- Matters (cases/projects)
CREATE TABLE matters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  client_name TEXT NOT NULL,
  matter_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  lead_lawyer_id UUID NOT NULL REFERENCES lawyers(id),
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Matter jurisdictions (many-to-many)
CREATE TABLE matter_jurisdictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  jurisdiction_code TEXT NOT NULL,
  jurisdiction_name TEXT NOT NULL,
  UNIQUE(matter_id, jurisdiction_code)
);

-- AI-generated jurisdiction briefings
CREATE TABLE context_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  jurisdiction_code TEXT NOT NULL,
  jurisdiction_name TEXT NOT NULL,
  legal_landscape TEXT,
  cultural_intelligence TEXT,
  regulatory_notes TEXT,
  status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'ready', 'error')),
  embedding vector(384),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(matter_id, jurisdiction_code)
);

-- Matter team membership
CREATE TABLE matter_team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  lawyer_id UUID NOT NULL REFERENCES lawyers(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'collaborator' CHECK (role IN ('lead', 'collaborator', 'reviewer')),
  match_score FLOAT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(matter_id, lawyer_id)
);

-- Tasks (Flow engine)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES lawyers(id),
  required_jurisdiction TEXT,
  required_expertise TEXT[] NOT NULL DEFAULT '{}',
  due_date TIMESTAMPTZ,
  handoff_context TEXT,
  handoff_from UUID REFERENCES lawyers(id),
  timezone_window TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Task handoff audit trail
CREATE TABLE task_handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  from_lawyer_id UUID REFERENCES lawyers(id),
  to_lawyer_id UUID NOT NULL REFERENCES lawyers(id),
  from_timezone TEXT,
  to_timezone TEXT NOT NULL,
  context_snapshot TEXT NOT NULL DEFAULT '',
  routed_by TEXT NOT NULL DEFAULT 'flow_engine' CHECK (routed_by IN ('flow_engine', 'manual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Jurisdiction field notes (knowledge base)
CREATE TABLE field_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES lawyers(id) ON DELETE CASCADE,
  jurisdiction_code TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  matter_type TEXT,
  visibility TEXT NOT NULL DEFAULT 'firm' CHECK (visibility IN ('firm', 'private')),
  upvotes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reputation events
CREATE TABLE reputation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id UUID NOT NULL REFERENCES lawyers(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'matter_joined', 'brief_generated', 'note_contributed',
    'note_upvoted', 'handoff_completed', 'match_accepted',
    'profile_completed', 'cross_border_matter'
  )),
  points INTEGER NOT NULL,
  matter_id UUID REFERENCES matters(id),
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lawyer availability windows
CREATE TABLE lawyer_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id UUID NOT NULL REFERENCES lawyers(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun, 6=Sat
  work_start_hour INTEGER NOT NULL CHECK (work_start_hour BETWEEN 0 AND 23),
  work_end_hour INTEGER NOT NULL CHECK (work_end_hour BETWEEN 1 AND 24),
  timezone TEXT NOT NULL,
  UNIQUE(lawyer_id, day_of_week)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Vector similarity (IVFFlat for approximate nearest neighbor)
CREATE INDEX ON lawyers USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON context_briefs USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Standard query performance
CREATE INDEX ON lawyers (office_country);
CREATE INDEX ON lawyer_jurisdictions (lawyer_id);
CREATE INDEX ON lawyer_jurisdictions (jurisdiction_code);
CREATE INDEX ON matters (lead_lawyer_id);
CREATE INDEX ON matters (status);
CREATE INDEX ON matter_team (matter_id);
CREATE INDEX ON matter_team (lawyer_id);
CREATE INDEX ON tasks (matter_id, status);
CREATE INDEX ON tasks (assigned_to, status);
CREATE INDEX ON context_briefs (matter_id, status);
CREATE INDEX ON field_notes (jurisdiction_code);
CREATE INDEX ON field_notes (author_id);
CREATE INDEX ON reputation_events (lawyer_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE lawyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_jurisdictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matters ENABLE ROW LEVEL SECURITY;
ALTER TABLE matter_jurisdictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE matter_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_availability ENABLE ROW LEVEL SECURITY;

-- Lawyers: anyone authenticated can read; only own row can be updated
CREATE POLICY "Lawyers are viewable by authenticated users"
  ON lawyers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Lawyers can update their own profile"
  ON lawyers FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Lawyer jurisdictions: readable by all authenticated
CREATE POLICY "Lawyer jurisdictions are viewable by authenticated users"
  ON lawyer_jurisdictions FOR SELECT
  TO authenticated
  USING (true);

-- Matters: readable by team members only
CREATE POLICY "Matters are viewable by team members"
  ON matters FOR SELECT
  TO authenticated
  USING (
    lead_lawyer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM matter_team
      WHERE matter_team.matter_id = matters.id
      AND matter_team.lawyer_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create matters"
  ON matters FOR INSERT
  TO authenticated
  WITH CHECK (lead_lawyer_id = auth.uid());

CREATE POLICY "Lead lawyer can update matter"
  ON matters FOR UPDATE
  TO authenticated
  USING (lead_lawyer_id = auth.uid());

-- Matter jurisdictions: readable by matter team
CREATE POLICY "Matter jurisdictions viewable by team"
  ON matter_jurisdictions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM matters
      WHERE matters.id = matter_jurisdictions.matter_id
      AND (
        matters.lead_lawyer_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM matter_team
          WHERE matter_team.matter_id = matters.id
          AND matter_team.lawyer_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Authenticated users can insert matter jurisdictions"
  ON matter_jurisdictions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Context briefs: readable by matter team
CREATE POLICY "Context briefs viewable by matter team"
  ON context_briefs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM matters
      WHERE matters.id = context_briefs.matter_id
      AND (
        matters.lead_lawyer_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM matter_team
          WHERE matter_team.matter_id = matters.id
          AND matter_team.lawyer_id = auth.uid()
        )
      )
    )
  );

-- Matter team: readable by team members
CREATE POLICY "Matter team viewable by team members"
  ON matter_team FOR SELECT
  TO authenticated
  USING (
    lawyer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM matters
      WHERE matters.id = matter_team.matter_id
      AND matters.lead_lawyer_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can insert matter team members"
  ON matter_team FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Tasks: readable by matter team
CREATE POLICY "Tasks viewable by matter team"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM matter_team
      WHERE matter_team.matter_id = tasks.matter_id
      AND matter_team.lawyer_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can insert tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (true);

-- Task handoffs: readable by involved lawyers
CREATE POLICY "Task handoffs viewable by involved lawyers"
  ON task_handoffs FOR SELECT
  TO authenticated
  USING (
    from_lawyer_id = auth.uid()
    OR to_lawyer_id = auth.uid()
  );

-- Field notes: firm-wide notes readable by all; private only by author
CREATE POLICY "Firm field notes viewable by authenticated users"
  ON field_notes FOR SELECT
  TO authenticated
  USING (
    visibility = 'firm'
    OR author_id = auth.uid()
  );

CREATE POLICY "Authenticated users can create field notes"
  ON field_notes FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update their field notes"
  ON field_notes FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid());

-- Reputation events: readable by all (leaderboard); insert via service role only
CREATE POLICY "Reputation events are publicly readable"
  ON reputation_events FOR SELECT
  TO authenticated
  USING (true);

-- Lawyer availability: readable by all authenticated
CREATE POLICY "Lawyer availability viewable by authenticated users"
  ON lawyer_availability FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- HELPER FUNCTION: increment reputation score
-- Called by API routes after inserting reputation_events
-- ============================================================
CREATE OR REPLACE FUNCTION increment_reputation(lawyer_uuid UUID, points_to_add INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE lawyers
  SET reputation_score = reputation_score + points_to_add
  WHERE id = lawyer_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- HELPER FUNCTION: vector similarity search for Connect
-- ============================================================
CREATE OR REPLACE FUNCTION match_lawyers(
  query_embedding vector(384),
  jurisdiction_codes TEXT[],
  match_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  lawyer_id UUID,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    l.id AS lawyer_id,
    1 - (l.embedding <=> query_embedding) AS similarity
  FROM lawyers l
  JOIN lawyer_jurisdictions lj ON lj.lawyer_id = l.id
  WHERE
    lj.jurisdiction_code = ANY(jurisdiction_codes)
    AND l.embedding IS NOT NULL
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
