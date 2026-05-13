import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isSupabaseActive, saveSearchHistory, getSearchHistoryFromSupabase } from '@/lib/supabase';

// POST /api/search-history — Save search history
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, engineType, resultsCount, sourcesUsed, topCitationCount, hasFdaData, drug, herb } = body;

    // Save to Prisma/SQLite (always, resilient)
    let entry = null;
    try {
      entry = await db.searchHistory.create({
        data: {
          query,
          engineType: engineType || 'interaction',
          resultsCount: resultsCount || 0,
          sourcesUsed: sourcesUsed ? JSON.stringify(sourcesUsed) : '[]',
          topCitationCount: topCitationCount || 0,
          hasFdaData: hasFdaData || false,
        },
      });
    } catch (dbErr) {
      console.warn('[Search History] Prisma save failed:', (dbErr as Error).message);
    }

    // Save to Supabase (if active)
    if (isSupabaseActive()) {
      try {
        await saveSearchHistory({
          query,
          engine_type: engineType || 'interaction',
          drug: drug || '',
          herb: herb || '',
          results_count: resultsCount || 0,
          sources_used: sourcesUsed || [],
          top_citation_count: topCitationCount || 0,
          has_fda_data: hasFdaData || false,
        });
      } catch (e) {
        console.error('[Supabase] Failed to save search history:', e);
      }
    }

    return NextResponse.json(entry || { id: 'saved', query, saved: true }, { status: 201 });
  } catch (error) {
    console.error('Save search history error:', error);
    return NextResponse.json({ error: 'Failed to save search history.' }, { status: 500 });
  }
}

// GET /api/search-history — Get recent search history
export async function GET() {
  try {
    // Prefer Supabase if active
    if (isSupabaseActive()) {
      try {
        const supabaseHistory = await getSearchHistoryFromSupabase(20);
        if (supabaseHistory.length > 0) {
          // Map Supabase format to the format the frontend expects
          const mapped = supabaseHistory.map(h => ({
            id: h.id,
            query: h.query,
            engineType: h.engine_type || 'interaction',
            resultsCount: h.results_count || 0,
            sourcesUsed: Array.isArray(h.sources_used) ? h.sources_used : [],
            topCitationCount: h.top_citation_count || 0,
            hasFdaData: h.has_fda_data || false,
            timestamp: h.searched_at,
          }));
          return NextResponse.json(mapped);
        }
      } catch (e) {
        console.error('[Supabase] Failed to get search history, falling back to Prisma:', e);
      }
    }

    // Fallback to Prisma/SQLite (resilient)
    try {
      const history = await db.searchHistory.findMany({
        orderBy: { timestamp: 'desc' },
        take: 20,
      });
      return NextResponse.json(history);
    } catch (dbErr) {
      console.warn('[Search History] Prisma read failed:', (dbErr as Error).message);
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Get search history error:', error);
    return NextResponse.json({ error: 'Failed to get search history.' }, { status: 500 });
  }
}
