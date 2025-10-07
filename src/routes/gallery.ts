import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all gallery images (public)
router.get('/', async (req, res) => {
  try {
    const { published = 'true' } = req.query;
    
    const images = await prisma.galleryImage.findMany({
      where: published === 'true' ? { published: true } : {},
      orderBy: { order: 'asc' }
    });

    res.json(images);
  } catch (error) {
    console.error('Get gallery images error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single gallery image (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const image = await prisma.galleryImage.findUnique({
      where: { id: parseInt(id) }
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Only return published images to non-authenticated users
    if (!image.published && !req.headers.authorization) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.json(image);
  } catch (error) {
    console.error('Get gallery image error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create gallery image (admin only)
router.post('/', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { 
      title, 
      description, 
      imageUrl, 
      imageType = 'image', 
      fileSize, 
      width, 
      height, 
      order = 0, 
      published = true 
    } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    const image = await prisma.galleryImage.create({
      data: {
        title,
        description,
        imageUrl,
        imageType,
        fileSize,
        width,
        height,
        order,
        published
      }
    });

    res.status(201).json(image);
  } catch (error) {
    console.error('Create gallery image error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update gallery image (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      imageUrl, 
      imageType, 
      fileSize, 
      width, 
      height, 
      order, 
      published 
    } = req.body;

    const existingImage = await prisma.galleryImage.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingImage) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const image = await prisma.galleryImage.update({
      where: { id: parseInt(id) },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(imageUrl && { imageUrl }),
        ...(imageType && { imageType }),
        ...(fileSize !== undefined && { fileSize }),
        ...(width !== undefined && { width }),
        ...(height !== undefined && { height }),
        ...(order !== undefined && { order }),
        ...(published !== undefined && { published })
      }
    });

    res.json(image);
  } catch (error) {
    console.error('Update gallery image error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete gallery image (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;

    const existingImage = await prisma.galleryImage.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingImage) {
      return res.status(404).json({ error: 'Image not found' });
    }

    await prisma.galleryImage.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete gallery image error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reorder gallery images (admin only)
router.patch('/reorder', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { images } = req.body; // Array of { id, order }

    if (!Array.isArray(images)) {
      return res.status(400).json({ error: 'Images array is required' });
    }

    const updatePromises = images.map((img: any) =>
      prisma.galleryImage.update({
        where: { id: img.id },
        data: { order: img.order }
      })
    );

    await Promise.all(updatePromises);

    res.json({ message: 'Gallery reordered successfully' });
  } catch (error) {
    console.error('Reorder gallery error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Publish/Unpublish gallery image (admin only)
router.patch('/:id/publish', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { published } = req.body;

    const existingImage = await prisma.galleryImage.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingImage) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const image = await prisma.galleryImage.update({
      where: { id: parseInt(id) },
      data: { published }
    });

    res.json(image);
  } catch (error) {
    console.error('Publish gallery image error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
