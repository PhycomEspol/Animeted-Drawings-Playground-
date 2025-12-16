import express from 'express';
import multer from 'multer';
import cors from 'cors';
import * as path from 'path';
import { renderService } from './renderService';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Check storage paths
const storageRoot = path.resolve(__dirname, '../../storage');
const inputsDir = path.join(storageRoot, 'inputs');
const outputsDir = path.join(storageRoot, 'outputs');
// Ensure they exist (redundant if mkdir succeeded, but good for safety)
import * as fs from 'fs';
if (!fs.existsSync(inputsDir)) fs.mkdirSync(inputsDir, { recursive: true });
if (!fs.existsSync(outputsDir)) fs.mkdirSync(outputsDir, { recursive: true });

// Setup Multer (memory storage for simplicity, or save directly)
// We already save manually in service, but using MemoryStorage is fine for small files.
const upload = multer({ storage: multer.memoryStorage() });

// API: Render
app.post('/api/render', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  // Check mutex
  if (renderService.checkBusy()) {
    return res.status(429).json({ error: 'Renderer busy' });
  }

  try {
    const demoIndex = parseInt(req.body.demoIndex || '0', 10);
    const result = await renderService.submitJob(req.file, demoIndex);
    res.json(result);
  } catch (err: any) {
    console.error('Render failed:', err);
    res.status(500).json({ error: err.message || 'Render failed' });
  }
});

// API: Get Status
app.get('/api/render/:id', async (req, res) => {
    // TODO: Implement GET from Firestore if needed, 
    // strictly speaking the synchronous flow returns everything.
    // Implementing purely for completeness/debugging.
    res.status(501).json({ error: 'Not implemented yet' });
});

// Serve Static Files (Outputs)
app.use('/files/outputs', express.static(outputsDir));

// Serve Frontend
const frontendDir = path.resolve(__dirname, '../../frontend');
app.use(express.static(frontendDir));

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
  console.log(`Frontend served at http://localhost:${port}`);
  console.log(`Storage root: ${storageRoot}`);
});
