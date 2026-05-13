import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isSupabaseActive, saveInteractionReport, getRecentInteractionReports, deleteReport } from '@/lib/supabase';

// POST /api/reports/interaction — Save interaction report
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { drugName, herbName, interactionType, severity, mechanism, confidenceScore, evidenceLevel, references } = body;

    // Save to Prisma/SQLite (resilient)
    let report = null;
    try {
      report = await db.interactionReport.create({
        data: {
          drugName,
          herbName,
          interactionType: interactionType || 'Unknown',
          severity: severity || 'Unknown',
          mechanism: mechanism || '',
          confidenceScore: confidenceScore || 0,
          evidenceLevel: evidenceLevel || 'Low',
          references: references ? JSON.stringify(references) : '[]',
        },
      });
    } catch (dbErr) {
      console.warn('[Interaction Report] Prisma save failed:', (dbErr as Error).message);
    }

    // Save to Supabase
    if (isSupabaseActive()) {
      try {
        await saveInteractionReport({
          drug_name: drugName,
          herb_name: herbName,
          interaction_type: interactionType || 'Unknown',
          severity: severity || 'Unknown',
          mechanism: mechanism || '',
          confidence_score: confidenceScore || 0,
          evidence_level: evidenceLevel || 'Low',
          ref_list: Array.isArray(references) ? references : [],
        });
      } catch (e) {
        console.error('[Supabase] Failed to save interaction report:', e);
      }
    }

    return NextResponse.json(report || { id: 'supabase-only', drugName, herbName, saved: true }, { status: 201 });
  } catch (error) {
    console.error('Save interaction report error:', error);
    return NextResponse.json({ error: 'Failed to save report.' }, { status: 500 });
  }
}

// GET /api/reports/interaction — List interaction reports
export async function GET() {
  try {
    // Prefer Supabase if active
    if (isSupabaseActive()) {
      try {
        const supabaseReports = await getRecentInteractionReports(50);
        if (supabaseReports.length > 0) {
          const mapped = supabaseReports.map(r => ({
            id: r.id,
            drugName: r.drug_name,
            herbName: r.herb_name,
            interactionType: r.interaction_type || 'Unknown',
            severity: r.severity || 'Unknown',
            mechanism: r.mechanism || '',
            confidenceScore: r.confidence_score || 0,
            evidenceLevel: r.evidence_level || 'Low',
            references: JSON.stringify(r.ref_list || []),
            createdAt: r.created_at,
          }));
          return NextResponse.json(mapped);
        }
      } catch (e) {
        console.error('[Supabase] Failed to get interaction reports, falling back:', e);
      }
    }

    // Fallback to Prisma (resilient)
    try {
      const reports = await db.interactionReport.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return NextResponse.json(reports);
    } catch (dbErr) {
      console.warn('[Interaction Report] Prisma read failed:', (dbErr as Error).message);
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('List interaction reports error:', error);
    return NextResponse.json({ error: 'Failed to list reports.' }, { status: 500 });
  }
}
