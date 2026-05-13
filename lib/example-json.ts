/**
 * Example structured JSON for PharmaInsight JSONB fields.
 * These demonstrate the expected format for Supabase migration.
 */

export const EXAMPLE_REFERENCE = {
  pmid: "39275211",
  doi: "10.1002/j.1553-3840.2024.tb12345.x",
  title: "Clinical evaluation of warfarin-st. john's wort interaction: a systematic review",
  journal: "British Journal of Clinical Pharmacology",
  year: 2024,
  study_type: "systematic review",
  source: "PubMed" as const,
};

export const EXAMPLE_INTERACTION_REFERENCES = [
  {
    pmid: "39275211",
    doi: "10.1002/j.1553-3840.2024.tb12345.x",
    title: "Clinical evaluation of warfarin-st. john's wort interaction",
    journal: "British Journal of Clinical Pharmacology",
    year: 2024,
    study_type: "systematic review",
    source: "PubMed" as const,
  },
  {
    pmid: "38891234",
    doi: "10.1016/j.ejphar.2024.176234",
    title: "CYP2C9 and CYP3A4 modulation by hyperforin: mechanistic insights",
    journal: "European Journal of Pharmacology",
    year: 2024,
    study_type: "in vitro",
    source: "PubMed" as const,
  },
];

export const EXAMPLE_MECHANISMS = [
  {
    name: "CYP3A4 Induction",
    description: "Hyperforin induces CYP3A4 expression via PXR activation, leading to increased metabolism of CYP3A4 substrates",
    pmids: ["38891234", "38567123"],
    evidence_type: "mechanistic",
    validation: "in vitro",
  },
  {
    name: "P-glycoprotein Upregulation",
    description: "St. John's wort extracts increase P-gp expression and transport activity",
    pmids: ["38765432"],
    evidence_type: "mechanistic",
    validation: "animal",
  },
];

export const EXAMPLE_ACTIVE_COMPOUNDS = [
  {
    name: "Hypericin",
    category: "Anthraquinones",
    pmids: ["39275211", "38891234"],
    concentration: "0.1-0.3% dry weight",
  },
  {
    name: "Hyperforin",
    category: "Phthalides",
    pmids: ["39275211"],
    concentration: "2-4% dry weight",
  },
];

export const EXAMPLE_PHARMACOLOGICAL_ACTIONS = [
  {
    name: "CYP3A4 Induction",
    score: 85,
    pmids: ["38891234", "38567123", "38765432"],
    mechanisms: [
      { name: "PXR Receptor Activation", pmids: ["38891234"] },
      { name: "Increased CYP3A4 mRNA Expression", pmids: ["38567123"] },
    ],
  },
  {
    name: "Antidepressant Activity",
    score: 72,
    pmids: ["39275211", "38456789"],
    mechanisms: [
      { name: "Serotonin Reuptake Inhibition", pmids: ["39275211"] },
      { name: "Monoamine Oxidase Inhibition", pmids: ["38456789"] },
    ],
  },
];

export const EXAMPLE_REPORT_DATA = {
  interaction: {
    drug: "Warfarin",
    herb: "St. John's Wort",
    interaction_type: "Pharmacokinetic",
    severity: "Major",
    mechanism: "CYP3A4 and CYP2C9 induction leading to decreased warfarin plasma concentrations and reduced anticoagulant effect",
    confidence_score: 78,
    evidence_level: "High",
    references_count: 12,
    fda_signal: true,
  },
  pharmacology: {
    herb: "Turmeric",
    compound_count: 5,
    action_count: 8,
    evidence_score: 72,
    evidence_level: "Moderate",
    confidence: "Moderate",
  },
};

export const EXAMPLE_EVIDENCE_BREAKDOWN = {
  studyTypeScore: 35,
  studyTypeDetail: "systematic review",
  journalQualityScore: 20,
  journalQualityDetail: "Q1 - High-impact journal",
  validationScore: 20,
  validationDetail: "Human validated",
  contradictionPenalty: 0,
  rawScore: 75,
  normalizedScore: 94,
  evidenceLevel: "High",
  confidenceCategory: "Strong",
  rationale: "This systematic review from a Q1 journal with human clinical validation provides strong evidence. No contradictory evidence detected.",
};
