export interface RenderRequest {
  id: string;
  createdAt: string;
  status: 'running' | 'done' | 'error';
  inputPath: string;
  outputPath: string | null;
  outputUrl: string | null;
  videoUrl?: string | null;  // Final animation video URL from Meta Sketch
  error?: string;
}

export interface RenderResult {
  outputPath: string;
  durationMs: number;
}
