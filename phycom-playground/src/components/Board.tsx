/**
 * Board component - displays draws at random positions
 */

import type { DrawItem } from '../types';
import { DrawCard } from './DrawCard';
import './Board.css';

interface BoardProps {
  draws: DrawItem[];
}

export function Board({ draws }: BoardProps) {
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
      {draws.map(draw => (
        <DrawCard key={draw.id} draw={draw} />
      ))}
    </div>
  );
}
