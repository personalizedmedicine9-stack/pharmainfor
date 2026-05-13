-- PharmaInsight Supabase Schema (PostgreSQL)
-- Migration from SQLite to Supabase

CREATE TABLE interaction_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drug_name TEXT NOT NULL,
  herb_name TEXT NOT NULL,
  interaction_type TEXT DEFAULT 'Unknown',
  severity TEXT DEFAULT 'Unknown',
  mechanism TEXT DEFAULT '',
  confidence_score REAL DEFAULT 0,
  evidence_level TEXT DEFAULT 'Low',
  references JSONB DEFAULT '[]'::jsonb,
  evidence_breakdown JSONB DEFAULT '{}'::jsonb,
  sources_used TEXT[] DEFAULT '{}',
  fda_data JSONB,
  top_citation_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE pharmacology_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compound_name TEXT NOT NULL,
  herb_name TEXT NOT NULL,
  mechanisms JSONB DEFAULT '[]'::jsonb,
  active_compounds JSONB DEFAULT '[]'::jsonb,
  pharmacological_actions JSONB DEFAULT '[]'::jsonb,
  evidence_score REAL DEFAULT 0,
  evidence_level TEXT DEFAULT 'Low',
  confidence TEXT DEFAULT 'Low',
  references JSONB DEFAULT '[]'::jsonb,
  sources_used TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  engine_type TEXT DEFAULT 'interaction',
  results_count INTEGER DEFAULT 0,
  sources_used TEXT[] DEFAULT '{}',
  top_citation_count INTEGER DEFAULT 0,
  has_fda_data BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE pdf_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT DEFAULT 'interaction',
  report_data JSONB DEFAULT '{}'::jsonb,
  pdf_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_interaction_drug_herb ON interaction_reports(drug_name, herb_name);
CREATE INDEX idx_pharmacology_herb ON pharmacology_reports(herb_name);
CREATE INDEX idx_search_history_query ON search_history(query);
CREATE INDEX idx_interaction_created ON interaction_reports(created_at DESC);
CREATE INDEX idx_pharmacology_created ON pharmacology_reports(created_at DESC);
