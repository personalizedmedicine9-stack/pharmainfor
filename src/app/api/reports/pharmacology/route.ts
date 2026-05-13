import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isSupabaseActive, savePharmacologyReport, getRecentPharmacologyReports } from '@/lib/supabase';

// POST /api/reports/pharmacology — Save pharmacology report
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { compoundName, herbName, mechanisms, activeCompounds, pharmacologicalActions, evidenceScore, references } = body;

    // Save to Prisma/SQLite (resilient)
    let report = null;
    try {
      report = await db.pharmacologyReport.create({
        data: {
          compoundName: compoundName || herbName,
          herbName,
          mechanisms: mechanisms ? JSON.stringify(mechanisms) : '[]',
          activeCompounds: activeCompounds ? JSON.stringify(activeCompounds) : '[]',
          pharmacologicalActions: pharmacologicalActions ? JSON.stringify(pharmacologicalActions) : '[]',
          evidenceScore: evidenceScore || 0,
          references: references ? JSON.stringify(references) : '[]',
        },
      });
    } catch (dbErr) {
      console.warn('[Pharmacology Report] Prisma save failed:', (dbErr as Error).message);
    }

    // Save to Supabase
    if (isSupabaseActive()) {
      try {
        await savePharmacologyReport({
          compound_name: compoundName || herbName,
          herb_name: herbName,
          mechanisms: Array.isArray(mechanisms) ? mechanisms : [],
          active_compounds: Array.isArray(activeCompounds) ? activeCompounds : [],
          pharmacological_actions: Array.isArray(pharmacologicalActions) ? pharmacologicalActions : [],
          evidence_score: evidenceScore || 0,
          ref_list: Array.isArray(references) ? references : [],
        });
      } catch (e) {
        console.error('[Supabase] Failed to save pharmacology report:', e);
      }
    }

    return NextResponse.json(report || { id: 'supabase-only', herbName, saved: true }, { status: 201 });
  } catch (error) {
    console.error('Save pharmacology report error:', error);
    return NextResponse.json({ error: 'Failed to save report.' }, { status: 500 });
  }
}

// GET /api/reports/pharmacology — List pharmacology reports
export async function GET() {
  try {
    // Prefer Supabase if active
    if (isSupabaseActive()) {
      try {
        const supabaseReports = await getRecentPharmacologyReports(50);
        if (supabaseReports.length > 0) {
          const mapped = supabaseReports.map(r => ({
            id: r.id,
            compoundName: r.compound_name || r.herb_name,
            herbName: r.herb_name,
            mechanisms: JSON.stringify(r.mechanisms || []),
            activeCompounds: JSON.stringify(r.active_compounds || []),
            pharmacologicalActions: JSON.stringify(r.pharmacological_actions || []),
            evidenceScore: r.evidence_score || 0,
            evidenceLevel: r.evidence_level || 'Low',
            confidence: r.confidence || 'Low',
            references: JSON.stringify(r.ref_list || []),
            createdAt: r.created_at,
          }));
          return NextResponse.json(mapped);
        }
      } catch (e) {
        console.error('[Supabase] Failed to get pharmacology reports, falling back:', e);
      }
    }

    // Fallback to Prisma (resilient)
    try {
      const reports = await db.pharmacologyReport.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return NextResponse.json(reports);
    } catch (dbErr) {
      console.warn('[Pharmacology Report] Prisma read failed:', (dbErr as Error).message);
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('List pharmacology reports error:', error);
    return NextResponse.json({ error: 'Failed to list reports.' }, { status: 500 });
  }
}
