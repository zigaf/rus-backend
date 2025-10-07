const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
  origin: ['https://rus-production.up.railway.app', 'http://localhost:4200'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    server: 'ultra-simple-backend',
    message: 'Backend is running successfully!'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    server: 'ultra-simple-backend',
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

// Simple articles endpoint
app.get('/api/articles', (req, res) => {
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

// Get single article
app.get('/api/articles/:id', (req, res) => {
  const articleId = parseInt(req.params.id);
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

// Simple gallery endpoint
app.get('/api/gallery', (req, res) => {
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

// Get single gallery image
app.get('/api/gallery/:id', (req, res) => {
  const imageId = parseInt(req.params.id);
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
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  
  console.log('New contact message:', { name, email, message });
  
  res.json({
    success: true,
    message: 'Message sent successfully'
  });
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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Ultra Simple Backend Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: https://rus-production.up.railway.app`);
});

// Handle server errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
