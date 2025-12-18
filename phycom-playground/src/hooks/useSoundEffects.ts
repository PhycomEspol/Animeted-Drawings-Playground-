/**
 * Sound Effects Hook
 * Handles playing short sound effects
 */

import { useRef, useCallback } from 'react';
import bubblePopSound from '../assets/bubble-pop.mp3';

export interface SFXController {
  /** Play the bubble pop sound */
  playPop: () => void;
  /** Set SFX volume (0-1) */
  setVolume: (volume: number) => void;
  /** Enable/disable SFX */
  setEnabled: (enabled: boolean) => void;
}

export function useSoundEffects(): SFXController {
  const volumeRef = useRef<number>(0.5);
  const enabledRef = useRef<boolean>(true);

  const playPop = useCallback(() => {
    if (!enabledRef.current) return;
    
    // Create a new Audio instance each time to allow overlapping sounds
    const audio = new Audio(bubblePopSound);
    audio.volume = volumeRef.current;
    audio.play().catch((err) => {
      console.log('SFX play blocked:', err.message);
    });
  }, []);

  const setVolume = useCallback((volume: number) => {
    volumeRef.current = Math.max(0, Math.min(1, volume));
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
  }, []);

  return {
    playPop,
    setVolume,
    setEnabled,
  };
}
