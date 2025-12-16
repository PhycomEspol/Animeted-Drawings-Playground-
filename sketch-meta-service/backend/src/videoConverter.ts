import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import * as path from 'path';

// Set ffmpeg path from ffmpeg-static
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

export interface ConvertOptions {
  // Crop from edges (in pixels)
  cropTop?: number;
  cropBottom?: number;
  cropLeft?: number;
  cropRight?: number;
  // Output width (height auto-calculated to maintain aspect ratio)
  width?: number;
  // Frames per second for GIF
  fps?: number;
}

/**
 * Convert MP4 video to GIF with optional cropping
 * @param inputPath - Path to the input MP4 file
 * @param outputPath - Path for the output GIF file (will replace extension if needed)
 * @param options - Conversion options (cropping, size, fps)
 */
export function convertMp4ToGif(
  inputPath: string,
  outputPath: string,
  options: ConvertOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const gifPath = outputPath.replace(/\.mp4$/i, '.gif');
    
    const {
      cropTop = 50,
      cropBottom = 50,
      cropLeft = 100,
      cropRight = 100,
      width = 480,
      fps = 15
    } = options;

    let command = ffmpeg(inputPath);

    // Build video filters
    const filters: string[] = [];

    // Add crop filter if any cropping is specified
    if (cropTop > 0 || cropBottom > 0 || cropLeft > 0 || cropRight > 0) {
      // crop filter: crop=out_w:out_h:x:y
      // We use in_w and in_h to reference input dimensions
      filters.push(`crop=in_w-${cropLeft + cropRight}:in_h-${cropTop + cropBottom}:${cropLeft}:${cropTop}`);
    }

    // Add scale filter for width (height auto)
    filters.push(`scale=${width}:-1:flags=lanczos`);

    // Add fps filter
    filters.push(`fps=${fps}`);

    // Apply complex filter for GIF palette generation (better quality)
    const paletteFilters = filters.join(',');
    
    command
      .outputOptions([
        '-vf', `${paletteFilters},split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
        '-loop', '0' // Loop forever
      ])
      .output(gifPath)
      .on('start', (commandLine: string) => {
        console.log('FFmpeg command:', commandLine);
      })
      .on('progress', (progress: { percent?: number }) => {
        if (progress.percent) {
          console.log(`Converting: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', () => {
        console.log(`GIF conversion complete: ${gifPath}`);
        resolve(gifPath);
      })
      .on('error', (err: Error) => {
        console.error('FFmpeg error:', err);
        reject(err);
      })
      .run();
  });
}
