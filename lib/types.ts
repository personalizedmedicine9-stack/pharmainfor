export type EvidenceLevel = "High" | "Moderate" | "Low";
export type JournalQuality = "High-impact journal" | "Medium-impact journal" | "Low/uncertain quality";
export type RelevanceLabel = "HIGH" | "MEDIUM" | "LOW";
export type SeverityLevel = "Major" | "Moderate" | "Minor"; // No "Unknown" — always normalized
export type InteractionType = "Pharmacokinetic" | "Pharmacodynamic" | "Mixed"; // No "Unknown"
export type ClinicalRelevance = "Human Clinical" | "Animal/In Vitro" | "Unknown";
export type EvidenceConsistency = "Consistent" | "Conflicting" | "Insufficient";
export type ConfidenceLevel = "High" | "Moderate" | "Low";

export interface StudyResult {
  title: string;
  source: "PubMed";
  pubmedLink: string;
  pmid: string;
  doi?: string;
  doiLink?: string;
  journal: string;
  pubYear: string;
  authors: string[];
  abstract: string;
  citationCount: number;
  studyType: string;
  evidenceLevel: EvidenceLevel;
  journalQuality: JournalQuality;
  relevanceLabel: RelevanceLabel;
  relevanceScore: number;
  compositeScore: number;
  fdaWarnings: string[];
  severity: SeverityLevel;
  interactionType: InteractionType;
  clinicalRelevance: ClinicalRelevance;
  confidence: ConfidenceLevel;
  rationale?: string;
  mechanismDescription?: string; // Normalized mechanism from taxonomy
}

export interface FdaDrugData {
  warnings: string[];
  interactions: string[];
  brandNames: string[];
}

export interface SpellingCorrection {
  original: string;
  corrected: string;
  canonical?: string;
  synonymApplied?: boolean;
  wasAutoCorrected?: boolean;
}

export interface SearchResponse {
  results: StudyResult[];
  total: number;
  sourcesUsed: string[];
  fdaData: FdaDrugData | null;
  topCitationCount: number;
  fromCache: boolean;
  evidenceConsistency?: EvidenceConsistency;
  noEvidenceMessage?: string;
  error?: string;
  spellingCorrections?: {
    drug: SpellingCorrection | null;
    herb: SpellingCorrection | null;
  };
  confidenceReasoning?: string;
}

export interface PharmacologyAction {
  name: string;
  pmids: string[];
  score: number;
  mechanisms: { name: string; pmids: string[] }[];
}

export interface PharmacologyCompound {
  name: string;
  category: string;
  pmids: string[];
}

export interface PharmacologyResponse {
  herb: string;
  pharmacological_actions: PharmacologyAction[];
  active_compounds: PharmacologyCompound[];
  evidence_level: "High" | "Moderate" | "Low" | "No Evidence";
  confidence: "High" | "Moderate" | "Low";
  sourcesUsed: string[];
  noEvidenceMessage?: string;
  error?: string;
  spellingCorrection?: SpellingCorrection | null;
  confidenceReasoning?: string;
}

export interface SearchHistoryEntry {
  id: string;
  query: string;
  engineType: string;
  resultsCount: number;
  sourcesUsed: string[];
  topCitationCount: number;
  hasFdaData: boolean;
  timestamp: string;
}

export interface SavedReport {
  id: string;
  report_id: string;
  report_type: 'interaction' | 'pharmacology';
  report_data: Record<string, unknown>;
  drug_name?: string;
  herb_name?: string;
  created_at: string;
}
