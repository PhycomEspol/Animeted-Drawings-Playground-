/**
 * Viewport Component
 * Fixed-size camera frame that clips the world content
 */

import React from 'react';
import './Viewport.css';

interface ViewportProps {
  children: React.ReactNode;
}

export function Viewport({ children }: ViewportProps) {
  return (
    <div 
      className="viewport"
      style={{
        width: '100vw',
        height: '100vh',
      }}
    >
      {children}
    </div>
  );
}
