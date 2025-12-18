/**
 * Background Audio Hook
 * Handles background music with autoplay on first user interaction
 * Chrome blocks autoplay until user interacts with the page
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import backgroundSound from '../assets/background_sound.mp3';

export interface AudioController {
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Whether audio has been unlocked (user interacted) */
  isUnlocked: boolean;
  /** Play the audio */
  play: () => void;
  /** Pause the audio */
  pause: () => void;
  /** Toggle play/pause */
  toggle: () => void;
  /** Set volume (0-1) */
  setVolume: (volume: number) => void;
}

export function useBackgroundAudio(autoPlayOnInteraction = true): AudioController {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio(backgroundSound);
    audio.loop = true;
    audio.volume = 0.3; // Start at 30% volume
    audioRef.current = audio;

    // Update state when audio plays/pauses
    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsUnlocked(true);
      }).catch((err) => {
        console.log('Audio play blocked:', err.message);
      });
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  }, []);

  // Auto-play on first user interaction
  useEffect(() => {
    if (!autoPlayOnInteraction || isUnlocked) return;

    const handleInteraction = () => {
      play();
    };

    // Listen for any user interaction
    const events = ['click', 'touchstart', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, handleInteraction, { once: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleInteraction);
      });
    };
  }, [autoPlayOnInteraction, isUnlocked, play]);

  return {
    isPlaying,
    isUnlocked,
    play,
    pause,
    toggle,
    setVolume,
  };
}
