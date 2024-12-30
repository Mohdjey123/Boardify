const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const {
   Pool
} = require('pg');

dotenv.config(); // Load environment variables

const app = express();
app.use(cors());
app.use(express.json());


const pool = new Pool({
   connectionString: process.env.DATABASE_URL,
   ssl: {
      rejectUnauthorized: false
   },
});

const createPinsTable = async () => {
   const createTableQuery = `
     CREATE TABLE IF NOT EXISTS pins (
       id SERIAL PRIMARY KEY,
       title VARCHAR(255) NOT NULL,
       description TEXT,
       image_url TEXT,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     );
   `;
   await pool.query(createTableQuery);
   console.log('Pins table created or already exists.');
};

app.get('/api/pins', async (req, res) => {
   try {
      const result = await pool.query('SELECT * FROM pins');
      res.json(result.rows);
   } catch (err) {
      console.error('Error fetching pins:', err);
      res.status(500).send('Server Error');
   }
});

const PORT = process.env.PORT || 5000;

pool.connect()
  .then(() => {
    console.log('Connected to PostgreSQL database');
    return createPinsTable();
  })
  .catch(err => console.error('Database connection error:', err));
app.listen(PORT, () => {
   console.log(`Backend running on port ${PORT}`);
});