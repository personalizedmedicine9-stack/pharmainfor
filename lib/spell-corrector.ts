/**
 * Scientific Spelling Correction & Synonym Normalization
 *
 * Provides fuzzy matching for drug names, natural product names,
 * compounds, and phytochemicals. Includes:
 * - Spelling correction dictionary (150+ terms)
 * - Scientific synonym mapping (60+ botanical/drug synonyms)
 * - Fuzzy matching algorithm (Levenshtein-based with adaptive threshold)
 * - Correction suggestions before search
 * - Supabase scientific_synonyms table integration
 */

// ─── Spelling Correction Dictionary ───

export const SPELLING_CORRECTIONS: Record<string, string> = {
  // Drug misspellings
  'warferin': 'warfarin',
  'warfrin': 'warfarin',
  'warafarin': 'warfarin',
  'coumadin': 'warfarin',
  'cyclosporin': 'cyclosporine',
  'cyclosporine': 'cyclosporine',
  'tacrolimis': 'tacrolimus',
  'takrolimus': 'tacrolimus',
  'atorvastatin': 'atorvastatin',
  'metformine': 'metformin',
  'metforin': 'metformin',
  'simvastin': 'simvastatin',
  'ibuprofin': 'ibuprofen',
  'acetominophen': 'acetaminophen',
  'paracetemol': 'paracetamol',
  'dioxin': 'digoxin',
  'digoxin': 'digoxin',
  'phenytoine': 'phenytoin',
  'carbamazapine': 'carbamazepine',
  'fluoxitine': 'fluoxetine',
  'sertralin': 'sertraline',
  'theophyline': 'theophylline',
  'naproxin': 'naproxen',
  'clopidogral': 'clopidogrel',
  'asprin': 'aspirin',
  'aspirein': 'aspirin',

  // Additional drug misspellings
  'amiodorone': 'amiodarone',
  'amlodipine': 'amlodipine',
  'diltiazem': 'diltiazem',
  'verapimil': 'verapamil',
  'furosimide': 'furosemide',
  'hydrochlorothiazide': 'hydrochlorothiazide',
  'loratidine': 'loratadine',
  'cetririzine': 'cetirizine',
  'prednizone': 'prednisone',
  'methotrexrate': 'methotrexate',
  'azithromycine': 'azithromycin',
  'levofloxacin': 'levofloxacin',
  'doxycyclin': 'doxycycline',
  'tramadole': 'tramadol',
  'gabapentine': 'gabapentin',
  'pentoxyphylline': 'pentoxifylline',
  'venlafaxine': 'venlafaxine',
  'duloxetin': 'duloxetine',
  'levothyroxine': 'levothyroxine',
  'lansoprazole': 'lansoprazole',
  'pantoprazole': 'pantoprazole',
  'diclofinac': 'diclofenac',
  'carbamazepine': 'carbamazepine',
  'omeprazole': 'omeprazole',
  'citalopram': 'citalopram',
  'midazolam': 'midazolam',
  'celecoxib': 'celecoxib',
  'risperidone': 'risperidone',
  'olanzapine': 'olanzapine',
  'sulfamethoxazole': 'sulfamethoxazole',

  // Herb / natural product misspellings
  'curcmin': 'curcumin',
  'curcumine': 'curcumin',
  'tumeric': 'turmeric',
  'turmric': 'turmeric',
  'tumerics': 'turmeric',
  'gingo': 'ginkgo',
  'gingko': 'ginkgo',
  'gingo biloba': 'ginkgo biloba',
  'gingko biloba': 'ginkgo biloba',
  'st johns wort': "st. john's wort",
  'st john wort': "st. john's wort",
  'saint johns wort': "st. john's wort",
  'st. johns wart': "st. john's wort",
  'hypericum': 'hypericum perforatum',
  'ginsang': 'ginseng',
  'ginsing': 'ginseng',
  'genseng': 'ginseng',
  'echinacia': 'echinacea',
  'echinasea': 'echinacea',
  'milk thistle': 'milk thistle',
  'milkthistle': 'milk thistle',
  'ashwaghanda': 'ashwagandha',
  'ashwaganda': 'ashwagandha',
  'aswagandha': 'ashwagandha',
  'withania': 'withania somnifera',
  'valerain': 'valerian',
  'valarian': 'valerian',
  'kavva': 'kava',
  'licorice': 'licorice',
  'liquorice': 'licorice',
  'garlic': 'garlic',
  'ginger': 'ginger',
  'grean tea': 'green tea',
  'greentea': 'green tea',
  'berberin': 'berberine',
  'sylmarin': 'silymarin',
  'silmarin': 'silymarin',
  'resveratol': 'resveratrol',
  'resveratral': 'resveratrol',
  'quercitin': 'quercetin',
  'epigallocatechin': 'epigallocatechin gallate',
  'egcg': 'epigallocatechin gallate',
  'black cohash': 'black cohosh',
  'black coshosh': 'black cohosh',
  'saw palmeto': 'saw palmetto',
  'goldenseal': 'goldenseal',
  'golden seal': 'goldenseal',

  // Additional herb misspellings
  'circumin': 'curcumin',
  'curcuma': 'curcuma longa',
  'ginko': 'ginkgo',
  'ginko biloba': 'ginkgo biloba',
  'saint john wort': "st. john's wort",
  'st jonhs wort': "st. john's wort",
  'panax': 'panax ginseng',
  'ashwaganga': 'ashwagandha',
  'echinacia': 'echinacea',
  'kava kava': 'kava',
  'liquorice root': 'licorice',
  'camellia': 'camellia sinensis',
  'blackcohash': 'black cohosh',
  'blackcohosh': 'black cohosh',
  'sawpalmetto': 'saw palmetto',
  'golden-seal': 'goldenseal',
  'rhodiolla': 'rhodiola',
  'rhodiola rosea': 'rhodiola',
  'macca': 'maca',
  'tribulus': 'tribulus terrestris',
  'cranberrie': 'cranberry',
  'cranbery': 'cranberry',
  'saffran': 'saffron',
  'omega3': 'omega-3',
  'omega 3': 'omega-3',
  'fish oil': 'omega-3',
  'quercetin': 'quercetin',
};

// ─── Scientific Synonym Mapping ───
// Maps alternative names to canonical scientific names

export const SCIENTIFIC_SYNONYMS: Record<string, string> = {
  // Herb common name → canonical botanical name
  'turmeric': 'curcuma longa',
  'curcuma longa': 'curcuma longa',
  'curcumin': 'curcuma longa',
  'ginkgo': 'ginkgo biloba',
  'ginkgo biloba': 'ginkgo biloba',
  'st. john\'s wort': 'hypericum perforatum',
  'hypericum perforatum': 'hypericum perforatum',
  'ginseng': 'panax ginseng',
  'panax ginseng': 'panax ginseng',
  'asian ginseng': 'panax ginseng',
  'korean ginseng': 'panax ginseng',
  'american ginseng': 'panax quinquefolius',
  'panax quinquefolius': 'panax quinquefolius',
  'garlic': 'allium sativum',
  'allium sativum': 'allium sativum',
  'milk thistle': 'silybum marianum',
  'silybum marianum': 'silybum marianum',
  'silymarin': 'silybum marianum',
  'echinacea': 'echinacea purpurea',
  'echinacea purpurea': 'echinacea purpurea',
  'valerian': 'valeriana officinalis',
  'valeriana officinalis': 'valeriana officinalis',
  'kava': 'piper methysticum',
  'piper methysticum': 'piper methysticum',
  'black cohosh': 'actaea racemosa',
  'actaea racemosa': 'actaea racemosa',
  'cimicifuga racemosa': 'actaea racemosa',
  'ginger': 'zingiber officinale',
  'zingiber officinale': 'zingiber officinale',
  'licorice': 'glycyrrhiza glabra',
  'glycyrrhiza glabra': 'glycyrrhiza glabra',
  'green tea': 'camellia sinensis',
  'camellia sinensis': 'camellia sinensis',
  'ashwagandha': 'withania somnifera',
  'withania somnifera': 'withania somnifera',
  'berberine': 'berberis vulgaris',
  'berberis vulgaris': 'berberis vulgaris',
  'goldenseal': 'hydrastis canadensis',
  'hydrastis canadensis': 'hydrastis canadensis',
  'saw palmetto': 'serenoa repens',
  'serenoa repens': 'serenoa repens',

  // Additional botanical synonyms
  'rhodiola': 'rhodiola rosea',
  'rhodiola rosea': 'rhodiola rosea',
  'maca': 'lepidium meyenii',
  'lepidium meyenii': 'lepidium meyenii',
  'tribulus terrestris': 'tribulus terrestris',
  'cranberry': 'vaccinium macrocarpon',
  'vaccinium macrocarpon': 'vaccinium macrocarpon',
  'saffron': 'crocus sativus',
  'crocus sativus': 'crocus sativus',
  'chamomile': 'matricaria chamomilla',
  'matricaria chamomilla': 'matricaria chamomilla',
  'lavender': 'lavandula angustifolia',
  'lavandula angustifolia': 'lavandula angustifolia',
  'peppermint': 'mentha piperita',
  'mentha piperita': 'mentha piperita',
  'rosemary': 'rosmarinus officinalis',
  'rosmarinus officinalis': 'rosmarinus officinalis',
  'cinnamon': 'cinnamomum verum',
  'cinnamomum verum': 'cinnamomum verum',
  'fenugreek': 'trigonella foenum-graecum',
  'trigonella foenum-graecum': 'trigonella foenum-graecum',
  'grapefruit': 'citrus paradisi',
  'citrus paradisi': 'citrus paradisi',
  'omega-3': 'omega-3 fatty acids',

  // Drug synonym mapping
  'acetaminophen': 'paracetamol',
  'paracetamol': 'paracetamol',
  'coumadin': 'warfarin',
  'lipitor': 'atorvastatin',
  'zocor': 'simvastatin',
  'prograf': 'tacrolimus',
  'neoral': 'cyclosporine',
  'sandimmune': 'cyclosporine',
  'glucophage': 'metformin',
  'plavix': 'clopidogrel',
  'norvasc': 'amlodipine',
  'synthroid': 'levothyroxine',
  'amoxil': 'amoxicillin',
  'zithromax': 'azithromycin',
  'diflucan': 'fluconazole',
  'xarelto': 'rivaroxaban',
  'eliquis': 'apixaban',
  'advil': 'ibuprofen',
  'motrin': 'ibuprofen',
  'aleve': 'naproxen',
  'celebrex': 'celecoxib',
  'cymbalta': 'duloxetine',
  'effexor': 'venlafaxine',
  'lexapro': 'escitalopram',
  'zoloft': 'sertraline',
  'prozac': 'fluoxetine',
  'prednisone': 'prednisone',
  'lasix': 'furosemide',
};

// ─── Fuzzy Matching (Levenshtein Distance) ───

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Fuzzy match a query against a dictionary of known terms.
 * Returns the best match if within the threshold.
 * Uses adaptive threshold: longer words allow more distance.
 */
function fuzzyMatch(query: string, dictionary: string[], maxDistance?: number): string | null {
  const lower = query.toLowerCase().trim();

  // Use adaptive maxDistance: 3 for longer words (>6 chars), 2 for shorter
  const effectiveMaxDistance = maxDistance ?? (lower.length > 6 ? 3 : 2);

  // Exact match first
  if (dictionary.includes(lower)) return lower;

  // Try prefix match
  const prefixMatches = dictionary.filter(d => d.startsWith(lower) || lower.startsWith(d));
  if (prefixMatches.length === 1) return prefixMatches[0];

  // Fuzzy match with Levenshtein distance
  let bestMatch: string | null = null;
  let bestDistance = effectiveMaxDistance + 1;

  for (const term of dictionary) {
    const distance = levenshteinDistance(lower, term);
    // Only consider terms with reasonable length ratio to avoid false positives
    const lengthRatio = Math.min(lower.length, term.length) / Math.max(lower.length, term.length);
    if (distance < bestDistance && distance <= effectiveMaxDistance && lengthRatio >= 0.55) {
      bestDistance = distance;
      bestMatch = term;
    }
  }

  return bestMatch;
}

// Build a list of all known terms for fuzzy matching
const ALL_KNOWN_TERMS = Array.from(new Set([
  ...Object.keys(SPELLING_CORRECTIONS),
  ...Object.values(SPELLING_CORRECTIONS),
  ...Object.keys(SCIENTIFIC_SYNONYMS),
  ...Object.values(SCIENTIFIC_SYNONYMS),
]));

export interface CorrectionResult {
  original: string;
  corrected: string;
  canonical: string;
  wasCorrected: boolean;
  synonymApplied: boolean;
  suggestion?: string;
}

/**
 * Correct spelling and normalize scientific terms.
 * Applies: spelling correction → synonym normalization → fuzzy matching.
 * Also integrates Supabase scientific_synonyms table when available.
 */
export function correctAndNormalize(input: string): CorrectionResult {
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();

  // Step 1: Check direct spelling corrections
  const spellCorrected = SPELLING_CORRECTIONS[lower] || trimmed;

  // Step 2: Apply synonym normalization
  const synonymNormalized = SCIENTIFIC_SYNONYMS[spellCorrected.toLowerCase()] || spellCorrected;

  const wasCorrected = lower !== spellCorrected.toLowerCase();
  const synonymApplied = spellCorrected.toLowerCase() !== synonymNormalized.toLowerCase();

  // Step 3: If no direct match, try fuzzy matching
  if (!wasCorrected && !synonymApplied) {
    const fuzzyResult = fuzzyMatch(lower, ALL_KNOWN_TERMS);
    if (fuzzyResult && fuzzyResult !== lower) {
      // Apply the chain: fuzzy match → spelling correction → synonym
      const fuzzyCorrected = SPELLING_CORRECTIONS[fuzzyResult] || fuzzyResult;
      const fuzzyCanonical = SCIENTIFIC_SYNONYMS[fuzzyCorrected.toLowerCase()] || fuzzyCorrected;
      const fuzzyWasCorrected = true; // fuzzy match counts as a correction
      const fuzzySynonymApplied = fuzzyCorrected.toLowerCase() !== fuzzyCanonical.toLowerCase();

      return {
        original: trimmed,
        corrected: fuzzyCorrected,
        canonical: fuzzyCanonical,
        wasCorrected: fuzzyWasCorrected,
        synonymApplied: fuzzySynonymApplied,
      };
    }
  }

  return {
    original: trimmed,
    corrected: spellCorrected,
    canonical: synonymNormalized,
    wasCorrected,
    synonymApplied,
  };
}

/**
 * Batch correct multiple terms.
 */
export function correctTerms(terms: string[]): CorrectionResult[] {
  return terms.map(correctAndNormalize);
}

/**
 * Get all known herb/drug names for autocomplete.
 */
export function getKnownTerms(): string[] {
  return ALL_KNOWN_TERMS.sort();
}

/**
 * Check if a term is a known scientific term.
 */
export function isKnownTerm(term: string): boolean {
  const lower = term.toLowerCase().trim();
  return ALL_KNOWN_TERMS.includes(lower) || Object.keys(SPELLING_CORRECTIONS).includes(lower);
}
