import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import * as path from 'path';

// Set ffmpeg path from ffmpeg-static
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

export type OutputFormat = 'gif' | 'webp';

export interface ConvertOptions {
  // Crop from edges (in pixels)
  cropTop?: number;
  cropBottom?: number;
  cropLeft?: number;
  cropRight?: number;
  // Output width (height auto-calculated to maintain aspect ratio)
  width?: number;
  // Frames per second for output
  fps?: number;
  // Output format: 'gif' or 'webp' (webp recommended for transparency)
  outputFormat?: OutputFormat;
  // Remove white background (make transparent)
  removeBackground?: boolean;
  // Background removal settings (only used when removeBackground is true)
  backgroundSimilarity?: number;  // 0.0-1.0: how close to white counts as white (default: 0.1)
  backgroundBlend?: number;       // 0.0-1.0: blend factor for soft edges (default: 0.1)
}

/**
 * Convert MP4 video to GIF or WebP with optional cropping and background removal
 * @param inputPath - Path to the input MP4 file
 * @param outputPath - Path for the output file (extension will be replaced based on format)
 * @param options - Conversion options (cropping, size, fps, background removal)
 */
export function convertMp4ToGif(
  inputPath: string,
  outputPath: string,
  options: ConvertOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const {
      cropTop = 50,
      cropBottom = 50,
      cropLeft = 0,
      cropRight = 0,
      width = 480,
      fps = 15,
      outputFormat = 'gif',
      removeBackground = false,
      backgroundSimilarity = 0.1,
      backgroundBlend = 0.1
    } = options;

    // Determine output path based on format
    const extension = outputFormat === 'webp' ? '.webp' : '.gif';
    const finalOutputPath = outputPath.replace(/\.(mp4|gif|webp)$/i, extension);

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

    // Add background removal filter (colorkey makes white transparent)
    if (removeBackground) {
      // colorkey=color:similarity:blend
      // - color: the color to make transparent (#fbfdfb - off-white from animated drawings)
      // - similarity: how close to the color counts (0.0-1.0)
      // - blend: edge blending for smoother transparency (0.0-1.0)
      filters.push(`colorkey=0xfbfdfb:${backgroundSimilarity}:${backgroundBlend}`);
      // Ensure we output with alpha channel format
      filters.push('format=rgba');
    }

    if (outputFormat === 'webp') {
      // WebP output - better quality, full alpha channel support
      const filterString = filters.join(',');
      
      command
        .outputOptions([
          '-vf', filterString,
          '-loop', '0',           // Loop forever
          '-quality', '80',       // WebP quality (0-100)
          '-preset', 'default',   // Encoding preset
          '-an'                   // No audio
        ])
        .output(finalOutputPath);
    } else {
      // GIF output with palette generation for better quality
      const paletteFilters = filters.join(',');
      
      if (removeBackground) {
        // For transparent GIF, we need special palette handling
        command
          .outputOptions([
            '-vf', `${paletteFilters},split[s0][s1];[s0]palettegen=reserve_transparent=1[p];[s1][p]paletteuse=alpha_threshold=128`,
            '-loop', '0',
            '-gifflags', '+transdiff'  // Optimize for transparency changes
          ])
          .output(finalOutputPath);
      } else {
        // Standard GIF without transparency
        command
          .outputOptions([
            '-vf', `${paletteFilters},split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
            '-loop', '0'
          ])
          .output(finalOutputPath);
      }
    }

    command
      .on('start', (commandLine: string) => {
        console.log('FFmpeg command:', commandLine);
      })
      .on('progress', (progress: { percent?: number }) => {
        if (progress.percent) {
          console.log(`Converting: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', () => {
        console.log(`${outputFormat.toUpperCase()} conversion complete: ${finalOutputPath}`);
        resolve(finalOutputPath);
      })
      .on('error', (err: Error) => {
        console.error('FFmpeg error:', err);
        reject(err);
      })
      .run();
  });
}
