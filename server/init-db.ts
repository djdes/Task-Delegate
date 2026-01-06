import pg from 'pg';

const { Pool } = pg;

export async function initializeDatabase(): Promise<void> {
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;
  
  if (!dbPassword) {
    console.log('SUPABASE_DB_PASSWORD not set, skipping database initialization');
    return;
  }

  // Use Supavisor session mode (port 5432) for IPv4 compatibility and DDL support
  const pool = new Pool({
    host: 'aws-0-eu-central-1.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres.kwalofricgonrkmdyiko',
    password: dbPassword,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to Supabase PostgreSQL via pooler (session mode)...');
    
    const client = await pool.connect();
    
    console.log('Connected! Creating tables if they do not exist...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS workers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL
      );
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        worker_id INTEGER REFERENCES workers(id) ON DELETE SET NULL
      );
    `);
    
    console.log('Database tables created successfully!');
    
    client.release();
    await pool.end();
    
  } catch (error: any) {
    console.error('Database initialization error:', error.message);
    await pool.end();
    throw error;
  }
}
