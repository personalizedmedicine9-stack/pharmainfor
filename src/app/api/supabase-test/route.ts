import { NextResponse } from 'next/server';
import { testSupabaseConnection, isSupabaseActive, getSupabaseConfig } from '@/lib/supabase';

export async function GET() {
  const config = getSupabaseConfig();
  
  if (!config.isConfigured) {
    return NextResponse.json({
      configured: false,
      active: false,
      message: 'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local',
    });
  }

  if (!config.isActive) {
    return NextResponse.json({
      configured: true,
      active: false,
      message: 'Supabase is configured but not active. Set USE_SUPABASE=true in .env.local to activate.',
    });
  }

  const testResult = await testSupabaseConnection();
  
  return NextResponse.json({
    configured: true,
    active: true,
    connection: testResult,
    url: config.url?.replace(/\/\/[^@]+@/, '//***@'), // Mask URL slightly
  });
}
