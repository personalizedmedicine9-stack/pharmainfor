-- PharmaInsight Supabase Schema v2
-- Add saved_reports and cached_queries tables
-- Run this in Supabase SQL Editor to add the missing tables

-- ═══════════════════════════════════════════════════════════
-- SAVED REPORTS (Bookmark system)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS saved_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('interaction', 'pharmacology')),
  report_data JSONB DEFAULT '{}',
  drug_name TEXT,
  herb_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for quick lookup by report_id
CREATE INDEX IF NOT EXISTS idx_saved_reports_report_id ON saved_reports (report_id);
CREATE INDEX IF NOT EXISTS idx_saved_reports_type ON saved_reports (report_type);
CREATE INDEX IF NOT EXISTS idx_saved_reports_created ON saved_reports (created_at DESC);

-- Prevent duplicate bookmarks
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_reports_unique ON saved_reports (report_id);

-- RLS
ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read saved reports" ON saved_reports
  FOR SELECT USING (true);

CREATE POLICY "Public insert saved reports" ON saved_reports
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public delete saved reports" ON saved_reports
  FOR DELETE USING (true);

-- ═══════════════════════════════════════════════════════════
-- CACHED QUERIES (API caching)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cached_queries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  query_type TEXT NOT NULL CHECK (query_type IN ('interaction', 'pharmacology')),
  query_params JSONB DEFAULT '{}',
  results JSONB DEFAULT '[]',
  sources_used JSONB DEFAULT '[]',
  result_count INT DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast cache lookup
CREATE INDEX IF NOT EXISTS idx_cached_queries_key ON cached_queries (cache_key);
CREATE INDEX IF NOT EXISTS idx_cached_queries_expires ON cached_queries (expires_at);

-- RLS
ALTER TABLE cached_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read cached queries" ON cached_queries
  FOR SELECT USING (true);

CREATE POLICY "Public insert cached queries" ON cached_queries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update cached queries" ON cached_queries
  FOR UPDATE USING (true);

CREATE POLICY "Public delete cached queries" ON cached_queries
  FOR DELETE USING (true);
