import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all articles (public)
router.get('/', async (req, res) => {
  try {
    const { published = 'true' } = req.query;
    
    const articles = await prisma.article.findMany({
      where: published === 'true' ? { published: true } : {},
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        excerpt: true,
        category: true,
        image: true,
        date: true,
        readTime: true,
        published: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json(articles);
  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single article (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const article = await prisma.article.findUnique({
      where: { id: parseInt(id) }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Only return published articles to non-authenticated users
    if (!article.published && !req.headers.authorization) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json(article);
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create article (admin only)
router.post('/', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { title, excerpt, category, image, content, date, readTime, published = false } = req.body;

    if (!title || !excerpt || !category || !content || !date || !readTime) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    const article = await prisma.article.create({
      data: {
        title,
        excerpt,
        category,
        image,
        content,
        date,
        readTime,
        published
      }
    });

    res.status(201).json(article);
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update article (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { title, excerpt, category, image, content, date, readTime, published } = req.body;

    const existingArticle = await prisma.article.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingArticle) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const article = await prisma.article.update({
      where: { id: parseInt(id) },
      data: {
        ...(title && { title }),
        ...(excerpt && { excerpt }),
        ...(category && { category }),
        ...(image !== undefined && { image }),
        ...(content && { content }),
        ...(date && { date }),
        ...(readTime && { readTime }),
        ...(published !== undefined && { published })
      }
    });

    res.json(article);
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete article (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;

    const existingArticle = await prisma.article.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingArticle) {
      return res.status(404).json({ error: 'Article not found' });
    }

    await prisma.article.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Publish/Unpublish article (admin only)
router.patch('/:id/publish', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { published } = req.body;

    const existingArticle = await prisma.article.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingArticle) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const article = await prisma.article.update({
      where: { id: parseInt(id) },
      data: { published }
    });

    res.json(article);
  } catch (error) {
    console.error('Publish article error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
