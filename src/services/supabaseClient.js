import { createClient } from '@supabase/supabase-js';

const env = (typeof import.meta !== 'undefined' && import.meta.env) 
  ? import.meta.env 
  : (typeof process !== 'undefined' && process.env) 
    ? process.env 
    : {};

const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!isSupabaseConfigured) {
  console.info(
    '%c LocalLoop: Running in Sandboxed Mock Adapter Mode %c\nTo connect live Supabase, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.',
    'background: #1b3b32; color: #fff; padding: 4px 8px; border-radius: 4px; font-weight: bold;',
    'color: #555;'
  );
}
