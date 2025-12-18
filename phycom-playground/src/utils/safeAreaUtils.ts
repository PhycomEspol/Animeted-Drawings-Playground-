/**
 * Safe Area Utilities
 * Functions for validating and generating positions within the safe area
 */

import { WORLD_CONFIG, getContentArea, type SafeArea, type WorldConfig } from '../config/worldConfig';

export interface ImageSize {
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}

/**
 * Default image size for placement calculations
 */
const DEFAULT_IMAGE_SIZE: ImageSize = { width: 200, height: 200 };

/**
 * Check if a position + size is fully within the safe area
 */
export function isWithinSafeArea(
  position: Position,
  size: ImageSize = DEFAULT_IMAGE_SIZE,
  config: WorldConfig = WORLD_CONFIG
): boolean {
  const { safeArea, width: worldWidth, height: worldHeight } = config;
  
  const left = position.x;
  const right = position.x + size.width;
  const top = position.y;
  const bottom = position.y + size.height;
  
  return (
    left >= safeArea.left &&
    right <= worldWidth - safeArea.right &&
    top >= safeArea.top &&
    bottom <= worldHeight - safeArea.bottom
  );
}

/**
 * Clamp a position to fit within the safe area
 */
export function clampToSafeArea(
  position: Position,
  size: ImageSize = DEFAULT_IMAGE_SIZE,
  config: WorldConfig = WORLD_CONFIG
): Position {
  const contentArea = getContentArea(config);
  
  return {
    x: Math.max(
      contentArea.minX,
      Math.min(position.x, contentArea.maxX - size.width)
    ),
    y: Math.max(
      contentArea.minY,
      Math.min(position.y, contentArea.maxY - size.height)
    ),
  };
}

/**
 * Generate a random position within the safe area
 */
export function getRandomWorldPosition(
  size: ImageSize = DEFAULT_IMAGE_SIZE,
  config: WorldConfig = WORLD_CONFIG
): Position {
  const contentArea = getContentArea(config);
  
  // Calculate available space for the image
  const availableWidth = contentArea.width - size.width;
  const availableHeight = contentArea.height - size.height;
  
  // Ensure we have valid space
  if (availableWidth <= 0 || availableHeight <= 0) {
    console.warn('Image size exceeds safe area, clamping to minimum position');
    return { x: contentArea.minX, y: contentArea.minY };
  }
  
  return {
    x: contentArea.minX + Math.floor(Math.random() * availableWidth),
    y: contentArea.minY + Math.floor(Math.random() * availableHeight),
  };
}

/**
 * Validate and optionally correct a position for safe area compliance
 * Returns the position (possibly clamped) and whether it was valid
 */
export function validatePosition(
  position: Position,
  size: ImageSize = DEFAULT_IMAGE_SIZE,
  config: WorldConfig = WORLD_CONFIG
): { position: Position; wasValid: boolean } {
  const isValid = isWithinSafeArea(position, size, config);
  
  return {
    position: isValid ? position : clampToSafeArea(position, size, config),
    wasValid: isValid,
  };
}
