import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isSupabaseActive, savePdfReport } from '@/lib/supabase';

// POST /api/pdf-reports — Save PDF report metadata
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reportType, reportData, pdfUrl, drugName, herbName } = body;

    // Save to Prisma/SQLite (resilient)
    let report = null;
    try {
      report = await db.pdfReport.create({
        data: {
          reportType: reportType || 'interaction',
          reportData: reportData ? JSON.stringify(reportData) : '{}',
          pdfUrl: pdfUrl || '',
        },
      });
    } catch (dbErr) {
      console.warn('[PDF Report] Prisma save failed:', (dbErr as Error).message);
    }

    // Save to Supabase
    if (isSupabaseActive()) {
      try {
        await savePdfReport({
          report_type: reportType || 'interaction',
          report_data: reportData || {},
          pdf_url: pdfUrl || '',
          drug_name: drugName || '',
          herb_name: herbName || '',
        });
      } catch (e) {
        console.error('[Supabase] Failed to save PDF report:', e);
      }
    }

    return NextResponse.json(report || { id: 'supabase-only', saved: true }, { status: 201 });
  } catch (error) {
    console.error('Save PDF report error:', error);
    return NextResponse.json({ error: 'Failed to save PDF report.' }, { status: 500 });
  }
}

// GET /api/pdf-reports — List PDF reports
export async function GET() {
  try {
    // Get from Prisma/SQLite (resilient)
    try {
      const reports = await db.pdfReport.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return NextResponse.json(reports);
    } catch (dbErr) {
      console.warn('[PDF Report] Prisma read failed:', (dbErr as Error).message);
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('List PDF reports error:', error);
    return NextResponse.json({ error: 'Failed to list PDF reports.' }, { status: 500 });
  }
}
