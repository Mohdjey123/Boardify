import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: process.env.NODE_ENV === 'production'
  },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000
});

// Add connection monitoring
pool.on('connect', () => console.log('Database connected'));
pool.on('error', err => console.error('Database error:', err));

export const query = async (text, params) => {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
};

export default pool;