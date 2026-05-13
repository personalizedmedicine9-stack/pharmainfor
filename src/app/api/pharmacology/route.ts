import { NextRequest, NextResponse } from 'next/server';
import { expandHerb, ACTIVE_COMPOUNDS, HIGH_IMPACT_JOURNALS, MEDIUM_IMPACT_JOURNALS, PHARM_ACTIONS, MECH_KEYWORDS } from '@/lib/knowledge-base';
import { correctAndNormalize } from '@/lib/spell-corrector';
import { normalizeMechanismName, MECHANISM_DISPLAY_NAMES } from '@/lib/mechanism-taxonomy';
import type { PharmacologyAction, PharmacologyCompound, SpellingCorrection } from '@/lib/types';

/**
 * Generate confidence reasoning for pharmacology results.
 */
function generatePharmacologyReasoning(
  actions: PharmacologyAction[],
  compounds: PharmacologyCompound[],
  evidenceLevel: string,
  confidence: string,
): string {
  if (actions.length === 0) return 'No pharmacological evidence available for assessment.';

  const parts: string[] = [];
  const highScore = actions.filter(a => a.score >= 80).length;
  const modScore = actions.filter(a => a.score >= 50 && a.score < 80).length;
  const lowScore = actions.filter(a => a.score < 50).length;
  const totalRefs = new Set(actions.flatMap(a => a.pmids)).length;
  const compoundCount = compounds.length;

  // Evidence distribution
  parts.push(`${actions.length} documented pharmacological action${actions.length > 1 ? 's' : ''}: ${highScore} well-supported, ${modScore} moderately supported, ${lowScore} preliminary`);

  // Reference count
  if (totalRefs > 0) {
    parts.push(`${totalRefs} unique PubMed reference${totalRefs > 1 ? 's' : ''} supporting these findings`);
  }

  // Compound profile
  if (compoundCount > 0) {
    parts.push(`${compoundCount} validated active compound${compoundCount > 1 ? 's' : ''} identified`);
  } else {
    parts.push('no specific active compounds validated from current evidence');
  }

  // Confidence assessment
  if (confidence === 'Low') {
    if (highScore === 0 && modScore === 0) {
      parts.push('low confidence due to absence of well-supported pharmacological actions and predominance of preliminary evidence');
    } else {
      parts.push('low confidence due to limited high-quality evidence supporting pharmacological claims');
    }
  } else if (confidence === 'Moderate') {
    parts.push('moderate confidence with some well-supported actions but limited human clinical validation');
  } else {
    parts.push('strong confidence supported by multiple well-documented pharmacological actions with substantial evidence');
  }

  return parts.join('; ') + '.';
}

export async function POST(req: NextRequest) {
  try {
    const { herb } = await req.json();
    if (!herb?.trim()) {
      return NextResponse.json({ error: 'Natural product name is required.' }, { status: 400 });
    }

    // Apply spelling correction and synonym normalization
    const herbCorrection = correctAndNormalize(herb.trim());

    // Use canonical (fully normalized) term for search
    const herbName = herbCorrection.canonical || herbCorrection.corrected;

    // Build full spelling correction info
    const spellingCorrection: SpellingCorrection | null =
      (herbCorrection.wasCorrected || herbCorrection.synonymApplied || herbCorrection.suggestion)
        ? {
            original: herbCorrection.original,
            corrected: herbCorrection.corrected,
            canonical: herbCorrection.canonical !== herbCorrection.corrected ? herbCorrection.canonical : undefined,
            synonymApplied: herbCorrection.synonymApplied,
            wasAutoCorrected: herbCorrection.wasCorrected,
          }
        : null;

    const herbTerms = expandHerb(herbName);
    const herbQuery = herbTerms.map(t => `"${t}"[Title/Abstract]`).join(' OR ');
    const query = `(${herbQuery}) AND (pharmacological effects[Title/Abstract] OR mechanism[Title/Abstract] OR biological activity[Title/Abstract])`;

    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=30&retmode=json&sort=relevance&tool=PharmaInsight&email=research@pharmainsight.dev`;
    const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(15000) });
    if (!searchRes.ok) return NextResponse.json({ error: 'PubMed search failed.' }, { status: 502 });

    const searchData = await searchRes.json();
    const ids: string[] = searchData?.esearchresult?.idlist ?? [];

    if (ids.length === 0) {
      return NextResponse.json({
        herb: herbName,
        pharmacological_actions: [],
        active_compounds: [],
        evidence_level: 'No Evidence',
        confidence: 'Low',
        sourcesUsed: ['PubMed'],
        noEvidenceMessage: 'No pharmacological evidence found in PubMed for this natural product.',
        spellingCorrection,
        confidenceReasoning: 'No pharmacological evidence available for assessment.',
      });
    }

    const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.join(',')}&retmode=xml&tool=PharmaInsight&email=research@pharmainsight.dev`;
    const fetchRes = await fetch(fetchUrl, { signal: AbortSignal.timeout(15000) });
    if (!fetchRes.ok) return NextResponse.json({ error: 'PubMed fetch failed.' }, { status: 502 });

    const xml = await fetchRes.text();
    const articles: { pmid: string; title: string; abstract: string; journal: string; doi?: string }[] = [];

    const articleRegex = /<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g;
    let match;
    while ((match = articleRegex.exec(xml)) !== null) {
      const chunk = match[0];
      const pmid = chunk.match(/<PMID[^>]*>(\d+)<\/PMID>/)?.[1] ?? '';
      const title = chunk.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/)?.[1]?.replace(/<[^>]+>/g, '').trim() ?? '';
      const journal = chunk.match(/<ISOAbbreviation>([\s\S]*?)<\/ISOAbbreviation>/)?.[1]?.replace(/<[^>]+>/g, '').trim() ?? '';
      const abstract = [...chunk.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g)].map(m => m[1].replace(/<[^>]+>/g, '').trim()).join(' ');
      const doi = chunk.match(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/)?.[1];
      if (pmid && title) articles.push({ pmid, title, abstract, journal, doi });
    }

    // Active compounds
    const herbLower = herbName.toLowerCase();
    const active_compounds: PharmacologyCompound[] = ACTIVE_COMPOUNDS
      .filter(c => c.herbs.includes('*') || c.herbs.some(h => herbLower.includes(h)))
      .map(c => {
        const baseName = c.name.split('(')[0].trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${baseName}\\b`, 'i');
        const matched = articles.filter(a => regex.test(a.title + ' ' + a.abstract));
        return matched.length > 0
          ? { name: c.name, category: c.category, pmids: matched.slice(0, 3).map(a => a.pmid) }
          : null;
      })
      .filter((c): c is PharmacologyCompound => c !== null);

    // Deduplicate compounds by name
    const seenCompoundNames = new Set<string>();
    const uniqueCompounds: PharmacologyCompound[] = [];
    for (const comp of active_compounds) {
      const key = comp.name.toLowerCase();
      if (!seenCompoundNames.has(key)) {
        seenCompoundNames.add(key);
        uniqueCompounds.push(comp);
      }
    }

    // Score articles
    const scoreArticle = (a: { title: string; abstract: string; journal: string }) => {
      const t = (a.title + ' ' + a.abstract).toLowerCase();
      const j = a.journal.toLowerCase();
      let ts = 5;
      if (t.includes('meta-analysis') || t.includes('meta analysis')) ts = 50;
      else if (t.includes('systematic review')) ts = 48;
      else if (t.includes('randomized controlled') || /\brct\b/.test(t)) ts = 45;
      else if (t.includes('cohort study') || t.includes('prospective study')) ts = 35;
      else if (/\brat\b|\bmice\b|\bin vivo\b/.test(t)) ts = 15;

      let ss = 0;
      const sm = t.match(/(?:n\s*=\s*)(\d{1,4}(?:,\d{3})*)/i);
      if (sm) {
        const n = parseInt(sm[1].replace(/,/g, ''));
        if (n >= 200) ss = 30;
        else if (n >= 100) ss = 25;
        else if (n >= 50) ss = 15;
        else if (n >= 20) ss = 10;
        else ss = 5;
      }

      let js = 0;
      if (HIGH_IMPACT_JOURNALS.some(jn => j.includes(jn))) js = 20;
      else if (MEDIUM_IMPACT_JOURNALS.some(jn => j.includes(jn))) js = 10;

      return ts + ss + js;
    };

    // Pharmacological actions — with deduplication and mechanism normalization
    const seenActions = new Set<string>();
    const actions: PharmacologyAction[] = PHARM_ACTIONS.map(action => {
      const key = action.toLowerCase();
      if (seenActions.has(key)) return null;
      seenActions.add(key);

      const regex = new RegExp(`\\b${action.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      const matched = articles.filter(a => regex.test(a.title + ' ' + a.abstract));
      if (matched.length === 0) return null;

      const score = Math.max(...matched.map(scoreArticle));

      // Build mechanisms with normalization
      const seenMechanisms = new Set<string>();
      const mechanisms = MECH_KEYWORDS.map(m => {
        // Use normalized display name as dedup key to prevent duplicates
        const displayName = normalizeMechanismName(m);
        const normalizedKey = displayName.toLowerCase();
        if (seenMechanisms.has(normalizedKey)) return null;
        seenMechanisms.add(normalizedKey);

        const mr = new RegExp(`\\b${m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        const mm = matched.filter(a => mr.test(a.title + ' ' + a.abstract));
        if (mm.length === 0) return null;

        return { name: displayName, pmids: mm.map(a => a.pmid) };
      }).filter((m): m is { name: string; pmids: string[] } => m !== null);

      return { name: action, pmids: matched.slice(0, 3).map(a => a.pmid), score, mechanisms };
    }).filter((a): a is PharmacologyAction => a !== null);

    const bestScore = actions.length > 0 ? Math.max(...actions.map(a => a.score)) : 0;
    const conf: 'High' | 'Moderate' | 'Low' = bestScore >= 80 ? 'High' : bestScore >= 50 ? 'Moderate' : 'Low';
    let ev: 'High' | 'Moderate' | 'Low' | 'No Evidence' = 'Low';
    if (actions.length === 0) ev = 'No Evidence';
    else if (bestScore >= 80) ev = 'High';
    else if (bestScore >= 50) ev = 'Moderate';

    // Generate confidence reasoning
    const confidenceReasoning = generatePharmacologyReasoning(actions, uniqueCompounds, ev, conf);

    const result = {
      herb: herbName,
      pharmacological_actions: actions,
      active_compounds: uniqueCompounds,
      evidence_level: ev,
      confidence: conf,
      sourcesUsed: ['PubMed'],
      spellingCorrection,
      confidenceReasoning,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Pharmacology search error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
