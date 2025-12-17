/**
 * PhyCom Playground - Main App Component
 */

import { useDraws } from './hooks/useDraws';
import { StatusBar } from './components/StatusBar';
import { Board } from './components/Board';
import './App.css';

function App() {
  const { draws, connectionStatus, triggerRebuild } = useDraws();

  return (
    <div className="app">
      <StatusBar
        connectionStatus={connectionStatus}
        drawCount={draws.length}
        onRebuild={triggerRebuild}
      />
      <Board draws={draws} />
    </div>
  );
}

export default App;
