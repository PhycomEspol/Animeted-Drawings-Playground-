/**
 * StatusBar component - shows connection status and rebuild button
 */

import type { ConnectionStatus } from '../types';
import './StatusBar.css';

interface StatusBarProps {
  connectionStatus: ConnectionStatus;
  drawCount: number;
  onRebuild: () => void;
}

export function StatusBar({ connectionStatus, drawCount, onRebuild }: StatusBarProps) {
  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'disconnected': return '🔴';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected, retrying...';
    }
  };

  return (
    <div className="status-bar">
      <div className="status-info">
        <span className="status-indicator">
          {getStatusIcon()} {getStatusText()}
        </span>
        <span className="draw-count">
          {drawCount} item{drawCount !== 1 ? 's' : ''} on board
        </span>
      </div>
      <button 
        className="rebuild-button"
        onClick={onRebuild}
        disabled={connectionStatus !== 'connected'}
      >
        ⟳ Rebuild
      </button>
    </div>
  );
}
