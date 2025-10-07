const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
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

// Simple articles endpoint
app.get('/api/articles', (req, res) => {
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
      content: { intro: 'Рак легень залишається одним з найпоширеніших онкологічних захворювань.', sections: [{ heading: 'Симптоми', text: 'Кашель, задишка, біль у грудях.' }] }
    },
    {
      id: 2,
      title: 'Сучасні методи лікування раку легень',
      excerpt: 'Від хірургічного втручання до таргетної терапії.',
      category: 'Лікування',
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&h=600&fit=crop',
      date: '10 березня 2025',
      readTime: '8 хв',
      published: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: { intro: 'Сучасні методи лікування.', sections: [{ heading: 'Хірургія', text: 'Операційне видалення.' }] }
    }
  ];
  
  res.json(articles);
});

// Simple gallery endpoint
app.get('/api/gallery', (req, res) => {
  const gallery = [
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
    }
  ];
  
  res.json(gallery);
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Simple server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    process.exit(0);
  });
});
