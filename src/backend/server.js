const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const https = require('https');
const fs = require('fs');

dotenv.config();

const app = express();

// Enhanced CORS Configuration
const corsOptions = {
  origin: [
    'https://boardify-puce.vercel.app',
    'https://*.vercel.app',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true,
    ca: process.env.PGSSLROOTCERT 
      ? fs.readFileSync(process.env.PGSSLROOTCERT).toString()
      : undefined
  }
});

// Test connection on startup
pool.query('SELECT NOW()')
  .then(() => console.log('✅ Connected to Neon PostgreSQL'))
  .catch(err => {
    console.error('❌ Failed to connect to Neon PostgreSQL:', err);
    process.exit(1);
  });

// Consolidated Database Initialization
const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Create tables in a single transaction
    await client.query(`
      CREATE TABLE IF NOT EXISTS pins (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        description TEXT,
        image_url TEXT,
        username VARCHAR(255),
        views INTEGER DEFAULT 0,
        rich_text JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS likes (
        id SERIAL PRIMARY KEY,
        pin_id INTEGER REFERENCES pins(id) ON DELETE CASCADE,
        username VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(pin_id, username)
      );
      
      CREATE TABLE IF NOT EXISTS followers (
        id SERIAL PRIMARY KEY,
        follower_username VARCHAR(255),
        following_username VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_username, following_username)
      );
      
      CREATE TABLE IF NOT EXISTS boards (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255),
        title VARCHAR(255),
        description TEXT,
        is_private BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS saved_pins (
        id SERIAL PRIMARY KEY,
        board_id INTEGER REFERENCES boards(id) ON DELETE CASCADE,
        pin_id INTEGER REFERENCES pins(id) ON DELETE CASCADE,
        saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(board_id, pin_id)
      );
      
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        pin_id INTEGER REFERENCES pins(id),
        username VARCHAR(255),
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS pin_images (
        id SERIAL PRIMARY KEY,
        pin_id INTEGER REFERENCES pins(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('COMMIT');
    console.log('Database tables initialized successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Database initialization failed:', err);
    process.exit(1);
  } finally {
    client.release();
  }
};

// Initialize database on startup
initializeDatabase();

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => process.exit(1));
});

// Modified /api/pins endpoint
app.get('/pins', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        p.id,
        p.title,
        p.description,
        p.image_url AS "imageUrl",
        p.username,
        p.created_at AS "createdAt",
        COUNT(l.id)::INTEGER AS likes,
        COUNT(c.id)::INTEGER AS comments
      FROM pins p
      LEFT JOIN likes l ON p.id = l.pin_id
      LEFT JOIN comments c ON p.id = c.pin_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT 20
    `);
    
    res.json({ status: 'success', data: rows });
  } catch (err) {
    console.error('🚨 API Error:', err.stack);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch pins',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Create pin with transaction
app.post('/pins', async (req, res) => {
  const { title, description, images, username, richText } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    
    const pinResult = await client.query(
      `INSERT INTO pins (title, description, image_url, username, rich_text)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, description, images[0], username, richText]
    );
    
    const pinId = pinResult.rows[0].id;

    if (images.length > 1) {
      const additionalImages = images.slice(1);
      for (const imageUrl of additionalImages) {
        await client.query(
          'INSERT INTO pin_images (pin_id, image_url) VALUES ($1, $2)',
          [pinId, imageUrl]
        );
      }
    }
    
    await client.query('COMMIT');
    
    const completePin = await client.query(`
      SELECT p.*, ARRAY_AGG(pi.image_url) AS additional_images
      FROM pins p
      LEFT JOIN pin_images pi ON p.id = pi.pin_id
      WHERE p.id = $1
      GROUP BY p.id
    `, [pinId]);
    
    res.status(201).json(completePin.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating pin:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.use((err, req, res, next) => {
  console.error('\x1b[31m', 'Server Error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' 
      ? 'Please try again later' 
      : err.message
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received - shutting down');
  pool.end().then(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});