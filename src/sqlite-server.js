const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3001;

// SQLite database setup
const dbPath = process.env.DATABASE_PATH || './database.sqlite';
console.log('🗄️ SQLite database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening SQLite database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

// File upload configuration
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// Initialize database tables
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    console.log('🔧 Initializing SQLite database...');
    
    // Create users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'ADMIN',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating users table:', err);
        reject(err);
        return;
      }
      console.log('✅ Users table created');
    });
    
    // Create articles table
    db.run(`
      CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        excerpt TEXT NOT NULL,
        category TEXT NOT NULL,
        image TEXT,
        content TEXT NOT NULL,
        date TEXT NOT NULL,
        readTime TEXT NOT NULL,
        published BOOLEAN DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating articles table:', err);
        reject(err);
        return;
      }
      console.log('✅ Articles table created');
    });
    
    // Create gallery_images table
    db.run(`
      CREATE TABLE IF NOT EXISTS gallery_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        imageUrl TEXT NOT NULL,
        imageType TEXT DEFAULT 'image',
        fileSize INTEGER,
        width INTEGER,
        height INTEGER,
        order_index INTEGER DEFAULT 0,
        published BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating gallery_images table:', err);
        reject(err);
        return;
      }
      console.log('✅ Gallery images table created');
    });
    
    // Create contact_messages table
    db.run(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating contact_messages table:', err);
        reject(err);
        return;
      }
      console.log('✅ Contact messages table created');
      
      // Create default admin user
      createDefaultAdmin().then(() => {
        console.log('✅ Database initialization completed');
        resolve();
      }).catch(reject);
    });
  });
}

// Create default admin user
function createDefaultAdmin() {
  return new Promise((resolve, reject) => {
    db.get('SELECT id FROM users WHERE email = ?', ['admin@ruslana.com'], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!row) {
        db.run(`
          INSERT INTO users (email, password, name, role, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          'admin@ruslana.com',
          'admin123',
          'Admin User',
          'ADMIN',
          new Date().toISOString(),
          new Date().toISOString()
        ], function(err) {
          if (err) {
            console.error('Error creating admin user:', err);
            reject(err);
          } else {
            console.log('✅ Default admin user created');
            resolve();
          }
        });
      } else {
        console.log('ℹ️ Admin user already exists');
        resolve();
      }
    });
  });
}

// CORS configuration
app.use(cors({
  origin: ['https://rus-production.up.railway.app', 'http://localhost:4200'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(uploadDir));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    server: 'sqlite-backend-v2',
    database: 'sqlite',
    message: 'SQLite backend is running successfully!',
    version: '2.0.0'
  });
});

// Database initialization endpoint
app.post('/api/init-db', async (req, res) => {
  try {
    console.log('🔧 Manual database initialization requested');
    await initializeDatabase();
    
    res.json({
      success: true,
      message: 'Database initialized successfully'
    });
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database initialization failed',
      error: error.message
    });
  }
});

// Database status endpoint
app.get('/api/db-status', (req, res) => {
  const tables = ['users', 'articles', 'gallery_images', 'contact_messages'];
  const counts = {};
  let completed = 0;
  
  tables.forEach(table => {
    db.get(`SELECT COUNT(*) as count FROM ${table}`, (err, row) => {
      if (err) {
        counts[table] = 0;
      } else {
        counts[table] = row.count;
      }
      
      completed++;
      if (completed === tables.length) {
        res.json({
          success: true,
          connected: true,
          tables: tables,
          counts: counts,
          totalTables: tables.length,
          expectedTables: tables.length
        });
      }
    });
  });
});

// Test endpoint to create a simple article
app.post('/api/test-article', (req, res) => {
  const content = JSON.stringify({ 
    intro: 'Тестова стаття', 
    sections: [{ heading: 'Тест', text: 'Тестовий контент' }] 
  });
  
  db.run(`
    INSERT INTO articles (title, excerpt, category, image, content, published, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'Тестова стаття',
    'Це тестова стаття для перевірки роботи бази даних',
    'Тест',
    'https://images.unsplash.com/photo-1551076805-e1869033e561?w=800&h=600&fit=crop',
    content,
    1, // true
    new Date().toISOString(),
    new Date().toISOString()
  ], function(err) {
    if (err) {
      console.error('❌ Test article creation failed:', err);
      res.status(500).json({
        success: false,
        message: 'Test article creation failed',
        error: err.message
      });
    } else {
      console.log('✅ Test article created:', this.lastID);
      res.json({
        success: true,
        message: 'Test article created successfully',
        articleId: this.lastID
      });
    }
  });
});

// Authentication endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, row) => {
    if (err) {
      res.status(500).json({ error: 'Database error' });
      return;
    }
    
    if (row) {
      res.json({
        token: 'fake-jwt-token-for-testing',
        user: {
          id: row.id,
          email: row.email,
          role: row.role
        }
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
});

app.get('/api/auth/me', (req, res) => {
  res.json({
    user: {
      id: 1,
      email: 'admin@ruslana.com',
      role: 'ADMIN'
    }
  });
});

// Articles endpoints
app.get('/api/articles', (req, res) => {
  db.all('SELECT * FROM articles WHERE published = 1 ORDER BY createdAt DESC', (err, rows) => {
    if (err) {
      console.error('Error fetching articles:', err);
      res.json([]);
      return;
    }
    
    // Parse JSON content
    const articles = rows.map(row => ({
      ...row,
      content: JSON.parse(row.content),
      published: Boolean(row.published)
    }));
    
    console.log('✅ Retrieved', articles.length, 'articles from database');
    res.json(articles);
  });
});

app.get('/api/admin/articles', (req, res) => {
  db.all('SELECT * FROM articles ORDER BY createdAt DESC', (err, rows) => {
    if (err) {
      console.error('Error fetching admin articles:', err);
      res.json([]);
      return;
    }
    
    // Parse JSON content
    const articles = rows.map(row => ({
      ...row,
      content: JSON.parse(row.content),
      published: Boolean(row.published)
    }));
    
    console.log('✅ Retrieved', articles.length, 'articles from database (admin)');
    res.json(articles);
  });
});

app.get('/api/articles/:id', (req, res) => {
  const articleId = parseInt(req.params.id);
  
  db.get('SELECT * FROM articles WHERE id = ? AND published = 1', [articleId], (err, row) => {
    if (err) {
      console.error('Error fetching article:', err);
      res.status(404).json({ error: 'Article not found' });
      return;
    }
    
    if (row) {
      row.content = JSON.parse(row.content);
      row.published = Boolean(row.published);
      res.json(row);
    } else {
      res.status(404).json({ error: 'Article not found' });
    }
  });
});

app.post('/api/articles', (req, res) => {
  const { title, excerpt, category, image, content, published = true } = req.body;
  
  db.run(`
    INSERT INTO articles (title, excerpt, category, image, content, published, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    title,
    excerpt,
    category,
    image,
    JSON.stringify(content),
    published ? 1 : 0,
    new Date().toISOString(),
    new Date().toISOString()
  ], function(err) {
    if (err) {
      console.error('Error creating article:', err);
      res.status(500).json({ error: 'Failed to create article' });
      return;
    }
    
    console.log('✅ Article saved to database:', this.lastID);
    res.json({
      id: this.lastID,
      title,
      excerpt,
      category,
      image,
      content,
      published,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  });
});

app.put('/api/articles/:id', (req, res) => {
  const articleId = parseInt(req.params.id);
  const { title, excerpt, category, image, content, published } = req.body;
  
  db.run(`
    UPDATE articles 
    SET title = ?, excerpt = ?, category = ?, image = ?, content = ?, published = ?, updatedAt = ?
    WHERE id = ?
  `, [
    title,
    excerpt,
    category,
    image,
    JSON.stringify(content),
    published ? 1 : 0,
    new Date().toISOString(),
    articleId
  ], function(err) {
    if (err) {
      console.error('Error updating article:', err);
      res.status(500).json({ error: 'Failed to update article' });
      return;
    }
    
    if (this.changes > 0) {
      console.log('✅ Article updated in database:', articleId);
      res.json({ id: articleId, message: 'Article updated successfully' });
    } else {
      res.status(404).json({ error: 'Article not found' });
    }
  });
});

app.delete('/api/articles/:id', (req, res) => {
  const articleId = parseInt(req.params.id);
  
  db.run('DELETE FROM articles WHERE id = ?', [articleId], function(err) {
    if (err) {
      console.error('Error deleting article:', err);
      res.status(500).json({ error: 'Failed to delete article' });
      return;
    }
    
    if (this.changes > 0) {
      console.log('✅ Article deleted from database:', articleId);
      res.json({ message: 'Article deleted successfully' });
    } else {
      res.status(404).json({ error: 'Article not found' });
    }
  });
});

// Gallery endpoints
app.get('/api/gallery', (req, res) => {
  db.all('SELECT * FROM gallery_images WHERE published = 1 ORDER BY order_index ASC', (err, rows) => {
    if (err) {
      console.error('Error fetching gallery images:', err);
      res.json([]);
      return;
    }
    
    const images = rows.map(row => ({
      ...row,
      published: Boolean(row.published),
      order: row.order_index
    }));
    
    console.log('✅ Retrieved', images.length, 'gallery images from database');
    res.json(images);
  });
});

app.get('/api/admin/gallery', (req, res) => {
  db.all('SELECT * FROM gallery_images ORDER BY order_index ASC, createdAt DESC', (err, rows) => {
    if (err) {
      console.error('Error fetching admin gallery images:', err);
      res.json([]);
      return;
    }
    
    const images = rows.map(row => ({
      ...row,
      published: Boolean(row.published),
      order: row.order_index
    }));
    
    console.log('✅ Retrieved', images.length, 'gallery images from database (admin)');
    res.json(images);
  });
});

app.post('/api/gallery', (req, res) => {
  const { title, description, imageUrl, imageType = 'image', order = 1, published = true } = req.body;
  
  db.run(`
    INSERT INTO gallery_images (title, description, imageUrl, imageType, order_index, published, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    title,
    description,
    imageUrl,
    imageType,
    order,
    published ? 1 : 0,
    new Date().toISOString(),
    new Date().toISOString()
  ], function(err) {
    if (err) {
      console.error('Error creating gallery image:', err);
      res.status(500).json({ error: 'Failed to create gallery image' });
      return;
    }
    
    console.log('✅ Gallery image saved to database:', this.lastID);
    res.json({
      id: this.lastID,
      title,
      description,
      imageUrl,
      imageType,
      order,
      published,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  });
});

app.put('/api/gallery/:id', (req, res) => {
  const imageId = parseInt(req.params.id);
  const { title, description, imageUrl, imageType, order, published } = req.body;
  
  db.run(`
    UPDATE gallery_images 
    SET title = ?, description = ?, imageUrl = ?, imageType = ?, order_index = ?, published = ?, updatedAt = ?
    WHERE id = ?
  `, [
    title,
    description,
    imageUrl,
    imageType,
    order,
    published ? 1 : 0,
    new Date().toISOString(),
    imageId
  ], function(err) {
    if (err) {
      console.error('Error updating gallery image:', err);
      res.status(500).json({ error: 'Failed to update gallery image' });
      return;
    }
    
    if (this.changes > 0) {
      console.log('✅ Gallery image updated in database:', imageId);
      res.json({ id: imageId, message: 'Gallery image updated successfully' });
    } else {
      res.status(404).json({ error: 'Gallery image not found' });
    }
  });
});

app.delete('/api/gallery/:id', (req, res) => {
  const imageId = parseInt(req.params.id);
  
  db.run('DELETE FROM gallery_images WHERE id = ?', [imageId], function(err) {
    if (err) {
      console.error('Error deleting gallery image:', err);
      res.status(500).json({ error: 'Failed to delete gallery image' });
      return;
    }
    
    if (this.changes > 0) {
      console.log('✅ Gallery image deleted from database:', imageId);
      res.json({ message: 'Gallery image deleted successfully' });
    } else {
      res.status(404).json({ error: 'Gallery image not found' });
    }
  });
});

// Upload endpoints
app.post('/api/upload/single', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    
    console.log('✅ File uploaded successfully:', req.file.filename);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('❌ File upload error:', error.message);
    res.status(500).json({
      success: false,
      message: 'File upload failed',
      error: error.message
    });
  }
});

app.post('/api/upload/multiple', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const files = req.files.map(file => ({
      url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    }));

    console.log('✅ Multiple files uploaded successfully:', files.length);

    res.json({
      success: true,
      message: `${files.length} files uploaded successfully`,
      files: files
    });
  } catch (error) {
    console.error('❌ Multiple files upload error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Files upload failed',
      error: error.message
    });
  }
});

// Contact endpoint
app.post('/api/contact', (req, res) => {
  const { name, email, phone, message } = req.body;
  
  db.run(`
    INSERT INTO contact_messages (name, email, phone, message, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `, [
    name,
    email,
    phone,
    message,
    new Date().toISOString()
  ], function(err) {
    if (err) {
      console.error('Error saving contact message:', err);
      res.status(500).json({ error: 'Failed to save message' });
      return;
    }
    
    console.log('✅ Contact message saved:', this.lastID);
    res.json({
      success: true,
      message: 'Message sent successfully'
    });
  });
});

// Start server
async function startServer() {
  try {
    console.log('🔧 Starting SQLite server...');
    console.log('📊 Environment variables:');
    console.log('  - PORT:', process.env.PORT);
    console.log('  - DATABASE_PATH:', process.env.DATABASE_PATH);
    console.log('  - UPLOAD_DIR:', process.env.UPLOAD_DIR);
    console.log('  - NODE_ENV:', process.env.NODE_ENV);
    
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 SQLite server running on port ${PORT}`);
      console.log(`📁 Database: ${dbPath}`);
      console.log(`📁 Uploads: ${uploadDir}`);
      console.log('✅ Server is ready to accept requests');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
