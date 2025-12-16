import { db } from './firestore';
import { runSketchAutomation } from './playwrightRunner';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { RenderRequest } from './types';

// Simple in-memory mutex
let isBusy = false;

export const renderService = {
  async submitJob(file: Express.Multer.File, demoIndex: number): Promise<RenderRequest> {
    if (isBusy) {
      throw new Error('Renderer busy');
    }

    isBusy = true;
    const id = uuidv4();
    const timestamp = Date.now();
    
    // Input/Output paths
    const inputExt = path.extname(file.originalname) || '.png';
    const inputFilename = `${id}${inputExt}`;
    const outputFilename = `${id}.gif`;
    
    // Absolute paths (adjust based on where server runs, assuming root/storage is accessible)
    // We assume the process runs from 'backend' or 'root'. Let's resolve relative to process.cwd()
    // but better to rely on fixed structure: <root>/storage
    const storageRoot = path.resolve(__dirname, '../../storage');
    const inputPath = path.join(storageRoot, 'inputs', inputFilename);
    const outputPath = path.join(storageRoot, 'outputs', outputFilename);

    // Save input file
    fs.writeFileSync(inputPath, file.buffer);

    // Create Firestore Doc
    const docData: RenderRequest = {
      id,
      createdAt: timestamp,
      status: 'running',
      inputPath,
      outputPath: null,
      outputUrl: null,
      demoIndex,
    };
    
    await db.collection('renders').doc(id).set(docData);

    // Start processing asynchronously (Fire and Forget from API perspective? 
    // Spec says Synchronous Request Flow: "Return outputUrl" implies waiting.
    // Spec says "3) Returns JSON { id, outputUrl }".
    // This implies we MUST wait for Playwright to finish.
    
    try {
      const startTime = Date.now();
      const videoUrl = await runSketchAutomation(inputPath, outputPath, demoIndex);
      const durationMs = Date.now() - startTime;

      // Update Firestore
      const outputUrl = `http://localhost:3000/files/outputs/${outputFilename}`;
      const updateData: Partial<RenderRequest> = {
        status: 'done',
        outputPath,
        outputUrl,
        videoUrl,  // Store the final animation video URL
        durationMs
      };
      
      await db.collection('renders').doc(id).update(updateData);
      
      isBusy = false;
      
      return { ...docData, ...updateData } as RenderRequest;

    } catch (err: any) {
      isBusy = false;
      const errorMsg = err.message || 'Unknown error';
      await db.collection('renders').doc(id).update({
        status: 'error',
        error: errorMsg
      });
      throw err;
    }
  },

  checkBusy() {
    return isBusy;
  }
};
