const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDatabase() {
  try {
    console.log('🔧 Initializing database...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    
    // Create tables if they don't exist
    await createTables(client);
    
    // Insert default admin user
    await createDefaultAdmin(client);
    
    // Insert sample data
    await insertSampleData(client);
    
    client.release();
    console.log('✅ Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

async function createTables(client) {
  console.log('📋 Creating tables...');
  
  // Create users table
  await client.query(`
    CREATE TABLE IF NOT EXISTS "User" (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'ADMIN',
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create articles table
  await client.query(`
    CREATE TABLE IF NOT EXISTS "Article" (
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
  
  // Create gallery images table
  await client.query(`
    CREATE TABLE IF NOT EXISTS "GalleryImage" (
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
  
  // Create contact messages table
  await client.query(`
    CREATE TABLE IF NOT EXISTS "ContactMessage" (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      message TEXT NOT NULL,
      read BOOLEAN DEFAULT false,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  console.log('✅ Tables created successfully');
}

async function createDefaultAdmin(client) {
  console.log('👤 Creating default admin user...');
  
  try {
    // Check if admin already exists
    const existingAdmin = await client.query('SELECT id FROM "User" WHERE email = $1', ['admin@ruslana.com']);
    
    if (existingAdmin.rows.length === 0) {
      // Create default admin user
      await client.query(`
        INSERT INTO "User" (email, password, name, role, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        'admin@ruslana.com',
        'admin123', // In production, this should be hashed
        'Admin User',
        'ADMIN',
        new Date(),
        new Date()
      ]);
      
      console.log('✅ Default admin user created');
    } else {
      console.log('ℹ️ Admin user already exists');
    }
  } catch (error) {
    console.log('⚠️ Could not create admin user:', error.message);
  }
}

async function insertSampleData(client) {
  console.log('📝 Inserting sample data...');
  
  try {
    // Check if articles already exist
    const existingArticles = await client.query('SELECT COUNT(*) FROM "Article"');
    
    if (existingArticles.rows[0].count === '0') {
      // Insert sample articles
      await client.query(`
        INSERT INTO "Article" (title, excerpt, category, image, content, date, "readTime", published, "createdAt", "updatedAt")
        VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10),
        ($11, $12, $13, $14, $15, $16, $17, $18, $19, $20),
        ($21, $22, $23, $24, $25, $26, $27, $28, $29, $30)
      `, [
        // Article 1
        'Рак легень: ранні ознаки та діагностика',
        'Рак легень - одне з найпоширеніших онкологічних захворювань. Дізнайтеся про перші симптоми та сучасні методи діагностики.',
        'Діагностика',
        'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&h=600&fit=crop',
        JSON.stringify({
          intro: 'Рак легень залишається одним з найпоширеніших онкологічних захворювань.',
          sections: [
            { heading: 'Симптоми', text: 'Кашель, задишка, біль у грудях.' }
          ]
        }),
        '15 березня 2025',
        '7 хв',
        true,
        new Date(),
        new Date(),
        
        // Article 2
        'Сучасні методи лікування раку легень',
        'Від хірургічного втручання до таргетної терапії - огляд найефективніших методів лікування онкології легень.',
        'Лікування',
        'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&h=600&fit=crop',
        JSON.stringify({
          intro: 'Сучасні методи лікування.',
          sections: [
            { heading: 'Хірургія', text: 'Операційне видалення.' }
          ]
        }),
        '10 березня 2025',
        '8 хв',
        true,
        new Date(),
        new Date(),
        
        // Article 3
        'Профілактика раку легень',
        'Важливість відмови від куріння, регулярних обстежень та здорового способу життя для профілактики раку легень.',
        'Профілактика',
        'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=800&h=600&fit=crop',
        JSON.stringify({
          intro: 'Профілактика раку легень.',
          sections: [
            { heading: 'Куріння', text: 'Головний фактор ризику.' }
          ]
        }),
        '5 березня 2025',
        '6 хв',
        true,
        new Date(),
        new Date()
      ]);
      
      console.log('✅ Sample articles inserted');
    } else {
      console.log('ℹ️ Articles already exist');
    }
    
    // Check if gallery images already exist
    const existingGallery = await client.query('SELECT COUNT(*) FROM "GalleryImage"');
    
    if (existingGallery.rows[0].count === '0') {
      // Insert sample gallery images
      await client.query(`
        INSERT INTO "GalleryImage" (title, description, "imageUrl", "imageType", "order", published, "createdAt", "updatedAt")
        VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8),
        ($9, $10, $11, $12, $13, $14, $15, $16),
        ($17, $18, $19, $20, $21, $22, $23, $24)
      `, [
        // Image 1
        'Медичне обладнання',
        'Сучасне обладнання для діагностики та лікування',
        'https://images.unsplash.com/photo-1551076805-e1869033e561?w=800&h=600&fit=crop',
        'image',
        1,
        true,
        new Date(),
        new Date(),
        
        // Image 2
        'Хірургічний кабінет',
        'Сучасний хірургічний кабінет',
        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop',
        'image',
        2,
        true,
        new Date(),
        new Date(),
        
        // Image 3
        'Лабораторія',
        'Сучасна лабораторія для аналізів',
        'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&h=600&fit=crop',
        'image',
        3,
        true,
        new Date(),
        new Date()
      ]);
      
      console.log('✅ Sample gallery images inserted');
    } else {
      console.log('ℹ️ Gallery images already exist');
    }
    
  } catch (error) {
    console.log('⚠️ Could not insert sample data:', error.message);
  }
}

// Run initialization
initDatabase().then(() => {
  console.log('🎉 Database setup completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Database setup failed:', error);
  process.exit(1);
});
