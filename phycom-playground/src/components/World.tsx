/**
 * World Component
 * Large content container that moves via GPU-accelerated transform
 */

import React, { forwardRef } from 'react';
import { WORLD_CONFIG } from '../config/worldConfig';
import './World.css';

interface WorldProps {
  children: React.ReactNode;
}

export const World = forwardRef<HTMLDivElement, WorldProps>(
  function World({ children }, ref) {
    return (
      <div
        ref={ref}
        className="world"
        style={{
          width: WORLD_CONFIG.width,
          height: '100vh',
        }}
      >
        {children}
      </div>
    );
  }
);
