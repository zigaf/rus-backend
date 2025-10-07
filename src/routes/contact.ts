import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Submit contact message (public)
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    const contactMessage = await prisma.contactMessage.create({
      data: {
        name,
        email,
        phone,
        message
      }
    });

    res.status(201).json({ 
      message: 'Contact message sent successfully',
      id: contactMessage.id 
    });
  } catch (error) {
    console.error('Submit contact message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get all contact messages (admin only)
router.get('/', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { read, limit = 50, offset = 0 } = req.query;
    
    const where = read !== undefined ? { read: read === 'true' } : {};
    
    const messages = await prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    const total = await prisma.contactMessage.count({ where });

    res.json({
      messages,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    console.error('Get contact messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single contact message (admin only)
router.get('/:id', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    
    const message = await prisma.contactMessage.findUnique({
      where: { id: parseInt(id) }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json(message);
  } catch (error) {
    console.error('Get contact message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark message as read (admin only)
router.patch('/:id/read', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { read = true } = req.body;

    const existingMessage = await prisma.contactMessage.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingMessage) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const message = await prisma.contactMessage.update({
      where: { id: parseInt(id) },
      data: { read }
    });

    res.json(message);
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete contact message (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;

    const existingMessage = await prisma.contactMessage.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingMessage) {
      return res.status(404).json({ error: 'Message not found' });
    }

    await prisma.contactMessage.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Contact message deleted successfully' });
  } catch (error) {
    console.error('Delete contact message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get contact statistics (admin only)
router.get('/stats/overview', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const total = await prisma.contactMessage.count();
    const unread = await prisma.contactMessage.count({ where: { read: false } });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayMessages = await prisma.contactMessage.count({
      where: {
        createdAt: {
          gte: today
        }
      }
    });

    res.json({
      total,
      unread,
      today: todayMessages,
      read: total - unread
    });
  } catch (error) {
    console.error('Get contact stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
