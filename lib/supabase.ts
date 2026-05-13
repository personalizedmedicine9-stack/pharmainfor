/**
 * Supabase client for PharmaInsight.
 * Active database: Supabase PostgreSQL (eu-central-1)
 *
 * Tables: interaction_reports, pharmacology_reports, search_history, pdf_reports,
 *         user_profiles, saved_reports, cached_queries, scientific_synonyms
 * RLS: Enabled with public read/insert/delete policies
 * Auth-gated: saved_reports (user_id ownership checks)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const USE_SUPABASE = process.env.USE_SUPABASE === 'true';

interface SupabaseConfig {
  url: string | null;
  anonKey: string | null;
  isConfigured: boolean;
  isActive: boolean;
}

const config: SupabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null,
  isConfigured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  isActive: USE_SUPABASE && !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
};

export function getSupabaseConfig(): SupabaseConfig {
  return config;
}

export function isSupabaseConfigured(): boolean {
  return config.isConfigured;
}

export function isSupabaseActive(): boolean {
  return config.isActive;
}

// Singleton Supabase client
let _supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!config.isConfigured) {
    return null;
  }
  if (!_supabaseClient) {
    _supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _supabaseClient;
}

// ═══════════════════════════════════════════════════════════
// TYPES — Match your actual Supabase schema
// ═══════════════════════════════════════════════════════════

export interface StructuredReference {
  pmid: string;
  doi?: string;
  title: string;
  journal: string;
  year: number;
  study_type: string;
  source: 'PubMed' | 'CrossRef' | 'OpenAlex' | 'OpenFDA';
}

// ─── Interaction Reports ───
export interface InteractionReportInsert {
  user_id?: string;
  drug_name: string;
  herb_name: string;
  interaction_type?: string;
  severity?: string;
  mechanism?: string;
  confidence_score?: number;
  evidence_level?: string;
  ref_list?: StructuredReference[];
  study_results?: Record<string, unknown>[];
  fda_data?: Record<string, unknown> | null;
  sources_used?: string[];
  top_citation_count?: number;
  total_studies?: number;
}

export interface InteractionReportRow extends InteractionReportInsert {
  id: string;
  created_at: string;
}

// ─── Pharmacology Reports ───
export interface PharmacologyReportInsert {
  user_id?: string;
  compound_name?: string;
  herb_name: string;
  mechanisms?: Record<string, unknown>[];
  active_compounds?: Record<string, unknown>[];
  pharmacological_actions?: Record<string, unknown>[];
  evidence_score?: number;
  evidence_level?: string;
  confidence?: string;
  ref_list?: StructuredReference[];
  sources_used?: string[];
}

export interface PharmacologyReportRow extends PharmacologyReportInsert {
  id: string;
  created_at: string;
}

// ─── Search History ───
export interface SearchHistoryInsert {
  query: string;
  engine_type?: string;
  drug?: string;
  herb?: string;
  results_count?: number;
  sources_used?: string[];
  top_citation_count?: number;
  has_fda_data?: boolean;
}

export interface SearchHistoryRow extends SearchHistoryInsert {
  id: string;
  searched_at: string;
}

// ─── PDF Reports ───
export interface PdfReportInsert {
  report_type: string;
  report_data: Record<string, unknown>;
  pdf_url?: string;
  drug_name?: string;
  herb_name?: string;
}

export interface PdfReportRow extends PdfReportInsert {
  id: string;
  created_at: string;
}

// ─── User Profiles ───
export interface UserProfileInsert {
  id: string; // UUID from auth.users
  email: string;
  display_name?: string;
}

export interface UserProfileRow extends UserProfileInsert {
  created_at: string;
}

// ─── Saved Reports (auth-gated) ───
export interface SavedReportInsert {
  user_id: string;
  report_id: string;
  report_type: 'interaction' | 'pharmacology';
  report_data: Record<string, unknown>;
  drug_name?: string;
  herb_name?: string;
  evidence_score?: number;
  evidence_level?: string;
  confidence?: string;
}

export interface SavedReportRow extends SavedReportInsert {
  id: string;
  created_at: string;
}

// ─── Cached Queries ───
export interface CachedQueryInsert {
  cache_key: string;
  query_type: string;
  query_params?: Record<string, unknown>;
  results: Record<string, unknown>;
  sources_used?: string[];
  result_count?: number;
  expires_at: string;
}

export interface CachedQueryRow extends CachedQueryInsert {
  id: string;
  created_at: string;
}

// ─── Scientific Synonyms ───
export interface ScientificSynonymInsert {
  term: string;
  canonical: string;
  term_type: 'drug' | 'herb' | 'compound' | 'phytochemical';
}

export interface ScientificSynonymRow extends ScientificSynonymInsert {
  id: string;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════
// CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════

/**
 * Save an interaction report to Supabase.
 */
export async function saveInteractionReport(report: InteractionReportInsert): Promise<InteractionReportRow> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('interaction_reports')
    .insert(report)
    .select()
    .single();
  if (error) {
    console.error('[Supabase] saveInteractionReport error:', error.message);
    throw error;
  }
  return data;
}

/**
 * Save a pharmacology report to Supabase.
 */
export async function savePharmacologyReport(report: PharmacologyReportInsert): Promise<PharmacologyReportRow> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('pharmacology_reports')
    .insert(report)
    .select()
    .single();
  if (error) {
    console.error('[Supabase] savePharmacologyReport error:', error.message);
    throw error;
  }
  return data;
}

/**
 * Save a search history entry to Supabase.
 */
export async function saveSearchHistory(entry: SearchHistoryInsert): Promise<SearchHistoryRow> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('search_history')
    .insert(entry)
    .select()
    .single();
  if (error) {
    console.error('[Supabase] saveSearchHistory error:', error.message);
    throw error;
  }
  return data;
}

/**
 * Save a PDF report to Supabase.
 */
export async function savePdfReport(report: PdfReportInsert): Promise<PdfReportRow> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('pdf_reports')
    .insert(report)
    .select()
    .single();
  if (error) {
    console.error('[Supabase] savePdfReport error:', error.message);
    throw error;
  }
  return data;
}

/**
 * Get recent interaction reports.
 */
export async function getRecentInteractionReports(limit = 20): Promise<InteractionReportRow[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('interaction_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('[Supabase] getRecentInteractionReports error:', error.message);
    throw error;
  }
  return data || [];
}

/**
 * Get recent pharmacology reports.
 */
export async function getRecentPharmacologyReports(limit = 20): Promise<PharmacologyReportRow[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('pharmacology_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('[Supabase] getRecentPharmacologyReports error:', error.message);
    throw error;
  }
  return data || [];
}

/**
 * Get search history.
 */
export async function getSearchHistoryFromSupabase(limit = 50): Promise<SearchHistoryRow[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('search_history')
    .select('*')
    .order('searched_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('[Supabase] getSearchHistory error:', error.message);
    throw error;
  }
  return data || [];
}

/**
 * Get a single interaction report by ID.
 */
export async function getInteractionReportById(id: string): Promise<InteractionReportRow | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('interaction_reports')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('[Supabase] getInteractionReportById error:', error.message);
    throw error;
  }
  return data;
}

/**
 * Get a single pharmacology report by ID.
 */
export async function getPharmacologyReportById(id: string): Promise<PharmacologyReportRow | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('pharmacology_reports')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('[Supabase] getPharmacologyReportById error:', error.message);
    throw error;
  }
  return data;
}

/**
 * Delete a report by ID and type.
 */
export async function deleteReport(table: 'interaction_reports' | 'pharmacology_reports' | 'pdf_reports' | 'search_history' | 'saved_reports' | 'cached_queries', id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);
  if (error) {
    console.error(`[Supabase] deleteReport(${table}) error:`, error.message);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════
// AUTH-AWARE OPERATIONS — Saved Reports
// ═══════════════════════════════════════════════════════════

/**
 * Save a report (requires user_id from auth).
 */
export async function saveUserReport(report: SavedReportInsert): Promise<SavedReportRow> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('saved_reports')
    .insert(report)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Get current user's saved reports.
 */
export async function getUserSavedReports(userId: string, reportType?: string): Promise<SavedReportRow[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];
  let query = supabase
    .from('saved_reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (reportType) query = query.eq('report_type', reportType);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Delete a saved report (checks user_id ownership).
 */
export async function deleteUserSavedReport(userId: string, reportId: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const { error } = await supabase
    .from('saved_reports')
    .delete()
    .eq('user_id', userId)
    .eq('id', reportId);
  if (error) throw error;
}

// ═══════════════════════════════════════════════════════════
// CACHE OPERATIONS
// ═══════════════════════════════════════════════════════════

/**
 * Get cached query results.
 */
export async function getCachedQuery(cacheKey: string): Promise<CachedQueryRow | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('cached_queries')
    .select('*')
    .eq('cache_key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (error) {
    console.error('[Supabase] getCachedQuery error:', error.message);
    return null;
  }
  return data;
}

/**
 * Save query to cache.
 */
export async function setCachedQuery(cache: CachedQueryInsert): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const { error } = await supabase
    .from('cached_queries')
    .upsert(cache, { onConflict: 'cache_key' });
  if (error) {
    console.error('[Supabase] setCachedQuery error:', error.message);
  }
}

// ═══════════════════════════════════════════════════════════
// SCIENTIFIC SYNONYM LOOKUP
// ═══════════════════════════════════════════════════════════

/**
 * Look up scientific synonyms.
 */
export async function lookupSynonyms(term: string, termType?: string): Promise<ScientificSynonymRow[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];
  let query = supabase
    .from('scientific_synonyms')
    .select('*')
    .eq('term', term.toLowerCase());
  if (termType) query = query.eq('term_type', termType);
  const { data, error } = await query;
  if (error) return [];
  return data || [];
}

/**
 * Test Supabase connection.
 */
export async function testSupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return { ok: false, message: 'Supabase is not configured. Using local auth instead.' };
    const { data, error } = await supabase
      .from('search_history')
      .select('id')
      .limit(1);
    if (error) {
      return { ok: false, message: `Connection failed: ${error.message}` };
    }
    return { ok: true, message: 'Supabase connection successful!' };
  } catch (err: any) {
    return { ok: false, message: `Connection error: ${err.message}` };
  }
}
