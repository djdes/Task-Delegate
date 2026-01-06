import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'set' : 'not set');
      console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'set' : 'not set');
      throw new Error('Missing Supabase environment variables');
    }
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return supabaseClient;
}

export async function initializeDatabase(): Promise<void> {
  const supabase = getSupabase();
  
  console.log('Checking if database tables exist...');
  
  // Check if workers table exists by trying to query it
  const { error: workersError } = await supabase.from('workers').select('id').limit(1);
  
  if (workersError && workersError.code === 'PGRST205') {
    console.log('Tables do not exist. Please create them in Supabase SQL Editor:');
    console.log(`
-- Run this SQL in your Supabase Dashboard -> SQL Editor:

CREATE TABLE IF NOT EXISTS workers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  worker_id INTEGER REFERENCES workers(id) ON DELETE SET NULL
);

-- Disable RLS since we're using service_role key
ALTER TABLE workers DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
    `);
    throw new Error('Database tables not found. Please create them in Supabase SQL Editor (see console for SQL).');
  } else if (workersError) {
    console.error('Database connection error:', workersError);
  } else {
    console.log('Database tables exist and are accessible!');
  }
}

export const supabase = getSupabase();
