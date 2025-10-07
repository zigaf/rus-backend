import express from 'express';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { upload, processImage, processVideo } from '../middleware/upload';

const router = express.Router();
const prisma = new PrismaClient();

// Upload single file
router.post('/single', authenticateToken, requireAdmin, upload.single('file'), processImage, processVideo, async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const baseUrl = process.env.RAILWAY_STATIC_URL || `http://localhost:${process.env.PORT || 3001}`;
    
    // Use processed path if available, otherwise original path
    const filePath = file.processedPath || file.path;
    const fileName = path.basename(filePath);
    const fileUrl = `${baseUrl}/uploads/${fileName}`;

    res.json({
      success: true,
      file: {
        originalName: file.originalname,
        fileName: fileName,
        fileUrl: fileUrl,
        filePath: filePath,
        mimetype: file.mimetype,
        size: file.size,
        width: file.width,
        height: file.height
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Upload multiple files
router.post('/multiple', authenticateToken, requireAdmin, upload.array('files', 10), async (req: any, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const baseUrl = process.env.RAILWAY_STATIC_URL || `http://localhost:${process.env.PORT || 3001}`;
    const uploadedFiles = [];

    for (const file of req.files) {
      const fileName = path.basename(file.path);
      const fileUrl = `${baseUrl}/uploads/${fileName}`;

      uploadedFiles.push({
        originalName: file.originalname,
        fileName: fileName,
        fileUrl: fileUrl,
        filePath: file.path,
        mimetype: file.mimetype,
        size: file.size
      });
    }

    res.json({
      success: true,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Delete file
router.delete('/:filename', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { filename } = req.params;
    const uploadDir = process.env.UPLOAD_PATH || './uploads';
    const filePath = path.join(uploadDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete file
    fs.unlinkSync(filePath);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Get file info
router.get('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const uploadDir = process.env.UPLOAD_PATH || './uploads';
    const filePath = path.join(uploadDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const stats = fs.statSync(filePath);
    const baseUrl = process.env.RAILWAY_STATIC_URL || `http://localhost:${process.env.PORT || 3001}`;
    const fileUrl = `${baseUrl}/uploads/${filename}`;

    res.json({
      filename: filename,
      fileUrl: fileUrl,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    });
  } catch (error) {
    console.error('Get file info error:', error);
    res.status(500).json({ error: 'Failed to get file info' });
  }
});

// List all uploaded files (admin only)
router.get('/', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const uploadDir = process.env.UPLOAD_PATH || './uploads';
    const baseUrl = process.env.RAILWAY_STATIC_URL || `http://localhost:${process.env.PORT || 3001}`;

    if (!fs.existsSync(uploadDir)) {
      return res.json({ files: [] });
    }

    const files = fs.readdirSync(uploadDir).map(filename => {
      const filePath = path.join(uploadDir, filename);
      const stats = fs.statSync(filePath);
      
      return {
        filename: filename,
        fileUrl: `${baseUrl}/uploads/${filename}`,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    });

    res.json({ files });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

export default router;
