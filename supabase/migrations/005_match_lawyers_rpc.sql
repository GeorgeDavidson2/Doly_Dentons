-- match_lawyers: cosine similarity search over lawyer embeddings
--
-- Finds lawyers whose profiles are semantically similar to a matter's requirements,
-- filtered to lawyers who have jurisdiction expertise in at least one of the
-- requested jurisdiction_codes.
--
-- Returns results ordered by cosine similarity descending.

DROP FUNCTION IF EXISTS match_lawyers(vector, text[], integer);

CREATE OR REPLACE FUNCTION match_lawyers(
  query_embedding vector(384),
  jurisdiction_codes text[],
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  full_name text,
  title text,
  office_city text,
  office_country text,
  timezone text,
  languages text[],
  reputation_score int,
  similarity float,
  matched_jurisdictions text[]
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    l.id,
    l.full_name,
    l.title,
    l.office_city,
    l.office_country,
    l.timezone,
    l.languages,
    l.reputation_score,
    (1 - (l.embedding <=> query_embedding))::float AS similarity,
    array_agg(lj.jurisdiction_code ORDER BY lj.jurisdiction_code) AS matched_jurisdictions
  FROM lawyers l
  JOIN lawyer_jurisdictions lj ON lj.lawyer_id = l.id
  WHERE lj.jurisdiction_code = ANY(jurisdiction_codes)
    AND l.embedding IS NOT NULL
  GROUP BY
    l.id,
    l.full_name,
    l.title,
    l.office_city,
    l.office_country,
    l.timezone,
    l.languages,
    l.reputation_score,
    l.embedding
  ORDER BY (1 - (l.embedding <=> query_embedding)) DESC
  LIMIT match_count;
$$;
