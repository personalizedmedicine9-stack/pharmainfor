import { NextRequest, NextResponse } from 'next/server';

// AI Summary generation — uses HuggingFace with local fallback
const HF_MODELS = [
  'mistralai/Mistral-7B-Instruct-v0.2',
  'google/flan-t5-large',
  'facebook/bart-large-cnn',
];

const HF_KEY = process.env.HF_API_KEY || process.env.NEXT_PUBLIC_HF_API_KEY || '';

type StudyTier = 'Meta-analysis' | 'Systematic Review' | 'Randomized Clinical Trial' | 'Cohort Study' | 'Case Report' | 'Animal Study' | 'In Vitro Study' | 'Mechanistic Study';

function classifyStudyTier(studyType: string, title: string, abstract: string): StudyTier {
  const t = (title + ' ' + abstract).toLowerCase();
  const st = studyType.toLowerCase();
  if (st.includes('meta-analysis') || t.includes('meta-analysis') || t.includes('meta analysis')) return 'Meta-analysis';
  if (st.includes('systematic review') || t.includes('systematic review')) return 'Systematic Review';
  if (st.includes('randomized controlled') || st.includes('rct') || /\brct\b/.test(t)) return 'Randomized Clinical Trial';
  if (st.includes('cohort') || t.includes('cohort study')) return 'Cohort Study';
  if (st.includes('case report') || t.includes('case report')) return 'Case Report';
  if (st.includes('animal') || /\brat\b/.test(t) || /\bmice\b/.test(t)) return 'Animal Study';
  if (st.includes('in vitro') || t.includes('in vitro')) return 'In Vitro Study';
  return 'Mechanistic Study';
}

function buildEvidenceProfile(tiers: StudyTier[]) {
  return {
    human: tiers.filter(t => ['Randomized Clinical Trial', 'Cohort Study', 'Case Report'].includes(t)).length,
    animal: tiers.filter(t => t === 'Animal Study').length,
    mechanistic: tiers.filter(t => ['In Vitro Study', 'Mechanistic Study'].includes(t)).length,
    reviews: tiers.filter(t => ['Meta-analysis', 'Systematic Review'].includes(t)).length,
  };
}

function assessOverallEvidence(tiers: StudyTier[], evidenceLevels: string[]): string {
  const profile = buildEvidenceProfile(tiers);
  const highCount = evidenceLevels.filter(e => e === 'High').length;
  const modCount = evidenceLevels.filter(e => e === 'Moderate').length;
  if (profile.reviews >= 1 && (highCount >= 1 || modCount >= 3)) return 'Strong';
  if (profile.reviews >= 1) return 'Moderate';
  if (profile.human >= 3 && (highCount >= 1 || modCount >= 2)) return 'Moderate';
  if (profile.human >= 1) return 'Limited';
  if (profile.animal >= 2 || profile.mechanistic >= 3) return 'Limited';
  return 'Very Limited';
}

function scrubAbstractStyle(text: string): string {
  let cleaned = text;
  cleaned = cleaned.replace(/^(BACKGROUND|OBJECTIVE|METHODS?|RESULTS?|CONCLUSIONS?|AIM|PURPOSE|INTRODUCTION|DISCUSSION):\s*/gim, '');
  cleaned = cleaned.replace(/\b(?:we|our|us)\s+(?:present|report|describe|investigated|examined|evaluated|assessed|analyzed|conducted|performed|observed|found|show|demonstrate|confirm|propose|suggest)\b/gi, 'the study');
  cleaned = cleaned.replace(/\bthis is the (?:first|initial) (?:study|report|case|investigation) (?:to |that )?/gi, '');
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
  return cleaned;
}

function generateLocalInteractionSummary(
  studies: { title: string; abstract: string; pmid: string; tier: StudyTier; evidenceLevel: string }[],
  drug: string,
  herb: string
): string {
  const profile = buildEvidenceProfile(studies.map(s => s.tier));
  const overallStrength = assessOverallEvidence(studies.map(s => s.tier), studies.map(s => s.evidenceLevel));

  let synthesis = '';
  if (profile.reviews > 0 && profile.human > 0) {
    synthesis += `The interaction between ${drug} and ${herb} has been examined in ${profile.reviews} review(s) alongside ${profile.human} human clinical study/studies, providing a moderately characterized evidence base. `;
  } else if (profile.human > 0) {
    synthesis += `Available evidence for the interaction between ${drug} and ${herb} comprises ${profile.human} human clinical study/studies${profile.animal > 0 ? ` and ${profile.animal} animal investigation(s)` : ''}, though the overall literature remains limited. `;
  } else if (profile.animal > 0 || profile.mechanistic > 0) {
    synthesis += `Direct human clinical evidence for the interaction between ${drug} and ${herb} is currently lacking; the available literature consists primarily of ${profile.animal > 0 ? `${profile.animal} animal study/studies` : ''}${profile.animal > 0 && profile.mechanistic > 0 ? ' and ' : ''}${profile.mechanistic > 0 ? `${profile.mechanistic} mechanistic investigation(s)` : ''}. `;
  } else {
    synthesis += `The current literature provides limited directly relevant evidence for the interaction between ${drug} and ${herb}. `;
  }

  if (overallStrength === 'Very Limited' || overallStrength === 'Limited') {
    synthesis += `The current evidence base remains insufficient for definitive conclusions, and well-designed clinical studies are needed to clarify the nature and clinical relevance of this interaction.`;
  } else if (overallStrength === 'Moderate') {
    synthesis += `While the available evidence provides some insight, additional rigorous studies would further clarify the interaction profile and its clinical implications.`;
  }

  synthesis = scrubAbstractStyle(synthesis);

  return `${synthesis}\n\nEvidence Profile:\n- Human Studies: ${profile.human}\n- Animal Studies: ${profile.animal}\n- Mechanistic Studies: ${profile.mechanistic}\n- Reviews: ${profile.reviews}\n\nOverall Evidence Strength: ${overallStrength}`;
}

function generateLocalPharmacologySummary(
  actions: { name: string; score?: number; pmids?: string[]; mechanisms?: { name: string; pmids?: string[] }[] }[],
  herb: string
): string {
  const strong = actions.filter(a => (a.score ?? 0) >= 80);
  const moderate = actions.filter(a => (a.score ?? 0) >= 50 && (a.score ?? 0) < 80);
  const weak = actions.filter(a => (a.score ?? 0) < 50);
  const totalRefs = new Set(actions.flatMap(a => a.pmids ?? [])).size;

  let synthesis = '';
  if (strong.length > 0) {
    synthesis += `The pharmacological profile of ${herb} is supported by a substantial evidence base spanning ${actions.length} documented action(s) across ${totalRefs} PubMed reference(s). The most well-characterized activities include ${strong.map(a => a.name).join(', ')}. `;
  } else if (moderate.length > 0) {
    synthesis += `The PubMed literature documents ${actions.length} pharmacological action(s) for ${herb} across ${totalRefs} reference(s). Moderately supported activities include ${moderate.map(a => a.name).join(', ')}. `;
  } else {
    synthesis += `The available PubMed literature identifies ${actions.length} pharmacological action(s) for ${herb}, though the current evidence base remains predominantly preliminary. `;
  }

  if (weak.length > 0) {
    synthesis += `Preliminary evidence suggests possible ${weak.slice(0, 3).map(a => a.name).join(', ')} activity, though these findings require further validation. `;
  }

  synthesis = scrubAbstractStyle(synthesis);

  const strength = strong.length >= 2 ? 'Strong' : moderate.length >= 1 ? 'Moderate' : 'Limited';
  return `${synthesis}\n\nEvidence Profile:\n- Well-supported Actions: ${strong.length}\n- Moderately Supported: ${moderate.length}\n- Preliminary: ${weak.length}\n\nOverall Evidence Strength: ${strength}`;
}

async function queryHuggingFace(model: string, prompt: string, isSummarization: boolean): Promise<string | null> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (HF_KEY) headers['Authorization'] = `Bearer ${HF_KEY}`;

  const body = isSummarization
    ? { inputs: prompt, parameters: { max_new_tokens: 500, min_length: 80 } }
    : { inputs: prompt, parameters: { max_new_tokens: 500, temperature: 0.15, top_p: 0.85 } };

  try {
    const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (Array.isArray(data)) {
      if (data[0]?.summary_text) return data[0].summary_text;
      if (data[0]?.generated_text) return data[0].generated_text;
    }
    if (typeof data === 'string') return data;
    if (data?.generated_text) return data.generated_text;
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { type, data, drug, herb } = await req.json();

    if (type === 'interaction') {
      const studies: { pmid: string; title: string; abstract: string; evidenceLevel: string; studyType: string }[] = data;
      const classified = studies.map(s => ({
        ...s,
        tier: classifyStudyTier(s.studyType, s.title, s.abstract),
      }));

      const profile = buildEvidenceProfile(classified.map(s => s.tier));
      const overallStrength = assessOverallEvidence(classified.map(s => s.tier), classified.map(s => s.evidenceLevel));

      const studyTexts = classified.slice(0, 10).map((s, i) => {
        const abs = s.abstract.length > 300 ? s.abstract.substring(0, 300) + ' [...]' : s.abstract;
        return `[${i + 1}] PMID:${s.pmid} | ${s.tier} | ${s.evidenceLevel} Evidence\nTitle: ${s.title}\nKey points: ${abs}`;
      });

      const prompt = `You are writing a UNIFIED SCIENTIFIC EVIDENCE SYNTHESIS for a research evidence aggregation platform.

TASK: Write a concise, integrated research synthesis of the evidence on the interaction between ${drug} and ${herb}.

CRITICAL WRITING RULES:
1. Write as a SCHOLARLY RESEARCH SYNTHESIS — like the discussion section of a systematic review.
2. NEVER copy sentences directly from the abstracts. PARAPHRASE everything.
3. MERGE overlapping findings into unified statements.
4. Use a SINGLE COHERENT NARRATIVE VOICE throughout.
5. Preserve uncertainty: "may", "appears to", "suggests", "preliminary data indicate"
6. Be concise and professionally structured. 3-5 sentences maximum.

EVIDENCE CONTEXT:
- Human Studies: ${profile.human}
- Animal Studies: ${profile.animal}
- Mechanistic Studies: ${profile.mechanistic}
- Reviews: ${profile.reviews}
- Overall Evidence Strength: ${overallStrength}

STUDIES:
${studyTexts.join('\n\n')}

OUTPUT FORMAT:
Write a single concise integrated synthesis paragraph (3-5 sentences).

Evidence Profile:
- Human Studies: ${profile.human}
- Animal Studies: ${profile.animal}
- Mechanistic Studies: ${profile.mechanistic}
- Reviews: ${profile.reviews}

Overall Evidence Strength: ${overallStrength}`;

      // Try AI
      for (const model of HF_MODELS) {
        const isSumm = model.includes('bart') || model.includes('t5');
        const result = await queryHuggingFace(model, prompt, isSumm);
        if (result && result.length > 80) {
          return NextResponse.json({ text: scrubAbstractStyle(result), source: `AI Summary (${model.split('/')[1]})` });
        }
      }

      // Fallback
      return NextResponse.json({
        text: generateLocalInteractionSummary(classified, drug || 'Unknown', herb || 'Unknown'),
        source: 'Evidence-Based Summary (offline synthesis)',
      });
    }

    if (type === 'pharmacology') {
      const actions: { name: string; score?: number; pmids?: string[]; mechanisms?: { name: string; pmids?: string[] }[] }[] = data;
      const herbName = herb || 'Unknown';

      // Try AI
      const actionTexts = actions.slice(0, 12).map(a => {
        const strength = (a.score ?? 0) >= 80 ? 'Well-supported' : (a.score ?? 0) >= 50 ? 'Moderately supported' : 'Preliminary';
        return `- ${a.name} [${strength}, score: ${a.score ?? 0}]`;
      });

      const prompt = `Write a concise integrated synthesis of the pharmacological profile of ${herbName}.

PHARMACOLOGICAL ACTIONS:
${actionTexts.join('\n')}

Write 3-5 sentences of scholarly synthesis. Do NOT copy from abstracts. PARAPHRASE everything.`;

      for (const model of HF_MODELS) {
        const isSumm = model.includes('bart') || model.includes('t5');
        const result = await queryHuggingFace(model, prompt, isSumm);
        if (result && result.length > 80) {
          return NextResponse.json({ text: scrubAbstractStyle(result), source: `AI Summary (${model.split('/')[1]})` });
        }
      }

      return NextResponse.json({
        text: generateLocalPharmacologySummary(actions, herbName),
        source: 'Evidence-Based Summary (offline synthesis)',
      });
    }

    return NextResponse.json({ error: 'Invalid summary type.' }, { status: 400 });
  } catch (error) {
    console.error('Summary error:', error);
    return NextResponse.json({ error: 'Failed to generate summary.' }, { status: 500 });
  }
}
