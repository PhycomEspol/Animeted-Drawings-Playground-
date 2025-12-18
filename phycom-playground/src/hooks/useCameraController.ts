/**
 * Camera Controller Hook
 * Manages camera position using requestAnimationFrame for smooth movement
 * Decoupled from React re-renders using refs
 */

import { useRef, useCallback, useEffect } from 'react';
import { WORLD_CONFIG, getMaxCameraX, getMinCameraX, type WorldConfig } from '../config/worldConfig';

export interface CameraController {
  /** Current camera X position ref */
  cameraXRef: React.RefObject<number>;
  /** Start auto-scrolling */
  start: () => void;
  /** Pause auto-scrolling */
  pause: () => void;
  /** Resume auto-scrolling */
  resume: () => void;
  /** Jump to specific X position */
  jumpTo: (x: number) => void;
  /** Set scroll speed (pixels per second) */
  setSpeed: (speed: number) => void;
  /** Check if camera is currently running */
  isRunning: () => boolean;
}

export function useCameraController(
  worldRef: React.RefObject<HTMLDivElement | null>,
  config: WorldConfig = WORLD_CONFIG
): CameraController {
  // Camera state stored in refs to avoid re-renders
  const cameraXRef = useRef<number>(getMinCameraX(config));
  const speedRef = useRef<number>(config.camera.autoScrollSpeed);
  const isRunningRef = useRef<boolean>(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const minCameraX = getMinCameraX(config);
  const maxCameraX = getMaxCameraX(config);

  /**
   * Update the world transform based on current cameraX
   */
  const updateWorldPosition = useCallback(() => {
    if (worldRef.current) {
      worldRef.current.style.transform = `translate3d(${-cameraXRef.current}px, 0, 0)`;
    }
  }, [worldRef]);

  /**
   * Animation loop
   */
  const animate = useCallback((currentTime: number) => {
    if (!isRunningRef.current) {
      return;
    }

    // Calculate delta time
    const deltaTime = lastTimeRef.current ? (currentTime - lastTimeRef.current) / 1000 : 0;
    lastTimeRef.current = currentTime;

    // Update camera position
    cameraXRef.current += speedRef.current * deltaTime;

    // Ping-pong: reverse direction at edges (respecting edge padding)
    if (cameraXRef.current >= maxCameraX) {
      cameraXRef.current = maxCameraX;
      speedRef.current = -Math.abs(speedRef.current);
    } else if (cameraXRef.current <= minCameraX) {
      cameraXRef.current = minCameraX;
      speedRef.current = Math.abs(speedRef.current);
    }

    // Apply transform
    updateWorldPosition();

    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [minCameraX, maxCameraX, updateWorldPosition]);

  /**
   * Start the camera animation
   */
  const start = useCallback(() => {
    if (isRunningRef.current) return;
    
    isRunningRef.current = true;
    lastTimeRef.current = 0;
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [animate]);

  /**
   * Pause the camera animation
   */
  const pause = useCallback(() => {
    isRunningRef.current = false;
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  /**
   * Resume the camera animation
   */
  const resume = useCallback(() => {
    if (isRunningRef.current) return;
    start();
  }, [start]);

  /**
   * Jump to a specific X position
   */
  const jumpTo = useCallback((x: number) => {
    cameraXRef.current = Math.max(0, Math.min(x, maxCameraX));
    updateWorldPosition();
  }, [maxCameraX, updateWorldPosition]);

  /**
   * Set the scroll speed
   */
  const setSpeed = useCallback((speed: number) => {
    speedRef.current = speed;
  }, []);

  /**
   * Check if camera is currently running
   */
  const isRunning = useCallback(() => {
    return isRunningRef.current;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    cameraXRef,
    start,
    pause,
    resume,
    jumpTo,
    setSpeed,
    isRunning,
  };
}
