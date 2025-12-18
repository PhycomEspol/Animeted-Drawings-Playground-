/**
 * Board component - displays draws inside World/Viewport camera system
 */

import { useRef, useEffect } from 'react';
import type { DrawItem } from '../types';
import { DrawCard } from './DrawCard';
import { Viewport } from './Viewport';
import { World } from './World';
import { useCameraController } from '../hooks/useCameraController';
import './Board.css';

interface BoardProps {
  draws: DrawItem[];
}

export function Board({ draws }: BoardProps) {
  const worldRef = useRef<HTMLDivElement>(null);
  const camera = useCameraController(worldRef);

  // Start camera animation on mount
  useEffect(() => {
    camera.start();
    // camera.setSpeed(100);
    return () => camera.pause();
  }, [camera]);

  if (draws.length === 0) {
    return (
      <div className="board">
        <div className="board-empty">
          <div className="empty-icon">🎨</div>
          <h2>No draws yet</h2>
          <p>Waiting for outputs from the writer backend...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="board">
      <Viewport>
        <World ref={worldRef}>
          {draws.map(draw => (
            <DrawCard key={draw.id} draw={draw} />
          ))}
        </World>
      </Viewport>
    </div>
  );
}
