/**
 * World and Camera Configuration
 * Defines dimensions, viewport, and safe area constraints
 */

export interface SafeArea {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface WorldConfig {
  /** Total world width in pixels */
  width: number;
  /** Total world height in pixels */
  height: number;
  /** Viewport (camera frame) dimensions */
  viewport: {
    width: number;
    height: number;
  };
  /** Safe area margins - content cannot be placed within these margins */
  safeArea: SafeArea;
  /** Camera movement settings */
  camera: {
    /** Auto-scroll speed in pixels per second */
    autoScrollSpeed: number;
    /** Whether to loop back to start when reaching end */
    loop: boolean;
    /** Optional padding from edges - camera won't scroll into these zones */
    edgePadding?: {
      left: number;
      right: number;
    };
  };
}

export const WORLD_CONFIG: WorldConfig = {
  width: 7680,
  height: 1080,
  viewport: {
    width: 1080,
    height: 1080,
  },
  safeArea: {
    left: 50,      // no left margin
    right: 50,     // no right margin  
    top: 400,     // images appear below Y=400 (lower portion)
    bottom: 50,  // 50px margin from bottom
  },
  camera: {
    autoScrollSpeed: 100, // pixels per second
    loop: true,
    /** Padding from edges - camera won't scroll into these zones */
    edgePadding: {
      left: 500,   // don't show first 200px of world
      right: 1300,  // don't show last 200px of world
    },
  },
};

/**
 * Calculate the minimum camera X position (leftmost scroll position)
 */
export function getMinCameraX(config: WorldConfig = WORLD_CONFIG): number {
  return config.camera.edgePadding?.left ?? 0;
}

/**
 * Calculate the maximum camera X position (rightmost scroll position)
 */
export function getMaxCameraX(config: WorldConfig = WORLD_CONFIG): number {
  const rightPadding = config.camera.edgePadding?.right ?? 0;
  return Math.max(0, config.width - config.viewport.width - rightPadding);
}

/**
 * Get the effective content area (world minus safe margins)
 */
export function getContentArea(config: WorldConfig = WORLD_CONFIG) {
  return {
    minX: config.safeArea.left,
    maxX: config.width - config.safeArea.right,
    minY: config.safeArea.top,
    maxY: config.height - config.safeArea.bottom,
    width: config.width - config.safeArea.left - config.safeArea.right,
    height: config.height - config.safeArea.top - config.safeArea.bottom,
  };
}
