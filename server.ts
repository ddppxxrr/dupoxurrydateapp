import express from 'express';
import path from 'path';
import multer from 'multer';
import "dotenv/config";
import cors from 'cors';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(cors());

// Set up S3 Client
const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || 'https://884cb2a9424172306f5b47d18010f5e0.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'dupoxurry';
const DEV_URL = process.env.R2_PUBLIC_DEV_URL || 'https://pub-9f8d7e0a94464c84a41bd64c250edad5.r2.dev';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});

app.use(express.json({ limit: '50mb' }));

// API to handle file uploads
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { mimetype, originalname, buffer } = req.file;

    // Generate unique filename
    const ext = path.extname(originalname);
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
    
    // Guess mime from extension if octet-stream or missing
    let finalMimeType = mimetype;
    if (!finalMimeType || finalMimeType === 'application/octet-stream') {
      if (ext === '.mp3') finalMimeType = 'audio/mpeg';
      else if (ext === '.mp4') finalMimeType = 'video/mp4';
      else if (ext === '.jpg' || ext === '.jpeg') finalMimeType = 'image/jpeg';
      else if (ext === '.png') finalMimeType = 'image/png';
    }

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueFilename,
      Body: buffer,
      ContentType: finalMimeType,
    });

    await s3Client.send(command);

    // Return the proxy URL instead of public R2 dev URL since it errors
    const publicUrl = `/api/media/${uniqueFilename}`;
    res.json({ url: publicUrl });

  } catch (error) {
    console.error('Error uploading to R2:', error);
    res.status(500).json({ error: 'Failed to upload file to Cloudflare R2' });
  }
});

// API to handle base64 uploads (for compressed images)
app.post('/api/upload-base64', async (req, res) => {
  try {
    const { base64, contentType } = req.body;
    
    if (!base64) {
      return res.status(400).json({ error: 'No base64 data provided' });
    }

    // Extract base64 data
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    const mimeMatch = base64.match(/^data:(image\/\w+);base64,/);
    const mime = contentType || (mimeMatch ? mimeMatch[1] : 'image/jpeg');

    const ext = mime.split('/')[1] || 'jpeg';
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueFilename,
      Body: buffer,
      ContentType: mime,
    });

    await s3Client.send(command);

    const publicUrl = `/api/media/${uniqueFilename}`;
    res.json({ url: publicUrl });

  } catch (error) {
    console.error('Error uploading to R2:', error);
    res.status(500).json({ error: 'Failed to upload base64 to Cloudflare R2' });
  }
});

// API config for streaming media directly from R2 bucket
app.get('/api/media/:key', async (req, res) => {
  try {
    const params: any = {
      Bucket: BUCKET_NAME,
      Key: req.params.key,
    };
    // Pass along Range header for video/audio streaming (espeically Safari)
    if (req.headers.range) {
      params.Range = req.headers.range;
    }
    
    const command = new GetObjectCommand(params);
    const response = await s3Client.send(command);
    
    const statusCode = response.$metadata?.httpStatusCode || 200;
    res.status(statusCode);
    
    if (response.ContentType) res.setHeader('Content-Type', response.ContentType);
    if (response.ContentLength) res.setHeader('Content-Length', response.ContentLength);
    if (response.ContentRange) res.setHeader('Content-Range', response.ContentRange);
    res.setHeader('Accept-Ranges', 'bytes');
    
    // Body is a Readable browser stream or Node stream depending on env
    if (response.Body && (response.Body as any).pipe) {
       (response.Body as any).pipe(res);
    } else {
       // fallback if string/buffer
       res.send(await response.Body?.transformToByteArray());
    }
  } catch (err: any) {
    console.error("Error Streaming from S3:", err);
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
      res.status(404).send('Not Found');
    } else if (err.name === 'InvalidRange' || err.$metadata?.httpStatusCode === 416) {
      res.status(416).send('Requested Range Not Satisfiable');
    } else {
      res.status(500).send('Internal Server Error');
    }
  }
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
