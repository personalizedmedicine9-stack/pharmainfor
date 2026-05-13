import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseActive, getSupabaseClient } from '@/lib/supabase';
import { db } from '@/lib/db';

// POST /api/saved-reports — Save/bookmark a report
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      reportId, reportType, reportData, drugName, herbName, userId, authMode,
      // Also accept snake_case from frontend
      report_type, drug_name, herb_name, report_data,
    } = body;

    // Normalize field names (frontend might send snake_case or camelCase)
    const finalReportId = reportId;
    const finalReportType = reportType || report_type;
    const finalReportData = reportData || report_data;
    const finalDrugName = drugName || drug_name;
    const finalHerbName = herbName || herb_name;
    const finalAuthMode = authMode || 'local';

    if (!finalReportId || !finalReportType) {
      return NextResponse.json({ error: 'Report ID and type are required.' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    // Build a title from drug+herb for Supabase
    const title = finalReportType === 'interaction'
      ? `${finalDrugName || 'Drug'} × ${finalHerbName || 'Herb'} Interaction`
      : `${finalHerbName || 'Herb'} Pharmacology`;

    // ─── Cloud user: Try Supabase first, fallback to local ───
    if (finalAuthMode === 'supabase' && isSupabaseActive()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('saved_reports')
            .insert({
              // Match actual Supabase schema: id, user_id, report_type, title, report_data, created_at
              user_id: userId,
              report_type: finalReportType,
              title: title,
              report_data: {
                reportId: finalReportId,
                drugName: finalDrugName || '',
                herbName: finalHerbName || '',
                ...finalReportData,
              },
            })
            .select()
            .single();

          if (!error && data) {
            return NextResponse.json({ id: data.id, saved: true }, { status: 201 });
          }

          // Supabase failed — fall through to local
          console.warn('[Supabase] saveReport failed, falling back to local:', error?.message);
        } catch (supabaseErr: any) {
          console.warn('[Supabase] saveReport exception, falling back to local:', supabaseErr?.message);
        }
      }
    }

    // ─── Local user OR Supabase fallback: Save to SQLite via Prisma ───
    // Check if already saved
    const existing = await db.savedReport.findFirst({
      where: { reportId: finalReportId, userId },
    });

    if (existing) {
      return NextResponse.json({ message: 'Report already saved.', id: existing.id, saved: true });
    }

    const report = await db.savedReport.create({
      data: {
        userId,
        reportId: finalReportId,
        reportType: finalReportType,
        drugName: finalDrugName || '',
        herbName: finalHerbName || '',
        evidenceScore: finalReportData?.evidenceScore || finalReportData?.evidence_score || 0,
        evidenceLevel: finalReportData?.evidenceLevel || finalReportData?.evidence_level || 'Low',
        confidence: finalReportData?.confidence || 'Low',
        reportData: JSON.stringify(finalReportData || {}),
      },
    });

    return NextResponse.json({ id: report.id, saved: true }, { status: 201 });
  } catch (error: any) {
    console.error('Save report error:', error?.message || error);
    return NextResponse.json({ error: 'Failed to save report. Please try again.' }, { status: 500 });
  }
}

// GET /api/saved-reports — List saved/bookmarked reports
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get('type');
    const userId = searchParams.get('userId');
    const authMode = searchParams.get('authMode') || 'local';

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    // ─── Cloud user: Try Supabase first ───
    if (authMode === 'supabase' && isSupabaseActive()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          let query = supabase
            .from('saved_reports')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

          if (reportType) {
            query = query.eq('report_type', reportType);
          }

          const { data, error } = await query;

          if (!error && data && data.length > 0) {
            // Normalize Supabase response to match frontend expectations
            const normalized = data.map((row: any) => {
              const rd = row.report_data || {};
              return {
                id: row.id,
                report_id: rd.reportId || row.id,
                report_type: row.report_type,
                drug_name: rd.drugName || '',
                herb_name: rd.herbName || '',
                evidence_level: rd.evidenceLevel || rd.evidence_level || 'Low',
                confidence: rd.confidence || 'Low',
                report_data: rd,
                created_at: row.created_at,
                user_id: row.user_id,
                // camelCase too
                reportId: rd.reportId || row.id,
                reportType: row.report_type,
                drugName: rd.drugName || '',
                herbName: rd.herbName || '',
                createdAt: row.created_at,
              };
            });
            return NextResponse.json(normalized);
          }

          if (error) {
            console.warn('[Supabase] getSavedReports failed, falling back to local:', error.message);
          }
        } catch (supabaseErr: any) {
          console.warn('[Supabase] getSavedReports exception, falling back to local:', supabaseErr?.message);
        }
      }
    }

    // ─── Local user OR Supabase fallback: Fetch from SQLite ───
    const where: any = { userId };
    if (reportType) where.reportType = reportType;

    const reports = await db.savedReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Parse reportData from JSON string AND normalize to snake_case for frontend
    const parsed = reports.map((r: any) => {
      const reportDataParsed = typeof r.reportData === 'string' ? JSON.parse(r.reportData) : r.reportData;
      return {
        id: r.id,
        report_id: r.reportId,
        report_type: r.reportType,
        drug_name: r.drugName,
        herb_name: r.herbName,
        evidence_score: r.evidenceScore,
        evidence_level: r.evidenceLevel,
        confidence: r.confidence,
        report_data: reportDataParsed,
        created_at: r.createdAt,
        user_id: r.userId,
        // Also camelCase
        reportId: r.reportId,
        reportType: r.reportType,
        drugName: r.drugName,
        herbName: r.herbName,
        createdAt: r.createdAt,
      };
    });

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('Get saved reports error:', error?.message || error);
    return NextResponse.json({ error: 'Failed to fetch saved reports.' }, { status: 500 });
  }
}

// DELETE /api/saved-reports — Unsave/remove a bookmark
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const reportId = searchParams.get('reportId');
    const userId = searchParams.get('userId');
    const authMode = searchParams.get('authMode') || 'local';

    if (!id && !reportId) {
      return NextResponse.json({ error: 'Report ID required.' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    // ─── Cloud user: Try Supabase first ───
    if (authMode === 'supabase' && isSupabaseActive()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          if (id) {
            const { error } = await supabase
              .from('saved_reports')
              .delete()
              .eq('id', id)
              .eq('user_id', userId);
            if (!error) return NextResponse.json({ deleted: true });
            console.warn('[Supabase] deleteSavedReport failed, falling back to local:', error.message);
          }
        } catch (supabaseErr: any) {
          console.warn('[Supabase] deleteSavedReport exception, falling back to local:', supabaseErr?.message);
        }
      }
    }

    // ─── Local user OR Supabase fallback: Delete from SQLite ───
    if (id) {
      await db.savedReport.deleteMany({ where: { id, userId } });
    } else if (reportId) {
      await db.savedReport.deleteMany({ where: { reportId: reportId!, userId } });
    }

    return NextResponse.json({ deleted: true });
  } catch (error: any) {
    console.error('Delete saved report error:', error?.message || error);
    return NextResponse.json({ error: 'Failed to delete report.' }, { status: 500 });
  }
}
