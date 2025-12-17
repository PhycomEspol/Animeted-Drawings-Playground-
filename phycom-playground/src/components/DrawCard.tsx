/**
 * DrawCard component - displays just the image/video
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
  const style = draw.position ? {
    left: draw.position.x,
    top: draw.position.y,
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
