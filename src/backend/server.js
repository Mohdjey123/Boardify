const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config(); // Load environment variables

const app = express();
app.use(cors());
app.use(express.json());

// Updated pool configuration with SSL and connection timeout
const pool = new Pool({
  user: process.env.NEXT_PUBLIC_PGUSER,
  host: process.env.NEXT_PUBLIC_PGHOST,
  database: process.env.NEXT_PUBLIC_PGDATABASE,
  password: process.env.NEXT_PUBLIC_PGPASSWORD,
  port: process.env.NEXT_PUBLIC_PGPORT,
  ssl: {
    rejectUnauthorized: false // Required for Neon database
  },
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20 // Maximum number of clients in the pool
});

// Add error handling for the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL');
    client.release();
  } catch (err) {
    console.error('Error connecting to PostgreSQL:', err);
  }
};

testConnection();

// Database initialization function
const initializeTables = async () => {
  try {
    // Create pins table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pins (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        description TEXT,
        image_url TEXT,
        username VARCHAR(255),
        views INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create likes table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id SERIAL PRIMARY KEY,
        pin_id INTEGER REFERENCES pins(id) ON DELETE CASCADE,
        username VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(pin_id, username)
      );
    `);

    // Create followers table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS followers (
        id SERIAL PRIMARY KEY,
        follower_username VARCHAR(255),
        following_username VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_username, following_username)
      );
    `);

    // Create boards table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS boards (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255),
        title VARCHAR(255),
        description TEXT,
        is_private BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create saved_pins table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS saved_pins (
        id SERIAL PRIMARY KEY,
        board_id INTEGER REFERENCES boards(id) ON DELETE CASCADE,
        pin_id INTEGER REFERENCES pins(id) ON DELETE CASCADE,
        saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(board_id, pin_id)
      );
    `);

    console.log('All tables initialized successfully');
  } catch (err) {
    console.error('Error initializing tables:', err);
  }
};

// Call initialization function after pool is created
initializeTables();

// Initialize database
async function initializeDatabase() {
  try {
    // Create tables if they don't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS followers (
        id SERIAL PRIMARY KEY,
        follower_username VARCHAR(255),
        following_username VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_username, following_username)
      );
    `);

    // Add created_at column if it doesn't exist
    await pool.query(`
      ALTER TABLE pins 
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);

    // Add comments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        pin_id INTEGER REFERENCES pins(id),
        username VARCHAR(255),
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add boards table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS boards (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255),
        title VARCHAR(255),
        description TEXT,
        is_private BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add saved_pins table for pins in boards
    await pool.query(`
      CREATE TABLE IF NOT EXISTS saved_pins (
        id SERIAL PRIMARY KEY,
        board_id INTEGER REFERENCES boards(id) ON DELETE CASCADE,
        pin_id INTEGER REFERENCES pins(id) ON DELETE CASCADE,
        saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(board_id, pin_id)
      );
    `);

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

// Initialize the database when server starts
initializeDatabase();

// Define routes (example route to get pins)
app.get('/api/pins', async (req, res) => {
  const { username } = req.query;
  
  try {
    let query = `
      SELECT p.*, 
             COALESCE(pl.username IS NOT NULL, false) as liked_by_user
      FROM pins p
      LEFT JOIN pin_likes pl ON p.id = pl.pin_id AND pl.username = $1
    `;
    let values = [username || null];
    
    if (username) {
      query += ' WHERE p.username = $1';
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
  const { title, description, images, username, richText } = req.body;
  
  try {
    // Start a transaction
    await pool.query('BEGIN');
    
    // Create the main pin
    const pinResult = await pool.query(
      `INSERT INTO pins (
        title, 
        description, 
        image_url, 
        username, 
        rich_text,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) 
      RETURNING *`,
      [title, description, images[0], username, richText]
    );
    
    const pinId = pinResult.rows[0].id;
    
    // Add additional images if any
    if (images.length > 1) {
      const additionalImages = images.slice(1);
      for (const imageUrl of additionalImages) {
        await pool.query(
          'INSERT INTO pin_images (pin_id, image_url) VALUES ($1, $2)',
          [pinId, imageUrl]
        );
      }
    }
    
    // Commit transaction
    await pool.query('COMMIT');
    
    // Fetch the complete pin with all images
    const completePin = await pool.query(`
      SELECT 
        p.*,
        ARRAY_AGG(pi.image_url) FILTER (WHERE pi.image_url IS NOT NULL) as additional_images
      FROM pins p
      LEFT JOIN pin_images pi ON p.id = pi.pin_id
      WHERE p.id = $1
      GROUP BY p.id
    `, [pinId]);
    
    res.json(completePin.rows[0]);
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error creating pin:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add routes for likes and views
app.post('/api/pins/:id/like', async (req, res) => {
  const { id } = req.params;
  const { username } = req.body;

  try {
    // First, check if user has already liked the pin
    const likeCheck = await pool.query(
      'SELECT * FROM pin_likes WHERE pin_id = $1 AND username = $2',
      [id, username]
    );

    if (likeCheck.rows.length > 0) {
      // User already liked, so remove the like
      await pool.query(
        'DELETE FROM pin_likes WHERE pin_id = $1 AND username = $2',
        [id, username]
      );
      await pool.query(
        'UPDATE pins SET likes = likes - 1 WHERE id = $1 RETURNING *',
        [id]
      );
      res.json({ liked: false });
    } else {
      // Add new like
      await pool.query(
        'INSERT INTO pin_likes (pin_id, username) VALUES ($1, $2)',
        [id, username]
      );
      const result = await pool.query(
        'UPDATE pins SET likes = likes + 1 WHERE id = $1 RETURNING *',
        [id]
      );
      res.json({ liked: true });
    }
  } catch (err) {
    console.error('Error updating likes:', err);
    res.status(500).send('Server Error');
  }
});

app.post('/api/pins/:id/view', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'UPDATE pins SET views = views + 1 WHERE id = $1 RETURNING *',
      [id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating views:', err);
    res.status(500).send('Server Error');
  }
});

// Get posts from followed users
app.get('/api/feed', async (req, res) => {
  const { username } = req.query;
  
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    // Get pins from users that the current user follows and their own pins
    const result = await pool.query(`
      SELECT DISTINCT p.*, 
             COALESCE(pl.username IS NOT NULL, false) as liked_by_user
      FROM pins p
      LEFT JOIN pin_likes pl ON p.id = pl.pin_id AND pl.username = $1
      WHERE p.username IN (
        SELECT following_username 
        FROM followers 
        WHERE follower_username = $1
      )
      OR p.username = $1
      ORDER BY p.created_at DESC
    `, [username]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching feed:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Follow/Unfollow user
app.post('/api/follow', async (req, res) => {
  const { follower_username, following_username } = req.body;
  
  try {
    const exists = await pool.query(
      'SELECT * FROM followers WHERE follower_username = $1 AND following_username = $2',
      [follower_username, following_username]
    );
    
    if (exists.rows.length > 0) {
      await pool.query(
        'DELETE FROM followers WHERE follower_username = $1 AND following_username = $2',
        [follower_username, following_username]
      );
      res.json({ following: false });
    } else {
      await pool.query(
        'INSERT INTO followers (follower_username, following_username) VALUES ($1, $2)',
        [follower_username, following_username]
      );
      res.json({ following: true });
    }
  } catch (err) {
    console.error('Error following/unfollowing:', err);
    res.status(500).send('Server Error');
  }
});

// Search users
app.get('/api/search/users', async (req, res) => {
  const { query } = req.query;
  
  try {
    const result = await pool.query(`
      SELECT DISTINCT username 
      FROM pins 
      WHERE username ILIKE $1
    `, [`%${query}%`]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error searching users:', err);
    res.status(500).send('Server Error');
  }
});

// Check if following
app.get('/api/following-status', async (req, res) => {
  const { follower_username, following_username } = req.query;
  
  try {
    const result = await pool.query(
      'SELECT * FROM followers WHERE follower_username = $1 AND following_username = $2',
      [follower_username, following_username]
    );
    
    res.json({ following: result.rows.length > 0 });
  } catch (err) {
    console.error('Error checking following status:', err);
    res.status(500).send('Server Error');
  }
});

// Add this new endpoint to get user stats
app.get('/api/user-stats/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    // Get pin count
    const pinsResult = await pool.query(
      'SELECT COUNT(*) as pins FROM pins WHERE username = $1',
      [username]
    );

    // Get followers count
    const followersResult = await pool.query(
      'SELECT COUNT(*) as followers FROM followers WHERE following_username = $1',
      [username]
    );

    // Get following count
    const followingResult = await pool.query(
      'SELECT COUNT(*) as following FROM followers WHERE follower_username = $1',
      [username]
    );

    res.json({
      pins: parseInt(pinsResult.rows[0].pins),
      followers: parseInt(followersResult.rows[0].followers),
      following: parseInt(followingResult.rows[0].following)
    });
  } catch (err) {
    console.error('Error fetching user stats:', err);
    res.status(500).send('Server Error');
  }
});

// Make sure we have the created_at column in the pins table
app.get('/api/setup', async (req, res) => {
  try {
    // Add created_at column if it doesn't exist
    await pool.query(`
      ALTER TABLE pins 
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);

    res.json({ message: 'Setup completed successfully' });
  } catch (err) {
    console.error('Setup error:', err);
    res.status(500).json({ error: 'Setup failed' });
  }
});

// Add comment endpoints
app.post('/api/pins/:pinId/comments', async (req, res) => {
  const { pinId } = req.params;
  const { username, content } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO comments (pin_id, username, content) VALUES ($1, $2, $3) RETURNING *',
      [pinId, username, content]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).send('Server Error');
  }
});

app.get('/api/pins/:pinId/comments', async (req, res) => {
  const { pinId } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM comments WHERE pin_id = $1 ORDER BY created_at DESC',
      [pinId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).send('Server Error');
  }
});

// Create board
app.post('/api/boards', async (req, res) => {
  const { username, title, description, is_private } = req.body;
  
  try {
    const result = await pool.query(
      'INSERT INTO boards (username, title, description, is_private) VALUES ($1, $2, $3, $4) RETURNING *',
      [username, title, description, is_private]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating board:', err);
    res.status(500).send('Server Error');
  }
});

// Get user's boards with cover image and pin count
app.get('/api/boards/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    const result = await pool.query(`
      SELECT 
        b.*,
        COUNT(DISTINCT sp.pin_id) as pin_count,
        (
          SELECT p.image_url 
          FROM pins p 
          JOIN saved_pins sp2 ON p.id = sp2.pin_id 
          WHERE sp2.board_id = b.id 
          ORDER BY sp2.saved_at DESC 
          LIMIT 1
        ) as cover_image
      FROM boards b
      LEFT JOIN saved_pins sp ON b.id = sp.board_id
      WHERE b.username = $1
      GROUP BY b.id
      ORDER BY b.created_at DESC
    `, [username]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching boards:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get user's saved pins
app.get('/api/pins/saved/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    const result = await pool.query(`
      SELECT DISTINCT p.*, b.title as board_title, sp.saved_at
      FROM pins p
      JOIN saved_pins sp ON p.id = sp.pin_id
      JOIN boards b ON sp.board_id = b.id
      WHERE b.username = $1
      ORDER BY sp.saved_at DESC
    `, [username]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching saved pins:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get user's created pins
app.get('/api/pins/created/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT * FROM pins WHERE username = $1 ORDER BY created_at DESC',
      [username]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching created pins:', err);
    res.status(500).json({ error: err.message });
  }
});

// Save pin to board
app.post('/api/boards/:boardId/pins', async (req, res) => {
  const { boardId } = req.params;
  const { pinId } = req.body;
  
  try {
    // First check if pin is already saved to this board
    const existingPin = await pool.query(
      'SELECT * FROM saved_pins WHERE board_id = $1 AND pin_id = $2',
      [boardId, pinId]
    );

    if (existingPin.rows.length > 0) {
      // Pin is already saved to this board
      return res.status(200).json({ 
        message: 'Pin already saved to this board',
        alreadySaved: true 
      });
    }

    // If pin is not already saved, save it
    const result = await pool.query(
      'INSERT INTO saved_pins (board_id, pin_id) VALUES ($1, $2) RETURNING *',
      [boardId, pinId]
    );
    res.json({ 
      ...result.rows[0],
      message: 'Pin saved successfully',
      alreadySaved: false 
    });
  } catch (err) {
    console.error('Error saving pin to board:', err);
    res.status(500).json({ 
      error: 'Error saving pin to board',
      details: err.message 
    });
  }
});

// Get board pins
app.get('/api/boards/:boardId/pins', async (req, res) => {
  const { boardId } = req.params;
  
  try {
    const result = await pool.query(
      `SELECT p.*, sp.saved_at
       FROM pins p
       JOIN saved_pins sp ON p.id = sp.pin_id
       WHERE sp.board_id = $1
       ORDER BY sp.saved_at DESC`,
      [boardId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching board pins:', err);
    res.status(500).send('Server Error');
  }
});

// Delete pin from board
app.delete('/api/boards/:boardId/pins/:pinId', async (req, res) => {
  const { boardId, pinId } = req.params;
  
  try {
    await pool.query(
      'DELETE FROM saved_pins WHERE board_id = $1 AND pin_id = $2',
      [boardId, pinId]
    );
    res.json({ message: 'Pin removed from board' });
  } catch (err) {
    console.error('Error removing pin from board:', err);
    res.status(500).send('Server Error');
  }
});

// Add this endpoint to get user's pins by type (created or saved)
app.get('/api/pins/user/:username', async (req, res) => {
  const { username } = req.params;
  const { type } = req.query; // 'created' or 'saved'
  
  try {
    let query;
    if (type === 'created') {
      query = 'SELECT * FROM pins WHERE username = $1 ORDER BY created_at DESC';
    } else if (type === 'saved') {
      query = `
        SELECT DISTINCT p.* 
        FROM pins p
        JOIN saved_pins sp ON p.id = sp.pin_id
        JOIN boards b ON sp.board_id = b.id
        WHERE b.username = $1
        ORDER BY p.created_at DESC
      `;
    } else {
      return res.status(400).json({ error: 'Invalid type parameter' });
    }
    
    const result = await pool.query(query, [username]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching user pins:', err);
    res.status(500).send('Server Error');
  }
});

// Add user stats endpoint
app.get('/api/users/:username/stats', async (req, res) => {
  const { username } = req.params;
  
  try {
    // Get total pins created
    const pinsQuery = await pool.query(
      'SELECT COUNT(*) as pin_count FROM pins WHERE username = $1',
      [username]
    );

    // Get total views across all pins
    const viewsQuery = await pool.query(
      'SELECT COALESCE(SUM(views), 0) as total_views FROM pins WHERE username = $1',
      [username]
    );

    // Get total likes received on their pins
    const likesQuery = await pool.query(
      `SELECT COUNT(*) as total_likes 
       FROM likes l 
       JOIN pins p ON l.pin_id = p.id 
       WHERE p.username = $1`,
      [username]
    );

    // Get followers count
    const followersQuery = await pool.query(
      'SELECT COUNT(*) as follower_count FROM followers WHERE following_username = $1',
      [username]
    );

    // Get following count
    const followingQuery = await pool.query(
      'SELECT COUNT(*) as following_count FROM followers WHERE follower_username = $1',
      [username]
    );

    // Get boards count
    const boardsQuery = await pool.query(
      'SELECT COUNT(*) as board_count FROM boards WHERE username = $1',
      [username]
    );

    res.json({
      pins: parseInt(pinsQuery.rows[0].pin_count) || 0,
      views: parseInt(viewsQuery.rows[0].total_views) || 0,
      likes: parseInt(likesQuery.rows[0].total_likes) || 0,
      followers: parseInt(followersQuery.rows[0].follower_count) || 0,
      following: parseInt(followingQuery.rows[0].following_count) || 0,
      boards: parseInt(boardsQuery.rows[0].board_count) || 0
    });

  } catch (err) {
    console.error('Error fetching user stats:', err);
    res.status(500).json({
      error: 'Error fetching user stats',
      details: err.message
    });
  }
});

// Add like/unlike endpoints
app.post('/api/pins/:pinId/like', async (req, res) => {
  const { pinId } = req.params;
  const { username } = req.body;
  
  try {
    await pool.query(
      'INSERT INTO likes (pin_id, username) VALUES ($1, $2)',
      [pinId, username]
    );
    res.json({ message: 'Pin liked successfully' });
  } catch (err) {
    if (err.code === '23505') { // Unique violation
      res.status(400).json({ message: 'Pin already liked' });
    } else {
      console.error('Error liking pin:', err);
      res.status(500).json({ error: 'Error liking pin' });
    }
  }
});

app.delete('/api/pins/:pinId/like', async (req, res) => {
  const { pinId } = req.params;
  const { username } = req.body;
  
  try {
    await pool.query(
      'DELETE FROM likes WHERE pin_id = $1 AND username = $2',
      [pinId, username]
    );
    res.json({ message: 'Pin unliked successfully' });
  } catch (err) {
    console.error('Error unliking pin:', err);
    res.status(500).json({ error: 'Error unliking pin' });
  }
});

// Add view increment endpoint
app.post('/api/pins/:pinId/view', async (req, res) => {
  const { pinId } = req.params;
  
  try {
    await pool.query(
      'UPDATE pins SET views = views + 1 WHERE id = $1',
      [pinId]
    );
    res.json({ message: 'View count updated' });
  } catch (err) {
    console.error('Error updating view count:', err);
    res.status(500).json({ error: 'Error updating view count' });
  }
});

// Add follow/unfollow endpoints
app.post('/api/users/:username/follow', async (req, res) => {
  const { username } = req.params;
  const { followerUsername } = req.body;
  
  try {
    await pool.query(
      'INSERT INTO followers (follower_username, following_username) VALUES ($1, $2)',
      [followerUsername, username]
    );
    res.json({ message: 'Successfully followed user' });
  } catch (err) {
    if (err.code === '23505') { // Unique violation
      res.status(400).json({ message: 'Already following this user' });
    } else {
      console.error('Error following user:', err);
      res.status(500).json({ error: 'Error following user' });
    }
  }
});

app.delete('/api/users/:username/follow', async (req, res) => {
  const { username } = req.params;
  const { followerUsername } = req.body;
  
  try {
    await pool.query(
      'DELETE FROM followers WHERE follower_username = $1 AND following_username = $2',
      [followerUsername, username]
    );
    res.json({ message: 'Successfully unfollowed user' });
  } catch (err) {
    console.error('Error unfollowing user:', err);
    res.status(500).json({ error: 'Error unfollowing user' });
  }
});

// Check if user is following another user
app.get('/api/users/:username/following/:targetUsername', async (req, res) => {
  const { username, targetUsername } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT EXISTS(SELECT 1 FROM followers WHERE follower_username = $1 AND following_username = $2)',
      [username, targetUsername]
    );
    res.json({ isFollowing: result.rows[0].exists });
  } catch (err) {
    console.error('Error checking follow status:', err);
    res.status(500).json({ error: 'Error checking follow status' });
  }
});

// Delete board endpoint
app.delete('/api/boards/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM boards WHERE id = $1', [id]);
    res.status(204).send(); // No content
  } catch (err) {
    console.error('Error deleting board:', err);
    res.status(500).json({ error: 'Error deleting board' });
  }
});

app.delete('/api/pins/:id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // First verify the pin exists and get its details
    const pinCheck = await client.query(
      'SELECT id, username, image_url FROM pins WHERE id = $1',
      [req.params.id]
    );
    
    if (pinCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pin not found' });
    }

    // Delete the pin - CASCADE will handle related records
    const deleteResult = await client.query(
      'DELETE FROM pins WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    
    if (deleteResult.rowCount === 0) {
      throw new Error('Failed to delete pin');
    }

    await client.query('COMMIT');
    res.json({ 
      message: 'Pin deleted successfully',
      id: req.params.id
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting pin:', err);
    res.status(500).json({ 
      error: 'Failed to delete pin',
      details: err.message 
    });
  } finally {
    client.release();
  }
});

// Modify the pin creation endpoint to handle rollback properly
app.post('/api/pins', async (req, res) => {
  const { title, description, images, username, richText } = req.body;
  
  try {
    await pool.query('BEGIN');
    
    // Create the main pin
    const pinResult = await pool.query(
      `INSERT INTO pins (
        title, 
        description, 
        image_url, 
        username, 
        rich_text,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) 
      RETURNING *`,
      [title, description, images[0], username, richText]
    );
    
    const pinId = pinResult.rows[0].id;
    
    // Add additional images if any
    if (images.length > 1) {
      const additionalImages = images.slice(1);
      for (const imageUrl of additionalImages) {
        await pool.query(
          'INSERT INTO pin_images (pin_id, image_url) VALUES ($1, $2)',
          [pinId, imageUrl]
        );
      }
    }
    
    await pool.query('COMMIT');
    
    // Fetch the complete pin with all images
    const completePin = await pool.query(`
      SELECT 
        p.*,
        ARRAY_AGG(pi.image_url) FILTER (WHERE pi.image_url IS NOT NULL) as additional_images
      FROM pins p
      LEFT JOIN pin_images pi ON p.id = pi.pin_id
      WHERE p.id = $1
      GROUP BY p.id
    `, [pinId]);
    
    res.json(completePin.rows[0]);
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error creating pin:', err);
    res.status(500).json({ error: err.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  pool.end(() => {
    console.log('Database pool has ended');
    process.exit(0);
  });
});

// Create followers table if it doesn't exist
const initializeFollowersTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS followers (
        id SERIAL PRIMARY KEY,
        follower_username VARCHAR(255),
        following_username VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_username, following_username)
      );
    `);
    console.log('Followers table initialized successfully');
  } catch (err) {
    console.error('Error creating followers table:', err);
  }
};

// Call this after your database connection is established
initializeFollowersTable();

// Initialize the new tables
const initializeNewTables = async () => {
  try {
    // Add rich_text column to pins table
    await pool.query(`
      ALTER TABLE pins 
      ADD COLUMN IF NOT EXISTS rich_text JSONB;
    `);

    // Create pin_images table for multiple images
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pin_images (
        id SERIAL PRIMARY KEY,
        pin_id INTEGER REFERENCES pins(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create pin_drafts table for future use
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pin_drafts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        description TEXT,
        rich_text JSONB,
        images TEXT[],
        username VARCHAR(255),
        scheduled_for TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('New tables initialized successfully');
  } catch (err) {
    console.error('Error initializing new tables:', err);
  }
};

// Call this after your database connection is established
initializeNewTables();
