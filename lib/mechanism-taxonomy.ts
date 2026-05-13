/**
 * Mechanism Taxonomy & Interaction Normalization
 *
 * Provides structured classification of drug-herb interaction mechanisms
 * into scientific categories, replacing generic placeholders like "MDT"
 * or "Unknown" with properly classified mechanism types.
 *
 * Categories:
 * - Metabolic (CYP enzyme interactions)
 * - Transporter (P-gp, efflux, uptake)
 * - Hematologic (platelet, coagulation)
 * - Neurological (serotonergic, GABAergic)
 * - Cardiovascular (BP, heart rate)
 * - Immunologic (immune modulation)
 * - Endocrine (hormonal)
 * - Renal (kidney excretion)
 * - Hepatobiliary (liver metabolism)
 */

// ─── Mechanism Taxonomy ───

export interface MechanismCategory {
  id: string;
  label: string;
  description: string;
  color: string; // For UI badges
  examples: string[];
}

export const MECHANISM_CATEGORIES: MechanismCategory[] = [
  {
    id: 'metabolic',
    label: 'Metabolic',
    description: 'Cytochrome P450 enzyme-mediated interactions affecting drug metabolism',
    color: 'bg-red-100 text-red-800 border-red-200',
    examples: [
      'CYP3A4 inhibition', 'CYP3A4 induction', 'CYP2D6 inhibition', 'CYP2D6 induction',
      'CYP2C9 inhibition', 'CYP2C9 induction', 'CYP2C19 inhibition', 'CYP2C19 induction',
      'CYP1A2 inhibition', 'CYP1A2 induction', 'CYP2E1 inhibition',
      'glucuronidation inhibition', 'phase I metabolism', 'phase II metabolism',
      'competitive CYP inhibition', 'mechanism-based CYP inhibition',
    ],
  },
  {
    id: 'transporter',
    label: 'Transporter',
    description: 'Drug transporter protein interactions affecting absorption, distribution, or excretion',
    color: 'bg-violet-100 text-violet-800 border-violet-200',
    examples: [
      'P-glycoprotein inhibition', 'P-glycoprotein induction', 'P-glycoprotein modulation',
      'BCRP inhibition', 'OATP inhibition', 'OAT inhibition', 'OCT inhibition',
      'MRP2 inhibition', 'efflux transporter modulation', 'uptake transporter inhibition',
    ],
  },
  {
    id: 'hematologic',
    label: 'Hematologic',
    description: 'Interactions affecting blood coagulation, platelet function, or bleeding risk',
    color: 'bg-rose-100 text-rose-800 border-rose-200',
    examples: [
      'platelet aggregation inhibition', 'anticoagulant potentiation',
      'warfarin potentiation', 'bleeding risk augmentation',
      'thrombin inhibition', 'factor X modulation', 'fibrinolysis enhancement',
      'antiplatelet synergism', 'coagulation cascade interference',
    ],
  },
  {
    id: 'neurological',
    label: 'Neurological',
    description: 'Interactions affecting neurotransmitter systems or central nervous function',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    examples: [
      'serotonergic potentiation', 'serotonin reuptake inhibition',
      'GABAergic potentiation', 'dopaminergic modulation',
      'cholinergic interaction', 'adrenergic potentiation',
      'MAO inhibition', 'CNS depression augmentation',
      'sedative potentiation', 'seizure threshold alteration',
    ],
  },
  {
    id: 'cardiovascular',
    label: 'Cardiovascular',
    description: 'Interactions affecting blood pressure, heart rate, or cardiac function',
    color: 'bg-pink-100 text-pink-800 border-pink-200',
    examples: [
      'antihypertensive potentiation', 'QT interval prolongation',
      'heart rate modulation', 'vasodilatory synergism',
      'cardiac contractility alteration', 'arrhythmogenic potential',
    ],
  },
  {
    id: 'immunologic',
    label: 'Immunologic',
    description: 'Interactions affecting immune system function or immunosuppressant levels',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    examples: [
      'immunosuppressant level alteration', 'immunomodulatory interaction',
      'cytokine modulation', 'immune activation', 'immune suppression',
    ],
  },
  {
    id: 'endocrine',
    label: 'Endocrine',
    description: 'Interactions affecting hormonal pathways or endocrine function',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    examples: [
      'hypoglycemic potentiation', 'thyroid hormone alteration',
      'cortisol modulation', 'estrogenic interaction', 'antiandrogenic effect',
    ],
  },
  {
    id: 'pharmacodynamic',
    label: 'Pharmacodynamic',
    description: 'Additive, synergistic, or antagonistic pharmacological effects at the receptor level',
    color: 'bg-sky-100 text-sky-800 border-sky-200',
    examples: [
      'additive hypotensive effect', 'synergistic anti-inflammatory effect',
      'antagonistic pharmacodynamic effect', 'receptor competition',
      'parallel pharmacological pathway', 'opposing physiological effects',
    ],
  },
  {
    id: 'hepatobiliary',
    label: 'Hepatobiliary',
    description: 'Interactions affecting liver function, biliary excretion, or hepatotoxicity risk',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    examples: [
      'hepatotoxicity potentiation', 'biliary excretion interference',
      'hepatic blood flow alteration', 'cholestatic interaction',
    ],
  },
  {
    id: 'renal',
    label: 'Renal',
    description: 'Interactions affecting renal clearance, tubular secretion, or nephrotoxicity',
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    examples: [
      'renal clearance reduction', 'nephrotoxicity potentiation',
      'tubular secretion competition', 'electrolyte disturbance',
    ],
  },
];

// ─── Mechanism Classification Map ───

const MECHANISM_CLASSIFICATION: Record<string, string> = {};

// Build the classification map from examples
for (const category of MECHANISM_CATEGORIES) {
  for (const example of category.examples) {
    MECHANISM_CLASSIFICATION[example.toLowerCase()] = category.id;
  }
}

// ─── Keyword-based detection patterns ───

const MECHANISM_PATTERNS: { pattern: RegExp; category: string; mechanism: string }[] = [
  // Metabolic (CYP)
  { pattern: /\bcyp3a4\b/i, category: 'metabolic', mechanism: 'CYP3A4 inhibition' },
  { pattern: /\bcyp2d6\b/i, category: 'metabolic', mechanism: 'CYP2D6 inhibition' },
  { pattern: /\bcyp2c9\b/i, category: 'metabolic', mechanism: 'CYP2C9 inhibition' },
  { pattern: /\bcyp2c19\b/i, category: 'metabolic', mechanism: 'CYP2C19 inhibition' },
  { pattern: /\bcyp1a2\b/i, category: 'metabolic', mechanism: 'CYP1A2 inhibition' },
  { pattern: /\bcyp2e1\b/i, category: 'metabolic', mechanism: 'CYP2E1 inhibition' },
  { pattern: /\bcyp\s?\d\w+\s+inhibit/i, category: 'metabolic', mechanism: 'CYP-mediated metabolic inhibition' },
  { pattern: /\bcyp\s?\d\w+\s+induc/i, category: 'metabolic', mechanism: 'CYP-mediated metabolic induction' },
  { pattern: /\bmetabol(i|o)/i, category: 'metabolic', mechanism: 'Metabolic interaction' },
  { pattern: /\bglucuronid/i, category: 'metabolic', mechanism: 'Glucuronidation interaction' },
  { pattern: /\bbioavailabilit/i, category: 'metabolic', mechanism: 'Bioavailability alteration' },
  { pattern: /\bfirst.?pass/i, category: 'metabolic', mechanism: 'First-pass metabolism alteration' },
  { pattern: /\bclearance\s+(reduc|decreas|alter)/i, category: 'metabolic', mechanism: 'Metabolic clearance reduction' },

  // Transporter
  { pattern: /\bp.?glycoprotein\b/i, category: 'transporter', mechanism: 'P-glycoprotein modulation' },
  { pattern: /\bp.?gp\b/i, category: 'transporter', mechanism: 'P-glycoprotein modulation' },
  { pattern: /\bpgp\b/i, category: 'transporter', mechanism: 'P-glycoprotein modulation' },
  { pattern: /\bbrcp\b/i, category: 'transporter', mechanism: 'BCRP inhibition' },
  { pattern: /\boatp\b/i, category: 'transporter', mechanism: 'OATP inhibition' },
  { pattern: /\boat\b\s+\d/i, category: 'transporter', mechanism: 'OAT inhibition' },
  { pattern: /\boct\b\s+\d/i, category: 'transporter', mechanism: 'OCT inhibition' },
  { pattern: /\btransport/i, category: 'transporter', mechanism: 'Transporter-mediated interaction' },
  { pattern: /\befflux/i, category: 'transporter', mechanism: 'Efflux transporter modulation' },
  { pattern: /\babsorption\s+(reduc|decreas|inhibit|enhanc|increas)/i, category: 'transporter', mechanism: 'Absorption alteration via transporter' },

  // Hematologic
  { pattern: /\bplatelet\s+aggregat/i, category: 'hematologic', mechanism: 'Platelet aggregation inhibition' },
  { pattern: /\bantiplatelet/i, category: 'hematologic', mechanism: 'Antiplatelet potentiation' },
  { pattern: /\banticoagul/i, category: 'hematologic', mechanism: 'Anticoagulant potentiation' },
  { pattern: /\bbleed(ing)?\s+risk/i, category: 'hematologic', mechanism: 'Bleeding risk augmentation' },
  { pattern: /\bwarfarin\s+potentiat/i, category: 'hematologic', mechanism: 'Warfarin potentiation' },
  { pattern: /\bcoagul/i, category: 'hematologic', mechanism: 'Coagulation interference' },
  { pattern: /\bthromb/i, category: 'hematologic', mechanism: 'Thrombotic/hemorrhagic interaction' },
  { pattern: /\binr\s+(increas|elevat)/i, category: 'hematologic', mechanism: 'INR elevation' },

  // Neurological
  { pattern: /\bserotonin\b/i, category: 'neurological', mechanism: 'Serotonergic potentiation' },
  { pattern: /\bserotonerg/i, category: 'neurological', mechanism: 'Serotonergic potentiation' },
  { pattern: /\b5.?ht\b/i, category: 'neurological', mechanism: 'Serotonergic interaction' },
  { pattern: /\bgaba(erg)?\b/i, category: 'neurological', mechanism: 'GABAergic potentiation' },
  { pattern: /\bdopamin/i, category: 'neurological', mechanism: 'Dopaminergic modulation' },
  { pattern: /\bmao\s+inhibit/i, category: 'neurological', mechanism: 'MAO inhibition' },
  { pattern: /\bsedati/i, category: 'neurological', mechanism: 'Sedative potentiation' },
  { pattern: /\bcns\s+depress/i, category: 'neurological', mechanism: 'CNS depression augmentation' },
  { pattern: /\bseizure/i, category: 'neurological', mechanism: 'Seizure threshold alteration' },
  { pattern: /\bcholinerg/i, category: 'neurological', mechanism: 'Cholinergic interaction' },
  { pattern: /\badrenerg/i, category: 'neurological', mechanism: 'Adrenergic potentiation' },
  { pattern: /\bserotonin\s+syndrome/i, category: 'neurological', mechanism: 'Serotonin syndrome risk' },

  // Cardiovascular
  { pattern: /\bqt\s+prolong/i, category: 'cardiovascular', mechanism: 'QT interval prolongation' },
  { pattern: /\bhyperten/i, category: 'cardiovascular', mechanism: 'Antihypertensive potentiation' },
  { pattern: /\bhypoten/i, category: 'cardiovascular', mechanism: 'Hypotensive potentiation' },
  { pattern: /\bheart\s+rate/i, category: 'cardiovascular', mechanism: 'Heart rate modulation' },
  { pattern: /\barrhyth/i, category: 'cardiovascular', mechanism: 'Arrhythmogenic potential' },
  { pattern: /\bblood\s+pressure/i, category: 'cardiovascular', mechanism: 'Blood pressure alteration' },

  // Immunologic
  { pattern: /\bimmunosuppress/i, category: 'immunologic', mechanism: 'Immunosuppressant level alteration' },
  { pattern: /\bcyclosporine?\s+level/i, category: 'immunologic', mechanism: 'Cyclosporine level alteration' },
  { pattern: /\btacrolimus\s+level/i, category: 'immunologic', mechanism: 'Tacrolimus level alteration' },
  { pattern: /\bimmune\s+(modul|suppress|activ)/i, category: 'immunologic', mechanism: 'Immunomodulatory interaction' },
  { pattern: /\bcytokine/i, category: 'immunologic', mechanism: 'Cytokine modulation' },

  // Endocrine
  { pattern: /\bhypoglyc/i, category: 'endocrine', mechanism: 'Hypoglycemic potentiation' },
  { pattern: /\bblood\s+(glucose|sugar)/i, category: 'endocrine', mechanism: 'Blood glucose alteration' },
  { pattern: /\bthyroid/i, category: 'endocrine', mechanism: 'Thyroid hormone alteration' },
  { pattern: /\bcortisol/i, category: 'endocrine', mechanism: 'Cortisol modulation' },
  { pattern: /\bestrogen/i, category: 'endocrine', mechanism: 'Estrogenic interaction' },

  // Pharmacodynamic
  { pattern: /\badditive\b/i, category: 'pharmacodynamic', mechanism: 'Additive pharmacological effect' },
  { pattern: /\bsynergis/i, category: 'pharmacodynamic', mechanism: 'Synergistic pharmacological effect' },
  { pattern: /\bantagonis/i, category: 'pharmacodynamic', mechanism: 'Antagonistic pharmacological effect' },
  { pattern: /\bpharmacodyn/i, category: 'pharmacodynamic', mechanism: 'Pharmacodynamic interaction' },

  // Hepatobiliary
  { pattern: /\bhepatotox/i, category: 'hepatobiliary', mechanism: 'Hepatotoxicity potentiation' },
  { pattern: /\bliver\s+(damage|injury|toxicity)/i, category: 'hepatobiliary', mechanism: 'Hepatotoxicity potentiation' },
  { pattern: /\bbiliary/i, category: 'hepatobiliary', mechanism: 'Biliary excretion interference' },

  // Renal
  { pattern: /\brenal\s+(clearance|excretion)/i, category: 'renal', mechanism: 'Renal clearance alteration' },
  { pattern: /\bnephrotox/i, category: 'renal', mechanism: 'Nephrotoxicity potentiation' },
  { pattern: /\bkidney\s+(damage|injury)/i, category: 'renal', mechanism: 'Nephrotoxicity potentiation' },
];

// ─── Severity Classification ───

const SEVERITY_SIGNALS: { pattern: RegExp; severity: 'Major' | 'Moderate' | 'Minor' }[] = [
  // Major severity signals
  { pattern: /\blife.?threaten/i, severity: 'Major' },
  { pattern: /\bcontraindicat/i, severity: 'Major' },
  { pattern: /\bfatal/i, severity: 'Major' },
  { pattern: /\bdeath\b/i, severity: 'Major' },
  { pattern: /\bserious\s+adverse/i, severity: 'Major' },
  { pattern: /\bsevere\s+(bleed|hemorr)/i, severity: 'Major' },
  { pattern: /\bserotonin\s+syndrome/i, severity: 'Major' },
  { pattern: /\bmajor\s+interaction/i, severity: 'Major' },
  { pattern: /\bavoid\s+combin/i, severity: 'Major' },
  { pattern: /\bnot\s+recommended/i, severity: 'Major' },
  { pattern: /\bclinically\s+significant\s+interaction/i, severity: 'Major' },

  // Moderate severity signals
  { pattern: /\bmoderate\s+interaction/i, severity: 'Moderate' },
  { pattern: /\bmonitor\s+(closely|carefully)/i, severity: 'Moderate' },
  { pattern: /\bdose\s+adjust/i, severity: 'Moderate' },
  { pattern: /\breduced\s+efficacy/i, severity: 'Moderate' },
  { pattern: /\bincreased\s+risk/i, severity: 'Moderate' },
  { pattern: /\bcaution\b/i, severity: 'Moderate' },
  { pattern: /\bmay\s+increase/i, severity: 'Moderate' },
  { pattern: /\bpotential\s+interaction/i, severity: 'Moderate' },
  { pattern: /\bmonitor\s+(therapy|drug|level|concentration)/i, severity: 'Moderate' },

  // Minor severity signals
  { pattern: /\bminor\s+interaction/i, severity: 'Minor' },
  { pattern: /\bminimal/i, severity: 'Minor' },
  { pattern: /\bmild\b/i, severity: 'Minor' },
  { pattern: /\bunlikel[ey]\s+(to|cause)/i, severity: 'Minor' },
  { pattern: /\bno\s+significant/i, severity: 'Minor' },
  { pattern: /\blittle\s+(clinical|effect)/i, severity: 'Minor' },
];

// ─── Interaction Type Detection ───

const INTERACTION_TYPE_SIGNALS: { pattern: RegExp; type: 'Pharmacokinetic' | 'Pharmacodynamic' | 'Mixed' }[] = [
  // PK signals
  { pattern: /\bcyp\d\w+/i, type: 'Pharmacokinetic' },
  { pattern: /\bmetabolism\b/i, type: 'Pharmacokinetic' },
  { pattern: /\bclearance\b/i, type: 'Pharmacokinetic' },
  { pattern: /\bbioavailabilit/i, type: 'Pharmacokinetic' },
  { pattern: /\bhalf.?life/i, type: 'Pharmacokinetic' },
  { pattern: /\bp.?glycoprotein/i, type: 'Pharmacokinetic' },
  { pattern: /\btransporter/i, type: 'Pharmacokinetic' },
  { pattern: /\babsorption\b/i, type: 'Pharmacokinetic' },
  { pattern: /\bdistribution\b/i, type: 'Pharmacokinetic' },
  { pattern: /\bexcretion\b/i, type: 'Pharmacokinetic' },
  { pattern: /\barea\s+under\s+the\s+curve/i, type: 'Pharmacokinetic' },
  { pattern: /\bauc\b/i, type: 'Pharmacokinetic' },
  { pattern: /\bcmax\b/i, type: 'Pharmacokinetic' },
  { pattern: /\btmax\b/i, type: 'Pharmacokinetic' },
  { pattern: /\bfirst.?pass/i, type: 'Pharmacokinetic' },
  { pattern: /\bglucuronid/i, type: 'Pharmacokinetic' },
  { pattern: /\bconcentration\s+(increas|decreas|elevat|reduc)/i, type: 'Pharmacokinetic' },
  { pattern: /\bdrug\s+level/i, type: 'Pharmacokinetic' },
  { pattern: /\bplasma\s+(level|concentration)/i, type: 'Pharmacokinetic' },

  // PD signals
  { pattern: /\badditive\b/i, type: 'Pharmacodynamic' },
  { pattern: /\bsynergis/i, type: 'Pharmacodynamic' },
  { pattern: /\bantagonis/i, type: 'Pharmacodynamic' },
  { pattern: /\bpotentiat/i, type: 'Pharmacodynamic' },
  { pattern: /\bantiplatelet/i, type: 'Pharmacodynamic' },
  { pattern: /\banticoagul/i, type: 'Pharmacodynamic' },
  { pattern: /\bsedative/i, type: 'Pharmacodynamic' },
  { pattern: /\bhypotens/i, type: 'Pharmacodynamic' },
  { pattern: /\bserotonin/i, type: 'Pharmacodynamic' },
  { pattern: /\bbleed(ing)?\s+risk/i, type: 'Pharmacodynamic' },
  { pattern: /\bplatelet/i, type: 'Pharmacodynamic' },
];

// ─── Export Functions ───

export interface ClassifiedMechanism {
  mechanism: string;
  category: MechanismCategory;
  confidence: 'High' | 'Moderate' | 'Low';
}

/**
 * Classify a mechanism from text into a structured taxonomy.
 * Returns null if no mechanism can be identified.
 */
export function classifyMechanism(text: string): ClassifiedMechanism | null {
  const lower = text.toLowerCase();

  // Check exact known mechanisms first
  for (const [mechanismKey, categoryId] of Object.entries(MECHANISM_CLASSIFICATION)) {
    if (lower.includes(mechanismKey)) {
      const category = MECHANISM_CATEGORIES.find(c => c.id === categoryId)!;
      return {
        mechanism: mechanismKey.charAt(0).toUpperCase() + mechanismKey.slice(1),
        category,
        confidence: 'High',
      };
    }
  }

  // Check pattern-based detection
  for (const { pattern, category: categoryId, mechanism } of MECHANISM_PATTERNS) {
    if (pattern.test(lower)) {
      const category = MECHANISM_CATEGORIES.find(c => c.id === categoryId)!;
      return { mechanism, category, confidence: 'Moderate' };
    }
  }

  return null;
}

/**
 * Extract all mechanisms from a text (title + abstract).
 * Returns an array of classified mechanisms.
 */
export function extractMechanisms(title: string, abstract: string): ClassifiedMechanism[] {
  const text = `${title} ${abstract}`;
  const found: ClassifiedMechanism[] = [];
  const seenMechanisms = new Set<string>();

  // Check all patterns
  for (const { pattern, category: categoryId, mechanism } of MECHANISM_PATTERNS) {
    if (pattern.test(text) && !seenMechanisms.has(mechanism)) {
      seenMechanisms.add(mechanism);
      const category = MECHANISM_CATEGORIES.find(c => c.id === categoryId)!;
      found.push({ mechanism, category, confidence: 'Moderate' });
    }
  }

  // Deduplicate by category — if multiple mechanisms in same category, keep the most specific
  const categoryMap = new Map<string, ClassifiedMechanism>();
  for (const m of found) {
    const existing = categoryMap.get(m.category.id);
    if (!existing || m.confidence === 'High' || (m.confidence === 'Moderate' && existing.confidence === 'Low')) {
      categoryMap.set(m.category.id, m);
    }
  }

  return Array.from(categoryMap.values());
}

/**
 * Normalize severity from text. Never returns "Unknown".
 * Returns "Moderate" as default if no severity signal detected.
 */
export function normalizeSeverity(title: string, abstract: string): 'Major' | 'Moderate' | 'Minor' {
  const text = `${title} ${abstract}`.toLowerCase();

  // Check from most severe to least
  for (const { pattern, severity } of SEVERITY_SIGNALS) {
    if (pattern.test(text)) return severity;
  }

  // Default to Moderate (conservative clinical approach)
  return 'Moderate';
}

/**
 * Normalize interaction type from text. Never returns "Unknown".
 * Returns "Pharmacodynamic" as default if no type signal detected.
 */
export function normalizeInteractionType(title: string, abstract: string): 'Pharmacokinetic' | 'Pharmacodynamic' | 'Mixed' {
  const text = `${title} ${abstract}`.toLowerCase();

  let hasPK = false;
  let hasPD = false;

  for (const { pattern, type } of INTERACTION_TYPE_SIGNALS) {
    if (pattern.test(text)) {
      if (type === 'Pharmacokinetic') hasPK = true;
      if (type === 'Pharmacodynamic') hasPD = true;
    }
  }

  if (hasPK && hasPD) return 'Mixed';
  if (hasPK) return 'Pharmacokinetic';
  if (hasPD) return 'Pharmacodynamic';

  // Default to Pharmacodynamic (most common herb-drug interaction type)
  return 'Pharmacodynamic';
}

/**
 * Get a mechanism category by its ID.
 */
export function getMechanismCategory(categoryId: string): MechanismCategory | undefined {
  return MECHANISM_CATEGORIES.find(c => c.id === categoryId);
}

/**
 * Generate a human-readable mechanism description from text.
 * Never returns "MDT" or generic placeholders.
 */
export function generateMechanismDescription(title: string, abstract: string): string {
  const mechanisms = extractMechanisms(title, abstract);

  if (mechanisms.length === 0) {
    // Instead of "Unknown" or "MDT", provide a meaningful description
    return 'Mechanistic pathway not fully characterized from available evidence; further investigation warranted.';
  }

  // Deduplicate mechanism descriptions — avoid "Metabolic interaction (Metabolic)"
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const m of mechanisms) {
    const desc = `${m.mechanism} (${m.category.label})`;
    const key = m.mechanism.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(desc);
    }
  }

  return unique.join('; ');
}

// ─── Mechanism Display Name Normalization ───
// Maps raw MECH_KEYWORDS to full scientific statements

export const MECHANISM_DISPLAY_NAMES: Record<string, string> = {
  // Signaling pathways
  'nf-kb': 'NF-kB signaling pathway modulation',
  'nf-κb': 'NF-kB signaling pathway modulation',
  'mapk': 'MAPK signaling pathway modulation',
  'erk': 'ERK/MAPK cascade modulation',
  'pi3k': 'PI3K/Akt signaling pathway modulation',
  'mtor': 'mTOR signaling pathway regulation',
  'jak-stat': 'JAK-STAT signaling pathway modulation',
  'nrf2': 'NRF2 antioxidant pathway activation',
  'ampk': 'AMPK-mediated metabolic regulation',
  'ppar': 'PPAR nuclear receptor activation',

  // CYP enzymes
  'cyp3a4': 'CYP3A4-mediated metabolic interaction',
  'cyp2d6': 'CYP2D6-mediated metabolic interaction',
  'cyp2c9': 'CYP2C9-mediated metabolic interaction',
  'cyp2c19': 'CYP2C19-mediated metabolic interaction',
  'cyp1a2': 'CYP1A2-mediated metabolic interaction',

  // Transporters
  'p-glycoprotein': 'P-glycoprotein efflux transporter modulation',

  // Inflammatory mediators
  'cox-2': 'COX-2 anti-inflammatory modulation',
  'cox-1': 'COX-1 enzyme inhibition',
  'tnf-alpha': 'TNF-alpha inflammatory cytokine suppression',
  'il-6': 'IL-6 inflammatory cytokine modulation',
  'il-1': 'IL-1 inflammatory cytokine modulation',

  // Cell fate
  'apoptosis': 'Apoptotic pathway modulation',
  'autophagy': 'Autophagic pathway regulation',

  // Oxidative stress
  'oxidative stress': 'Oxidative stress mitigation',
  'free radical': 'Free radical scavenging activity',
  'ros': 'Reactive oxygen species modulation',

  // Vascular/nitric oxide
  'nitric oxide': 'Nitric oxide signaling modulation',
  'no synthase': 'Nitric oxide synthase regulation',

  // Neurological
  'serotonin reuptake': 'Serotonin reuptake inhibition',
  'monoamine oxidase': 'Monoamine oxidase inhibition',
  'acetylcholinesterase': 'Acetylcholinesterase inhibition',

  // Metabolic
  'hmg-coa': 'HMG-CoA reductase inhibition',
  'amp kinase': 'AMP kinase pathway activation',
};

/**
 * Normalize a raw mechanism keyword to a full scientific statement.
 * Falls back to title-casing the keyword if no mapping exists.
 */
export function normalizeMechanismName(keyword: string): string {
  const lower = keyword.toLowerCase().trim();

  // Check exact match first
  if (MECHANISM_DISPLAY_NAMES[lower]) {
    return MECHANISM_DISPLAY_NAMES[lower];
  }

  // Try without special characters
  const simplified = lower.replace(/[^a-z0-9]/g, '');
  for (const [key, value] of Object.entries(MECHANISM_DISPLAY_NAMES)) {
    if (key.replace(/[^a-z0-9]/g, '') === simplified) {
      return value;
    }
  }

  // Fallback: convert to title case with "pathway modulation" suffix
  const words = keyword.split(/\s+/);
  const titleCased = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

  // Add context-appropriate suffix based on common patterns
  if (/\bkinase\b|\bpathway\b|\bcascade\b/i.test(keyword)) {
    return `${titleCased} modulation`;
  }
  if (/\binhibit|\bblock|\bsuppress/i.test(keyword)) {
    return `${titleCased} inhibition`;
  }
  if (/\bactiv|\binduc|\bstimulat/i.test(keyword)) {
    return `${titleCased} activation`;
  }

  return `${titleCased} pathway modulation`;
}
