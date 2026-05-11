import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || supabaseUrl === 'your-supabase-url') {
    console.warn('Supabase URL is not configured. Please check your .env.local file.');
    // Return a dummy client or handle as needed
  }

  return createBrowserClient(
    supabaseUrl!,
    supabaseAnonKey!
  )
}
