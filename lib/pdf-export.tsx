'use client';

import { Document, Page, Text, View, Link, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import type { StudyResult, FdaDrugData, PharmacologyAction, PharmacologyCompound } from './types';
import { normalizeMechanismName } from './mechanism-taxonomy';

// Register a clean font (uses built-in Helvetica by default)
const colors = {
  navy: '#0f172a',
  darkSlate: '#1e293b',
  blue: '#2563eb',
  emerald: '#059669',
  amber: '#d97706',
  rose: '#dc3232',
  gray: '#6b7280',
  lightGray: '#9ca3af',
  bg: '#f8fafc',
  white: '#ffffff',
  separator: '#e5e7eb',
  gold: '#d9a406',
  purple: '#7c3aed',
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1e293b',
    lineHeight: 1.6,
  },
  headerBar: {
    backgroundColor: colors.navy,
    padding: 28,
    margin: -40,
    marginBottom: 24,
    paddingLeft: 40,
    paddingRight: 40,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#e2e8f0',
    marginBottom: 6,
  },
  headerCredit: {
    fontSize: 10,
    color: '#e2e8f0',
    marginTop: 10,
  },
  headerDate: {
    fontSize: 10,
    color: '#e2e8f0',
    textAlign: 'right',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.navy,
    marginBottom: 10,
    marginTop: 14,
  },
  subTitle: {
    fontSize: 11.5,
    fontFamily: 'Helvetica-Bold',
    color: colors.darkSlate,
    marginBottom: 5,
    marginTop: 10,
  },
  bodyText: {
    fontSize: 10,
    color: colors.darkSlate,
    lineHeight: 1.7,
    marginBottom: 5,
  },
  smallText: {
    fontSize: 8.5,
    color: colors.gray,
  lineHeight: 1.5,
  },
  linkText: {
    fontSize: 8.5,
    color: colors.blue,
    textDecoration: 'underline',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
    lineHeight: 1.2,
  },
  overviewBox: {
    backgroundColor: colors.bg,
    padding: 12,
    borderRadius: 4,
    marginBottom: 10,
  },
  summaryBox: {
    backgroundColor: colors.darkSlate,
    padding: 12,
    borderRadius: 4,
    marginBottom: 10,
  },
  summaryTitle: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: colors.gold,
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 8.5,
    color: '#d1d9e4',
    lineHeight: 1.6,
  },
  fdaBox: {
    backgroundColor: '#fffbeb',
    border: '1px solid #f59e0b',
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
  },
  fdaTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.amber,
    marginBottom: 4,
  },
  fdaText: {
    fontSize: 8.5,
    color: '#78350f',
    lineHeight: 1.5,
  },
  evidenceBox: {
    backgroundColor: '#f0f8ff',
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
  },
  evidenceTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.blue,
    marginBottom: 5,
  },
  evidenceText: {
    fontSize: 8,
    color: '#475569',
    lineHeight: 1.5,
  },
  studyCard: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottom: '0.5px solid #e5e7eb',
  },
  studyTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: colors.navy,
    marginBottom: 5,
  },
  studyMeta: {
    fontSize: 8,
    color: colors.gray,
    marginBottom: 3,
  },
  studyAbstract: {
    fontSize: 8.5,
    color: '#475569',
    lineHeight: 1.55,
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7.5,
    color: '#94a3b8',
  },
  disclaimer: {
    fontSize: 8.5,
    color: '#475569',
    lineHeight: 1.6,
    marginTop: 14,
    borderTop: '0.5px solid #cbd5e1',
    paddingTop: 10,
  },
  disclaimerBold: {
    fontSize: 9,
    color: '#1e293b',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
  },
  mechanismTag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 2,
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
    marginRight: 4,
    marginBottom: 2,
    lineHeight: 1.2,
  },
  timestampBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  // Pharmacology-specific styles
  pharmaHeader: {
    backgroundColor: '#059669',
    padding: 28,
    margin: -40,
    marginBottom: 24,
    paddingLeft: 40,
    paddingRight: 40,
  },
  compoundTag: {
    backgroundColor: '#065f46',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
    marginLeft: 6,
    lineHeight: 1.2,
  },
  actionScore: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
    marginLeft: 8,
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mechanismBox: {
    borderLeft: '2px solid #bfdbfe',
    paddingLeft: 8,
    marginBottom: 4,
  },
  evidenceProfileBox: {
    backgroundColor: colors.bg,
    padding: 12,
    borderRadius: 4,
    marginBottom: 10,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  refSection: {
    marginTop: 10,
    borderTop: '0.5px solid #e5e7eb',
    paddingTop: 8,
  },
  refTitle: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    color: colors.navy,
    marginBottom: 6,
  },
  refItem: {
    flexDirection: 'row',
    marginBottom: 3,
    fontSize: 7.5,
    lineHeight: 1.4,
  },
  refNumber: {
    fontFamily: 'Helvetica-Bold',
    color: colors.navy,
    width: 16,
    flexShrink: 0,
  },
  refText: {
    color: '#475569',
    flex: 1,
  },
});

// Helper to get evidence badge color
function getEvidenceColor(level: string): string {
  if (level === 'High') return colors.emerald;
  if (level === 'Moderate') return colors.amber;
  return colors.rose;
}

function getScoreColor(score: number): string {
  if (score >= 80) return colors.emerald;
  if (score >= 50) return colors.amber;
  return colors.gray;
}

function getMechanismCategoryColor(category: string): string {
  const colorMap: Record<string, string> = {
    metabolic: colors.rose,
    transporter: colors.purple,
    hematologic: '#dc2626',
    neurological: '#4f46e5',
    cardiovascular: '#ec4899',
    immunologic: '#0891b2',
    endocrine: colors.amber,
    pharmacodynamic: '#0284c7',
    hepatobiliary: '#ea580c',
    renal: '#0d9488',
  };
  return colorMap[category] || colors.gray;
}

interface EvidenceBreakdown {
  studyTypeScore: number;
  journalQualityScore: number;
  validationScore: number;
  contradictionPenalty: number;
}

const DISCLAIMER_TEXT = 'For research and educational use only. Not intended for clinical decision-making or medical advice. Always consult a qualified healthcare professional.';

const now = new Date();
const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

// ============= Interaction PDF Document =============
export function InteractionPDFDocument({
  results,
  drug,
  herb,
  sourcesUsed,
  fdaData,
  topCitationCount,
  aiSummary,
  scores,
  confidenceReasoning,
}: {
  results: StudyResult[];
  drug: string;
  herb: string;
  sourcesUsed: string[];
  fdaData: FdaDrugData | null;
  topCitationCount: number;
  aiSummary?: string | null;
  scores?: { normalizedScore: number; evidenceLevel: string; breakdown: EvidenceBreakdown }[];
  confidenceReasoning?: string | null;
}) {
  const highCount = results.filter(r => r.evidenceLevel === 'High').length;
  const modCount = results.filter(r => r.evidenceLevel === 'Moderate').length;
  const lowCount = results.filter(r => r.evidenceLevel === 'Low').length;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>PharmaInsight</Text>
          <Text style={styles.headerSubtitle}>Drug-Natural Product Interaction Report</Text>
          <Text style={styles.headerCredit}>Dr. Mahmoud Evidence-Based Drug–Herb Intelligence</Text>
          <Text style={styles.headerDate}>{dateStr} · {timeStr}</Text>
        </View>

        {/* Drug + Herb Title */}
        <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: colors.navy, marginBottom: 10 }}>
          {drug}  +  {herb}
        </Text>

        {/* Evidence Timestamp */}
        <View style={styles.timestampBox}>
          <Text style={styles.smallText}>Evidence retrieved: {dateStr} at {timeStr}</Text>
          <Text style={styles.smallText}>Report generated by PharmaInsight</Text>
        </View>

        {/* Overview Box */}
        <View style={styles.overviewBox}>
          <Text style={styles.subTitle}>Analysis Overview</Text>
          <Text style={styles.smallText}>Data Sources: {sourcesUsed.join(', ')}</Text>
          <Text style={styles.smallText}>Studies Found: {results.length}  |  Top Citations: {topCitationCount.toLocaleString()}</Text>
          <Text style={styles.smallText}>Evidence Breakdown: {highCount} High  |  {modCount} Moderate  |  {lowCount} Low</Text>
        </View>

        {/* AI Summary */}
        {aiSummary && aiSummary.trim().length > 20 && (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Evidence-Based Research Synthesis</Text>
            <Text style={styles.summaryText}>{aiSummary.trim()}</Text>
          </View>
        )}

        {/* FDA Alert */}
        {fdaData && (
          <View style={styles.fdaBox}>
            <Text style={styles.fdaTitle}>FDA-Associated Safety Signal</Text>
            <Text style={styles.fdaText}>
              Potential interaction-related safety signals were identified from FDA-associated pharmacovigilance data; however, clinical significance and causality remain incompletely established.
            </Text>
            {fdaData.brandNames.length > 0 && (
              <Text style={styles.fdaText}>FDA-Listed Brand Names: {fdaData.brandNames.join(', ')}</Text>
            )}
          </View>
        )}

        {/* Evidence Score Breakdown */}
        {scores && scores.length > 0 && (
          <View style={styles.evidenceBox}>
            <Text style={styles.evidenceTitle}>Weighted Evidence Scoring Applied</Text>
            {(() => {
              const avgScore = Math.round(scores.reduce((s, sc) => s + sc.normalizedScore, 0) / scores.length);
              const highTier = scores.filter(s => s.breakdown.studyTypeScore >= 30).length;
              const q1Count = scores.filter(s => s.breakdown.journalQualityScore >= 20).length;
              const humanValidated = scores.filter(s => s.breakdown.validationScore >= 20).length;
              const hasContradictions = scores.some(s => s.breakdown.contradictionPenalty > 0);
              return (
                <>
                  <Text style={styles.evidenceText}>Aggregate Evidence Score: {avgScore}/100  |  Study Types: {highTier} high-tier  |  Journal Quality: {q1Count} Q1</Text>
                  <Text style={styles.evidenceText}>Validation: {humanValidated} human  |  Contradictions: {hasContradictions ? 'Detected' : 'None'}</Text>
                </>
              );
            })()}
          </View>
        )}

        {/* Confidence Reasoning */}
        {confidenceReasoning && (
          <View style={{ backgroundColor: '#eff6ff', padding: 10, borderRadius: 4, marginBottom: 10 }}>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: colors.blue, marginBottom: 3 }}>Confidence Assessment</Text>
            <Text style={{ fontSize: 7.5, color: '#1e3a5f', lineHeight: 1.4 }}>{confidenceReasoning}</Text>
          </View>
        )}

        {/* Study Results */}
        {results.map((study, idx) => (
          <View key={study.pmid || idx} style={styles.studyCard} wrap>
            <Text style={styles.studyTitle}>{idx + 1}. {study.title}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: getEvidenceColor(study.evidenceLevel) }]}>
                <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: colors.white, lineHeight: 1.2 }}>
                  {study.evidenceLevel} Evidence
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: colors.darkSlate }]}>
                <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: colors.white, lineHeight: 1.2 }}>
                  {study.studyType}
                </Text>
              </View>
              {study.severity && study.severity !== 'Moderate' && (
                <View style={[styles.badge, { backgroundColor: study.severity === 'Major' ? colors.rose : colors.amber }]}>
                  <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: colors.white, lineHeight: 1.2 }}>
                    {study.severity} Severity
                  </Text>
                </View>
              )}
            </View>
            {/* Mechanism description — deduplicated */}
            {study.mechanismDescription && !study.mechanismDescription.includes('not fully characterized') && (() => {
              const parts = [...new Set(study.mechanismDescription.split('; ').map(m => m.trim()).filter(m => m.length > 0))];
              return parts.length > 0 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginBottom: 3 }}>
                  {parts.map((mech, mi) => (
                    <View key={mi} style={[styles.mechanismTag, { backgroundColor: colors.darkSlate }]}>
                      <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: colors.white, lineHeight: 1.2 }}>
                        {mech}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null;
            })()}
            <Text style={styles.studyMeta}>
              {study.journal}  |  {study.pubYear}  |  {study.authors.length > 0 ? study.authors.slice(0, 3).join(', ') + (study.authors.length > 3 ? ' et al.' : '') : ''}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 3 }}>
              <Link src={study.pubmedLink} style={styles.linkText}>PMID: {study.pmid}</Link>
              {study.doi && study.doiLink && (
                <Link src={study.doiLink} style={styles.linkText}>DOI: {study.doi}</Link>
              )}
            </View>
            {study.abstract && (
              <Text style={styles.studyAbstract}>
                {study.abstract.length > 500 ? study.abstract.substring(0, 500) + '...' : study.abstract}
              </Text>
            )}
          </View>
        ))}

        {/* Vancouver-style References */}
        {results.length > 0 && (
          <View style={styles.refSection}>
            <Text style={styles.refTitle}>References</Text>
            {results.map((study, idx) => (
              <View key={study.pmid} style={styles.refItem}>
                <Text style={styles.refNumber}>{idx + 1}.</Text>
                <Text style={styles.refText}>
                  {study.authors.length > 0 ? study.authors.slice(0, 3).join(', ') + (study.authors.length > 3 ? ', et al' : '') : 'Unknown'}
                  . {study.title}. {study.journal}. {study.pubYear}
                  {study.doi && <>; DOI: <Link src={study.doiLink || `https://doi.org/${study.doi}`} style={styles.linkText}>{study.doi}</Link></>}
                  ; PMID: <Link src={study.pubmedLink} style={styles.linkText}>{study.pmid}</Link>.
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerBold}>Scientific Disclaimer</Text>
          <Text>{DISCLAIMER_TEXT}</Text>
          <Text style={{ fontSize: 7, color: '#475569', marginTop: 2 }}>
            Developed by Dr. Mahmoud Mostafa · PharmaInsight · {dateStr}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>PharmaInsight - Research Use Only</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

// ============= Pharmacology PDF Document =============
interface PharmResult {
  herb: string;
  pharmacological_actions: PharmacologyAction[];
  active_compounds: PharmacologyCompound[];
  evidence_level: string;
  confidence: string;
  sourcesUsed: string[];
  confidenceReasoning?: string;
}

export function PharmacologyPDFDocument({
  result,
  aiSummary,
}: {
  result: PharmResult;
  aiSummary?: string | null;
}) {
  const actions = result.pharmacological_actions;
  // Deduplicate actions by name
  const seenActionNames = new Set<string>();
  const uniqueActions = actions.filter(a => {
    const key = a.name.toLowerCase();
    if (seenActionNames.has(key)) return false;
    seenActionNames.add(key);
    return true;
  });
  const strongActions = uniqueActions.filter(a => a.score >= 80);
  const moderateActions = uniqueActions.filter(a => a.score >= 50 && a.score < 80);
  const weakActions = uniqueActions.filter(a => a.score < 50);
  const totalRefs = new Set(uniqueActions.flatMap(a => a.pmids)).size;
  const specificCompounds = result.active_compounds.filter(c => !['Flavonoids', 'Alkaloids', 'Terpenes', 'Tannins', 'Essential Oils'].includes(c.name));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.pharmaHeader}>
          <Text style={styles.headerTitle}>PharmaInsight</Text>
          <Text style={[styles.headerSubtitle, { color: '#dcffe6' }]}>Pharmacology & Phytochemistry Report</Text>
          <Text style={styles.headerCredit}>Dr. Mahmoud Evidence-Based Drug–Herb Intelligence</Text>
          <Text style={styles.headerDate}>{dateStr} · {timeStr}</Text>
        </View>

        {/* Herb Title + Badges */}
        <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: colors.navy, marginBottom: 6 }}>
          {result.herb}
        </Text>
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
          <View style={[styles.badge, { backgroundColor: getEvidenceColor(result.evidence_level) }]}>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: colors.white, lineHeight: 1.2 }}>
              {result.evidence_level} Evidence
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: getEvidenceColor(result.confidence) }]}>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: colors.white, lineHeight: 1.2 }}>
              {result.confidence} Confidence
            </Text>
          </View>
        </View>

        {/* Confidence Reasoning */}
        {result.confidenceReasoning && (
          <View style={{ backgroundColor: '#eff6ff', padding: 10, borderRadius: 4, marginBottom: 10 }}>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: colors.blue, marginBottom: 3 }}>Confidence Assessment</Text>
            <Text style={{ fontSize: 7.5, color: '#1e3a5f', lineHeight: 1.4 }}>{result.confidenceReasoning}</Text>
          </View>
        )}

        {/* Evidence Timestamp */}
        <View style={styles.timestampBox}>
          <Text style={styles.smallText}>Evidence retrieved: {dateStr} at {timeStr}</Text>
          <Text style={styles.smallText}>Report generated by PharmaInsight</Text>
        </View>

        {/* AI Summary */}
        {aiSummary && aiSummary.trim().length > 20 && (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Evidence-Based Research Synthesis</Text>
            <Text style={styles.summaryText}>{aiSummary.trim()}</Text>
          </View>
        )}

        {/* Evidence Profile */}
        <View style={styles.evidenceProfileBox}>
          <Text style={styles.subTitle}>Evidence Profile</Text>
          <View style={styles.profileRow}>
            <View style={[styles.profileDot, { backgroundColor: colors.emerald }]} />
            <Text style={styles.bodyText}>Well-supported Actions: {strongActions.length}</Text>
          </View>
          <View style={styles.profileRow}>
            <View style={[styles.profileDot, { backgroundColor: colors.amber }]} />
            <Text style={styles.bodyText}>Moderately Supported: {moderateActions.length}</Text>
          </View>
          <View style={styles.profileRow}>
            <View style={[styles.profileDot, { backgroundColor: colors.lightGray }]} />
            <Text style={styles.bodyText}>Preliminary: {weakActions.length}</Text>
          </View>
          <Text style={[styles.smallText, { textAlign: 'right' }]}>Total PubMed Refs: {totalRefs}  |  Actions Documented: {actions.length}</Text>
        </View>

        {/* Active Compounds */}
        {specificCompounds.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Active Compounds</Text>
            {specificCompounds.map((comp, i) => (
              <View key={i} style={{ marginBottom: 6 }} wrap>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.bodyText}>  {comp.name}</Text>
                  <View style={styles.compoundTag}>
                    <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: colors.white, lineHeight: 1.2 }}>{comp.category}</Text>
                  </View>
                </View>
                {comp.pmids.length > 0 && (
                  <View style={{ flexDirection: 'row', gap: 6, marginLeft: 12, flexWrap: 'wrap' }}>
                    {comp.pmids.map(pmid => (
                      <Link key={pmid} src={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`} style={styles.linkText}>
                        PMID:{pmid}
                      </Link>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </>
        ) : (
          <View style={{ backgroundColor: colors.bg, padding: 10, borderRadius: 4, marginBottom: 10 }}>
            <Text style={{ fontSize: 9, color: colors.gray, fontStyle: 'italic' }}>
              No validated active compounds identified from current evidence.
            </Text>
          </View>
        )}

        {/* Pharmacological Actions */}
        {uniqueActions.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Pharmacological Actions & Mechanisms</Text>
            {uniqueActions.map((action, idx) => (
              <View key={`${action.name}-${idx}`} style={{ marginBottom: 8, paddingBottom: 6, borderBottom: '0.5px solid #e5e7eb' }} wrap>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.subTitle, { marginTop: 0, marginBottom: 2 }]}>{action.name}</Text>
                  {action.score > 0 && (
                    <View style={[styles.actionScore, { backgroundColor: getScoreColor(action.score) }]}>
                      <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: colors.white, lineHeight: 1.2 }}>
                        Score: {action.score}
                      </Text>
                    </View>
                  )}
                </View>
                {action.pmids.length > 0 && (
                  <View style={{ flexDirection: 'row', gap: 6, marginLeft: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    {action.pmids.map(pmid => (
                      <Link key={pmid} src={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`} style={styles.linkText}>
                        PMID:{pmid}
                      </Link>
                    ))}
                  </View>
                )}
                {action.mechanisms.length > 0 && (
                  <View style={{ marginLeft: 12 }}>
                    {Array.from(new Map(action.mechanisms.map(m => [m.name.toLowerCase(), m])).values()).map((mech, mi) => (
                      <View key={`${mech.name}-${mi}`} style={styles.mechanismBox}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.smallText}>{mech.name}</Text>
                          {mech.pmids.length > 0 && (
                            <View style={{ flexDirection: 'row', gap: 4 }}>
                              {mech.pmids.slice(0, 2).map(pmid => (
                                <Link key={pmid} src={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`} style={styles.linkText}>
                                  PMID:{pmid}
                                </Link>
                              ))}
                            </View>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </>
        )}

        {/* Vancouver-style References */}
        {uniqueActions.length > 0 && (() => {
          const allRefs = uniqueActions
            .filter(a => a.pmids.length > 0)
            .map((a, idx) => ({
              key: idx,
              name: a.name,
              pmids: a.pmids,
            }));
          if (allRefs.length === 0) return null;
          return (
            <View style={styles.refSection}>
              <Text style={styles.refTitle}>References</Text>
              {allRefs.map((ref, idx) => (
                <View key={ref.key} style={styles.refItem}>
                  <Text style={styles.refNumber}>{idx + 1}.</Text>
                  <Text style={styles.refText}>
                    {ref.name}
                    {ref.pmids.length > 0 && (
                      <> — PMID: {ref.pmids.map(pmid => (
                        <Link key={pmid} src={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`} style={styles.linkText}>{pmid}</Link>
                      )).reduce<React.ReactNode[]>((acc, el, i) => i === 0 ? [el] : [...acc, ', ', el], [])}</>
                    )}
                  </Text>
                </View>
              ))}
            </View>
          );
        })()}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerBold}>Scientific Disclaimer</Text>
          <Text>{DISCLAIMER_TEXT}</Text>
          <Text style={{ fontSize: 7, color: '#475569', marginTop: 2 }}>
            Developed by Dr. Mahmoud Mostafa · PharmaInsight · {dateStr}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>PharmaInsight - Research Use Only</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

// ============= Convenience wrapper components =============

/**
 * Generate Interaction PDF download trigger.
 * Usage: <InteractionPDFDownloadLink ... />
 */
export function InteractionPDFDownloadLink({
  results,
  drug,
  herb,
  sourcesUsed,
  fdaData,
  topCitationCount,
  aiSummary,
  scores,
  confidenceReasoning,
  children,
}: {
  results: StudyResult[];
  drug: string;
  herb: string;
  sourcesUsed: string[];
  fdaData: FdaDrugData | null;
  topCitationCount: number;
  aiSummary?: string | null;
  scores?: { normalizedScore: number; evidenceLevel: string; breakdown: EvidenceBreakdown }[];
  confidenceReasoning?: string | null;
  children: React.ReactNode;
}) {
  return (
    <PDFDownloadLink
      document={
        <InteractionPDFDocument
          results={results}
          drug={drug}
          herb={herb}
          sourcesUsed={sourcesUsed}
          fdaData={fdaData}
          topCitationCount={topCitationCount}
          aiSummary={aiSummary}
          scores={scores}
          confidenceReasoning={confidenceReasoning}
        />
      }
      fileName={`${drug}_${herb}_Interaction_Report.pdf`}
    >
      {children}
    </PDFDownloadLink>
  );
}

/**
 * Generate Pharmacology PDF download trigger.
 * Usage: <PharmacologyPDFDownloadLink ... />
 */
export function PharmacologyPDFDownloadLink({
  result,
  aiSummary,
  children,
}: {
  result: PharmResult;
  aiSummary?: string | null;
  children: React.ReactNode;
}) {
  return (
    <PDFDownloadLink
      document={<PharmacologyPDFDocument result={result} aiSummary={aiSummary} />}
      fileName={`${result.herb}_Phytochemical_Analysis.pdf`}
    >
      {children}
    </PDFDownloadLink>
  );
}
