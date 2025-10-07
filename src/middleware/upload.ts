import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

// Ensure uploads directory exists
const uploadDir = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedImageTypes = (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp').split(',');
  const allowedVideoTypes = (process.env.ALLOWED_VIDEO_TYPES || 'video/mp4,video/webm,video/quicktime').split(',');
  
  const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`));
  }
};

// Multer configuration
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
  }
});

// Image processing middleware
export const processImage = async (req: any, res: any, next: any) => {
  if (!req.file) {
    return next();
  }

  const file = req.file;
  
  // Only process images
  if (!file.mimetype.startsWith('image/')) {
    return next();
  }

  try {
    const inputPath = file.path;
    const outputPath = inputPath.replace(path.extname(inputPath), '_processed.jpg');
    
    // Process image with Sharp
    await sharp(inputPath)
      .resize(1200, 800, { 
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 85 })
      .toFile(outputPath);

    // Get image dimensions
    const metadata = await sharp(outputPath).metadata();
    
    // Update file info
    req.file.processedPath = outputPath;
    req.file.width = metadata.width;
    req.file.height = metadata.height;
    req.file.size = fs.statSync(outputPath).size;

    // Remove original file
    fs.unlinkSync(inputPath);
    
    next();
  } catch (error) {
    console.error('Image processing error:', error);
    next(error);
  }
};

// Video processing middleware (basic validation)
export const processVideo = async (req: any, res: any, next: any) => {
  if (!req.file) {
    return next();
  }

  const file = req.file;
  
  // Only process videos
  if (!file.mimetype.startsWith('video/')) {
    return next();
  }

  try {
    // For now, just validate the file
    // In production, you might want to use ffmpeg for video processing
    req.file.processedPath = file.path;
    next();
  } catch (error) {
    console.error('Video processing error:', error);
    next(error);
  }
};
