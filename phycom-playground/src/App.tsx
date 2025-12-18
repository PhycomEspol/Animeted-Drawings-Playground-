/**
 * Phycom Playground - Main App Component
 */

import { useState } from 'react';
import { useDraws } from './hooks/useDraws';
import { useBackgroundAudio } from './hooks/useBackgroundAudio';
import { useSoundEffects } from './hooks/useSoundEffects';
import { Board } from './components/Board';
import './App.css';

function App() {
  const sfx = useSoundEffects();
  const { draws } = useDraws({ onNewDraw: sfx.playPop });
  const audio = useBackgroundAudio(false); // Don't auto-play, we'll trigger it manually
  const [hasStarted, setHasStarted] = useState(false);

  const handleStart = () => {
    audio.play();
    setHasStarted(true);
  };

  // Show start overlay until user clicks
  if (!hasStarted) {
    return (
      <div className="start-overlay" onClick={handleStart}>
        <div className="start-content">
          <div className="start-icon">🎨</div>
          <h1>Phycom Playground</h1>
          <p>Click anywhere to start</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Board draws={draws} />
      
      {/* Audio control button */}
      <button 
        className="audio-button"
        onClick={audio.toggle}
        title={audio.isPlaying ? 'Mute' : 'Unmute'}
      >
        {audio.isPlaying ? '🔊' : '🔇'}
      </button>
    </div>
  );
}

export default App;

