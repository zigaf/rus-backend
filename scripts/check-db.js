const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkDatabase() {
  try {
    console.log('🔍 Checking database status...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    
    // Check tables
    await checkTables(client);
    
    // Check data
    await checkData(client);
    
    client.release();
    console.log('✅ Database check completed successfully!');
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    process.exit(1);
  }
}

async function checkTables(client) {
  console.log('📋 Checking tables...');
  
  const tables = ['User', 'Article', 'GalleryImage', 'ContactMessage'];
  
  for (const table of tables) {
    try {
      const result = await client.query(`SELECT COUNT(*) FROM "${table}"`);
      console.log(`✅ Table "${table}": ${result.rows[0].count} records`);
    } catch (error) {
      console.log(`❌ Table "${table}": ${error.message}`);
    }
  }
}

async function checkData(client) {
  console.log('📊 Checking data...');
  
  try {
    // Check admin user
    const adminResult = await client.query('SELECT email, role FROM "User" WHERE email = $1', ['admin@ruslana.com']);
    if (adminResult.rows.length > 0) {
      console.log(`✅ Admin user: ${adminResult.rows[0].email} (${adminResult.rows[0].role})`);
    } else {
      console.log('⚠️ Admin user not found');
    }
    
    // Check articles
    const articlesResult = await client.query('SELECT COUNT(*) FROM "Article" WHERE published = true');
    console.log(`✅ Published articles: ${articlesResult.rows[0].count}`);
    
    // Check gallery images
    const galleryResult = await client.query('SELECT COUNT(*) FROM "GalleryImage" WHERE published = true');
    console.log(`✅ Published gallery images: ${galleryResult.rows[0].count}`);
    
  } catch (error) {
    console.log('⚠️ Could not check data:', error.message);
  }
}

// Run check
checkDatabase().then(() => {
  console.log('🎉 Database check completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Database check failed:', error);
  process.exit(1);
});
