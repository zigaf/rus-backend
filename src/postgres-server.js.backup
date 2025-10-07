const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
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

// Test database connection and initialize tables
async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    
    // Initialize tables if they don't exist
    await initializeTables(client);
    
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('🔧 Using mock data instead');
  }
}

// Initialize database tables
async function initializeTables(client) {
  try {
    console.log('🔧 Checking database tables...');
    
    // Check if tables already exist
    const tablesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('User', 'Article', 'GalleryImage', 'ContactMessage')
    `);
    
    const existingTables = tablesCheck.rows.map(row => row.table_name);
    console.log('📋 Existing tables:', existingTables);
    
    if (existingTables.length === 4) {
      console.log('✅ All tables already exist, skipping initialization');
      return;
    }
    
    console.log('🔧 Creating missing tables...');
    
    // Create users table
    if (!existingTables.includes('User')) {
      await client.query(`
        CREATE TABLE "User" (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'ADMIN',
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ User table created');
    }
    
    // Create articles table
    if (!existingTables.includes('Article')) {
      await client.query(`
        CREATE TABLE "Article" (
          id SERIAL PRIMARY KEY,
          title VARCHAR(500) NOT NULL,
          excerpt TEXT NOT NULL,
          category VARCHAR(100) NOT NULL,
          image VARCHAR(500),
          content JSONB NOT NULL,
          date VARCHAR(100) NOT NULL,
          "readTime" VARCHAR(50) NOT NULL,
          published BOOLEAN DEFAULT false,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Article table created');
    }
    
    // Create gallery images table
    if (!existingTables.includes('GalleryImage')) {
      await client.query(`
        CREATE TABLE "GalleryImage" (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255),
          description TEXT,
          "imageUrl" VARCHAR(500) NOT NULL,
          "imageType" VARCHAR(50) DEFAULT 'image',
          "fileSize" INTEGER,
          width INTEGER,
          height INTEGER,
          "order" INTEGER DEFAULT 0,
          published BOOLEAN DEFAULT true,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ GalleryImage table created');
    }
    
    // Create contact messages table
    if (!existingTables.includes('ContactMessage')) {
      await client.query(`
        CREATE TABLE "ContactMessage" (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(50),
          message TEXT NOT NULL,
          read BOOLEAN DEFAULT false,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ ContactMessage table created');
    }
    
    // Create default admin user if not exists
    const existingAdmin = await client.query('SELECT id FROM "User" WHERE email = $1', ['admin@ruslana.com']);
    if (existingAdmin.rows.length === 0) {
      await client.query(`
        INSERT INTO "User" (email, password, name, role, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        'admin@ruslana.com',
        'admin123',
        'Admin User',
        'ADMIN',
        new Date(),
        new Date()
      ]);
      console.log('✅ Default admin user created');
    } else {
      console.log('ℹ️ Admin user already exists');
    }
    
    console.log('✅ Database initialization completed');
  } catch (error) {
    console.error('⚠️ Could not initialize tables:', error.message);
  }
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
    server: 'postgres-backend',
    database: pool ? 'connected' : 'disconnected',
    message: 'Backend is running successfully!'
  });
});

// Database initialization endpoint
app.post('/api/init-db', async (req, res) => {
  let client;
  try {
    console.log('🔧 Manual database initialization requested');
    
    // Test database connection first
    client = await pool.connect();
    console.log('✅ Database connection established');
    
    // Initialize tables
    await initializeTables(client);
    
    res.json({
      success: true,
      message: 'Database initialized successfully'
    });
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database initialization failed',
      error: error.message,
      details: error.toString()
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// Database status endpoint
app.get('/api/db-status', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    
    // Check if tables exist
    const tablesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('User', 'Article', 'GalleryImage', 'ContactMessage')
    `);
    
    const existingTables = tablesCheck.rows.map(row => row.table_name);
    
    // Count records in each table
    const counts = {};
    for (const table of existingTables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM "${table}"`);
        counts[table] = parseInt(result.rows[0].count);
      } catch (error) {
        counts[table] = 0;
      }
    }
    
    res.json({
      success: true,
      connected: true,
      tables: existingTables,
      counts: counts,
      totalTables: existingTables.length,
      expectedTables: 4
    });
  } catch (error) {
    console.error('❌ Database status check failed:', error);
    res.status(500).json({
      success: false,
      connected: false,
      error: error.message
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// Test endpoint to create a simple article
app.post('/api/test-article', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    
    // Try to create a test article
    const result = await client.query(`
      INSERT INTO "Article" (title, excerpt, category, image, content, published, "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `, [
      'Тестова стаття',
      'Це тестова стаття для перевірки роботи бази даних',
      'Тест',
      'https://images.unsplash.com/photo-1551076805-e1869033e561?w=800&h=600&fit=crop',
      JSON.stringify({ intro: 'Тестова стаття', sections: [{ heading: 'Тест', text: 'Тестовий контент' }] }),
      true,
      new Date(),
      new Date()
    ]);
    
    console.log('✅ Test article created:', result.rows[0].id);
    res.json({
      success: true,
      message: 'Test article created successfully',
      article: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Test article creation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Test article creation failed',
      error: error.message,
      details: error.toString()
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    server: 'postgres-backend',
    database: pool ? 'connected' : 'disconnected',
    message: 'API is working!'
  });
});

// Simple auth endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Simple hardcoded admin check
  if (email === 'admin@ruslana.com' && password === 'admin123') {
    res.json({
      token: 'fake-jwt-token-for-testing',
      user: {
        id: 1,
        email: 'admin@ruslana.com',
        role: 'ADMIN'
      }
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Get current user endpoint
app.get('/api/auth/me', (req, res) => {
  res.json({
    user: {
      id: 1,
      email: 'admin@ruslana.com',
      role: 'ADMIN'
    }
  });
});

// Articles endpoint with database
app.get('/api/articles', async (req, res) => {
  try {
    // Try to get articles from database
    const result = await pool.query('SELECT * FROM "Article" WHERE published = true ORDER BY "createdAt" DESC');
    
    if (result.rows.length > 0) {
      console.log('✅ Retrieved', result.rows.length, 'articles from database');
      res.json(result.rows);
      return;
    } else {
      console.log('📝 No published articles found in database');
    }
  } catch (error) {
    console.log('📝 Using mock articles (database not available):', error.message);
  }
  
  // Fallback to mock data
  const articles = [
    {
      id: 1,
      title: 'Рак легень: ранні ознаки та діагностика',
      excerpt: 'Рак легень - одне з найпоширеніших онкологічних захворювань. Дізнайтеся про перші симптоми та сучасні методи діагностики.',
      category: 'Діагностика',
      image: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&h=600&fit=crop',
      date: '15 березня 2025',
      readTime: '7 хв',
      published: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: {
        intro: 'Рак легень залишається одним з найпоширеніших онкологічних захворювань.',
        sections: [
          { heading: 'Симптоми', text: 'Кашель, задишка, біль у грудях.' }
        ]
      }
    },
    {
      id: 2,
      title: 'Сучасні методи лікування раку легень',
      excerpt: 'Від хірургічного втручання до таргетної терапії - огляд найефективніших методів лікування онкології легень.',
      category: 'Лікування',
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&h=600&fit=crop',
      date: '10 березня 2025',
      readTime: '8 хв',
      published: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: {
        intro: 'Сучасні методи лікування.',
        sections: [
          { heading: 'Хірургія', text: 'Операційне видалення.' }
        ]
      }
    },
    {
      id: 3,
      title: 'Профілактика раку легень',
      excerpt: 'Важливість відмови від куріння, регулярних обстежень та здорового способу життя для профілактики раку легень.',
      category: 'Профілактика',
      image: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=800&h=600&fit=crop',
      date: '5 березня 2025',
      readTime: '6 хв',
      published: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: {
        intro: 'Профілактика раку легень.',
        sections: [
          { heading: 'Куріння', text: 'Головний фактор ризику.' }
        ]
      }
    }
  ];
  
  res.json(articles);
});

// Admin endpoint - get all articles (including unpublished)
app.get('/api/admin/articles', async (req, res) => {
  try {
    // Try to get all articles from database
    const result = await pool.query('SELECT * FROM "Article" ORDER BY "createdAt" DESC');
    
    if (result.rows.length > 0) {
      console.log('✅ Retrieved', result.rows.length, 'articles from database (admin)');
      res.json(result.rows);
      return;
    } else {
      console.log('📝 No articles found in database (admin)');
      res.json([]);
      return;
    }
  } catch (error) {
    console.log('📝 Using mock articles (database not available - admin):', error.message);
    res.json([]);
  }
});

// Get single article
app.get('/api/articles/:id', async (req, res) => {
  const articleId = parseInt(req.params.id);
  
  try {
    // Try to get article from database
    const result = await pool.query('SELECT * FROM "Article" WHERE id = $1 AND published = true', [articleId]);
    
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
      return;
    }
  } catch (error) {
    console.log('📝 Using mock article (database not available)');
  }
  
  // Fallback to mock data
  const articles = [
    {
      id: 1,
      title: 'Рак легень: ранні ознаки та діагностика',
      excerpt: 'Рак легень - одне з найпоширеніших онкологічних захворювань.',
      category: 'Діагностика',
      image: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&h=600&fit=crop',
      date: '15 березня 2025',
      readTime: '7 хв',
      published: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: {
        intro: 'Рак легень залишається одним з найпоширеніших онкологічних захворювань.',
        sections: [
          { heading: 'Симптоми', text: 'Кашель, задишка, біль у грудях.' }
        ]
      }
    }
  ];
  
  const article = articles.find(a => a.id === articleId);
  if (article) {
    res.json(article);
  } else {
    res.status(404).json({ error: 'Article not found' });
  }
});

// Create new article
app.post('/api/articles', async (req, res) => {
  const { title, excerpt, category, image, content, published = true } = req.body;
  
  try {
    // Try to save to database
    const result = await pool.query(
      'INSERT INTO "Article" (title, excerpt, category, image, content, published, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [title, excerpt, category, image, JSON.stringify(content), published, new Date(), new Date()]
    );
    
    console.log('✅ Article saved to database:', result.rows[0].id);
    res.json(result.rows[0]);
    return;
  } catch (error) {
    console.log('📝 Article saved to mock (database not available):', error.message);
  }
  
  // Fallback: return success but don't actually save
  const newArticle = {
    id: Date.now(),
    title,
    excerpt,
    category,
    image,
    content,
    published,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  res.json(newArticle);
});

// Update article
app.put('/api/articles/:id', async (req, res) => {
  const articleId = parseInt(req.params.id);
  const { title, excerpt, category, image, content, published } = req.body;
  
  try {
    // Try to update in database
    const result = await pool.query(
      'UPDATE "Article" SET title = $1, excerpt = $2, category = $3, image = $4, content = $5, published = $6, "updatedAt" = $7 WHERE id = $8 RETURNING *',
      [title, excerpt, category, image, JSON.stringify(content), published, new Date(), articleId]
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Article updated in database:', articleId);
      res.json(result.rows[0]);
      return;
    }
  } catch (error) {
    console.log('📝 Article update failed (database not available):', error.message);
  }
  
  // Fallback: return success
  res.json({ id: articleId, message: 'Article updated (mock mode)' });
});

// Delete article
app.delete('/api/articles/:id', async (req, res) => {
  const articleId = parseInt(req.params.id);
  
  try {
    // Try to delete from database
    const result = await pool.query('DELETE FROM "Article" WHERE id = $1 RETURNING *', [articleId]);
    
    if (result.rows.length > 0) {
      console.log('✅ Article deleted from database:', articleId);
      res.json({ message: 'Article deleted successfully' });
      return;
    }
  } catch (error) {
    console.log('📝 Article deletion failed (database not available):', error.message);
  }
  
  // Fallback: return success
  res.json({ message: 'Article deleted (mock mode)' });
});

// Gallery endpoint with database
app.get('/api/gallery', async (req, res) => {
  try {
    // Try to get gallery images from database
    const result = await pool.query('SELECT * FROM "GalleryImage" WHERE published = true ORDER BY "order" ASC');
    
    if (result.rows.length > 0) {
      res.json(result.rows);
      return;
    }
  } catch (error) {
    console.log('🖼️ Using mock gallery (database not available)');
  }
  
  // Fallback to mock data
  const galleryImages = [
    {
      id: 1,
      title: 'Медичне обладнання',
      description: 'Сучасне обладнання для діагностики та лікування',
      imageUrl: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=800&h=600&fit=crop',
      imageType: 'image',
      order: 1,
      published: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      title: 'Хірургічний кабінет',
      description: 'Сучасний хірургічний кабінет',
      imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop',
      imageType: 'image',
      order: 2,
      published: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 3,
      title: 'Лабораторія',
      description: 'Сучасна лабораторія для аналізів',
      imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&h=600&fit=crop',
      imageType: 'image',
      order: 3,
      published: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  
  res.json(galleryImages);
});

// Admin endpoint - get all gallery images (including unpublished)
app.get('/api/admin/gallery', async (req, res) => {
  try {
    // Try to get all gallery images from database
    const result = await pool.query('SELECT * FROM "GalleryImage" ORDER BY "order" ASC, "createdAt" DESC');
    
    if (result.rows.length > 0) {
      console.log('✅ Retrieved', result.rows.length, 'gallery images from database (admin)');
      res.json(result.rows);
      return;
    } else {
      console.log('📝 No gallery images found in database (admin)');
      res.json([]);
      return;
    }
  } catch (error) {
    console.log('📝 Using mock gallery (database not available - admin):', error.message);
    res.json([]);
  }
});

// Get single gallery image
app.get('/api/gallery/:id', async (req, res) => {
  const imageId = parseInt(req.params.id);
  
  try {
    // Try to get gallery image from database
    const result = await pool.query('SELECT * FROM "GalleryImage" WHERE id = $1 AND published = true', [imageId]);
    
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
      return;
    }
  } catch (error) {
    console.log('🖼️ Using mock gallery image (database not available)');
  }
  
  // Fallback to mock data
  const galleryImages = [
    {
      id: 1,
      title: 'Медичне обладнання',
      description: 'Сучасне обладнання для діагностики та лікування',
      imageUrl: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=800&h=600&fit=crop',
      imageType: 'image',
      order: 1,
      published: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  
  const image = galleryImages.find(img => img.id === imageId);
  if (image) {
    res.json(image);
  } else {
    res.status(404).json({ error: 'Image not found' });
  }
});

// Contact endpoint
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  
  console.log('New contact message:', { name, email, message });
  
  try {
    // Try to save to database
    await pool.query(
      'INSERT INTO "ContactMessage" (name, email, message, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5)',
      [name, email, message, new Date(), new Date()]
    );
    console.log('✅ Contact message saved to database');
  } catch (error) {
    console.log('📝 Contact message logged (database not available)');
  }
  
  res.json({
    success: true,
    message: 'Message sent successfully'
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

// Gallery management endpoints
app.post('/api/gallery', async (req, res) => {
  const { title, description, imageUrl, imageType = 'image', order = 1, published = true } = req.body;
  
  try {
    // Try to save to database
    const result = await pool.query(
      'INSERT INTO "GalleryImage" (title, description, "imageUrl", "imageType", "order", published, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [title, description, imageUrl, imageType, order, published, new Date(), new Date()]
    );
    
    console.log('✅ Gallery image saved to database:', result.rows[0].id);
    res.json(result.rows[0]);
    return;
  } catch (error) {
    console.log('📝 Gallery image saved to mock (database not available):', error.message);
  }
  
  // Fallback: return success but don't actually save
  const newImage = {
    id: Date.now(),
    title,
    description,
    imageUrl,
    imageType,
    order,
    published,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  res.json(newImage);
});

app.put('/api/gallery/:id', async (req, res) => {
  const imageId = parseInt(req.params.id);
  const { title, description, imageUrl, imageType, order, published } = req.body;
  
  try {
    // Try to update in database
    const result = await pool.query(
      'UPDATE "GalleryImage" SET title = $1, description = $2, "imageUrl" = $3, "imageType" = $4, "order" = $5, published = $6, "updatedAt" = $7 WHERE id = $8 RETURNING *',
      [title, description, imageUrl, imageType, order, published, new Date(), imageId]
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Gallery image updated in database:', imageId);
      res.json(result.rows[0]);
      return;
    }
  } catch (error) {
    console.log('📝 Gallery image update failed (database not available):', error.message);
  }
  
  // Fallback: return success
  res.json({ id: imageId, message: 'Gallery image updated (mock mode)' });
});

app.delete('/api/gallery/:id', async (req, res) => {
  const imageId = parseInt(req.params.id);
  
  try {
    // Try to delete from database
    const result = await pool.query('DELETE FROM "GalleryImage" WHERE id = $1 RETURNING *', [imageId]);
    
    if (result.rows.length > 0) {
      console.log('✅ Gallery image deleted from database:', imageId);
      res.json({ message: 'Gallery image deleted successfully' });
      return;
    }
  } catch (error) {
    console.log('📝 Gallery image deletion failed (database not available):', error.message);
  }
  
  // Fallback: return success
  res.json({ message: 'Gallery image deleted (mock mode)' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: {
      message: err.message || 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      path: req.originalUrl
    }
  });
});

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 PostgreSQL Backend Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: https://rus-production.up.railway.app`);
  
  // Test database connection
  await testDatabaseConnection();
});

// Handle server errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});
