import React from 'react';
import TaskBar from './components/TaskBar';
import AudioPlayer from './components/AudioPlayer';
import ChatHistory from './components/ChatHistory';
import './App.css';
import type { VstepLevel } from './types';

function App() {
  const [selectedLevel, setSelectedLevel] = React.useState<VstepLevel>('A1');

  return (
    <div className="App">
      <TaskBar selectedLevel={selectedLevel} onSelectLevel={setSelectedLevel} />
      <AudioPlayer />
      <ChatHistory />
    </div>
  );
}

export default App;

