const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config(); // Load environment variables

const app = express();
app.use(cors());
app.use(express.json());

// Set up PostgreSQL client with the environment variables
const pool = new Pool({
  host: process.env.PGHOST, 
  database: process.env.PGDATABASE, 
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT || 5432, 
  ssl: {
    rejectUnauthorized: false, 
  },
});

// Test the connection to the PostgreSQL database
pool.connect()
  .then(() => console.log('Connected to PostgreSQL database'))
  .catch((err) => console.error('Database connection error:', err));

// Define routes (example route to get pins)
app.get('/api/pins', async (req, res) => {
  const { username } = req.query;
  
  try {
    let query = 'SELECT * FROM pins';
    let values = [];
    
    if (username) {
      query += ' WHERE username = $1';
      values.push(username);
    }
    
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching pins:', err);
    res.status(500).send('Server Error');
  }
});

// Define route to create pins
app.post('/api/pins', async (req, res) => {
  const { title, description, image_url, username } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO pins (title, description, image_url, username) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description, image_url, username]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting pin:', err);
    res.status(500).send('Server Error');
  }
});

// Start the Express server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
