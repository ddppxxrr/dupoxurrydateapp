import express from 'express';
import path from 'path';
import multer from 'multer';
import "dotenv/config";
import cors from 'cors';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { createServer as createViteServer } from 'vite';
import mongoose from 'mongoose';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- MongoDB Setup ---
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/dupoxurry";
mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2000 }).then(() => {
  console.log("Connected to MongoDB");
}).catch(err => {
  console.log("Note: MongoDB failed to connect locally. Please set MONGODB_URI in your environment.");
});

const isConnected = () => mongoose.connection.readyState === 1;

const memorySchema = new mongoose.Schema({
  title: String,
  date: String,
  mediaUrls: [String],
  mediaType: String,
  musicUrl: String,
  author: String,
  userId: String,
  songTitle: String,
  note: String,
}, { timestamps: true });

const Memory = mongoose.model('Memory', memorySchema);

const photoSchema = new mongoose.Schema({
  category: String,
  imageUrl: String,
  title: String,
}, { timestamps: true });

const Photo = mongoose.model('Photo', photoSchema);

const settingSchema = new mongoose.Schema({
  id: { type: String, default: 'global' },
  dupoCover: String,
  xurryCover: String,
}, { timestamps: true });

const Setting = mongoose.model('Setting', settingSchema);

// --- REST Endpoints for Data ---

app.get('/api/memories', async (req, res) => {
  try {
    if (!isConnected()) return res.json([]);
    const mems = await Memory.find().sort({ date: -1 });
    res.json(mems.map(m => ({ id: m._id.toString(), ...m.toObject(), createdAt: { seconds: Math.floor(new Date(m.createdAt).getTime()/1000) } })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

app.post('/api/memories', async (req, res) => {
  try {
    if (!isConnected()) return res.status(503).json({ error: 'DB not connected' });
    const m = new Memory(req.body);
    await m.save();
    res.json({ id: m._id.toString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create' });
  }
});

app.put('/api/memories/:id', async (req, res) => {
  try {
    if (!isConnected()) return res.status(503).json({ error: 'DB not connected' });
    await Memory.findByIdAndUpdate(req.params.id, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

app.delete('/api/memories/:id', async (req, res) => {
  try {
    if (!isConnected()) return res.status(503).json({ error: 'DB not connected' });
    await Memory.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

app.get('/api/photos', async (req, res) => {
  try {
    if (!isConnected()) return res.json([]);
    const { category } = req.query;
    const filter = category ? { category } : {};
    const photos = await Photo.find(filter).sort({ createdAt: -1 });
    res.json(photos.map(p => ({ id: p._id.toString(), ...p.toObject(), createdAt: { seconds: Math.floor(new Date(p.createdAt).getTime()/1000) } })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

app.post('/api/photos', async (req, res) => {
  try {
    if (!isConnected()) return res.status(503).json({ error: 'DB not connected' });
    const p = new Photo(req.body);
    await p.save();
    res.json({ id: p._id.toString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create' });
  }
});

app.delete('/api/photos/:id', async (req, res) => {
  try {
    if (!isConnected()) return res.status(503).json({ error: 'DB not connected' });
    await Photo.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

app.get('/api/settings', async (req, res) => {
  try {
    if (!isConnected()) return res.json({ id: 'global', dupoCover: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&q=80&w=1200', xurryCover: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200' });
    let s = await Setting.findOne({ id: 'global' });
    if (!s) {
      s = new Setting({ id: 'global', dupoCover: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&q=80&w=1200', xurryCover: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200' });
      await s.save();
    }
    res.json(s.toObject());
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    if (!isConnected()) return res.status(503).json({ error: 'DB not connected' });
    let s = await Setting.findOne({ id: 'global' });
    if (!s) {
      s = new Setting({ id: 'global', ...req.body });
      await s.save();
    } else {
      Object.assign(s, req.body);
      await s.save();
    }
    res.json(s.toObject());
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// --- R2 Storage Setup ---
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
