import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { extractTextFromFile } from '../services/cv.js';
import { extractCvStructured } from '../services/llm.js';

const router = Router();

fs.mkdirSync(config.uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: config.uploadDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: 'No file uploaded' });
    return;
  }
  const file_url = `/api/files/${req.file.filename}`;
  res.json({ file_url, filename: req.file.filename });
});

router.post('/extract', async (req, res) => {
  try {
    const { file_url, json_schema } = req.body as {
      file_url?: string;
      json_schema?: Record<string, unknown>;
    };
    if (!file_url) {
      res.status(400).json({ message: 'file_url is required' });
      return;
    }
    const filename = path.basename(file_url);
    const filePath = path.join(config.uploadDir, filename);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ message: 'File not found' });
      return;
    }
    const text = await extractTextFromFile(filePath);
    const result = await extractCvStructured({ text, json_schema: json_schema ?? {} });
    res.json(result);
  } catch (err) {
    console.error('[cv/extract]', err);
    const message = err instanceof Error ? err.message : 'Extraction failed';
    res.status(500).json({ status: 'error', message });
  }
});

export default router;
