/**
 * DrawCard component - displays just the image/video
 * Uses GPU-accelerated positioning with translate3d
 */

import type { DrawItem } from '../types';
import './DrawCard.css';

interface DrawCardProps {
  draw: DrawItem;
}

/**
 * Check if URL is a video
 */
function isVideo(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.endsWith('.webm') || lower.endsWith('.mp4');
}

export function DrawCard({ draw }: DrawCardProps) {
  // Use translate3d for GPU-accelerated positioning
  const style = draw.position ? {
    transform: `translate3d(${draw.position.x}px, ${draw.position.y}px, 0)`,
  } : {};

  return (
    <div className="draw-item" style={style}>
      {isVideo(draw.outputUrl) ? (
        <video
          src={draw.outputUrl}
          loop
          muted
          autoPlay
          playsInline
        />
      ) : (
        <img src={draw.outputUrl} alt="" loading="lazy" />
      )}
    </div>
  );
}
