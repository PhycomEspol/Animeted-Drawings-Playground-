export interface RenderRequest {
  id: string;
  createdAt: number;
  status: 'running' | 'done' | 'error';
  inputPath: string;
  outputPath: string | null;
  outputUrl: string | null;
  videoUrl?: string | null;  // Final animation video URL from Meta Sketch
  demoIndex: number;
  error?: string;
  durationMs?: number;
}

export interface RenderResult {
  outputPath: string;
  durationMs: number;
}
