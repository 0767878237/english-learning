import React from 'react';
import TaskBar from './components/TaskBar';
import ClassLevel from './components/ClassLevel';
import AudioPlayer from './components/AudioPlayer';
import ChatHistory from './components/ChatHistory';
import './App.css';

function App() {
  return (
    <div className="App">
      <TaskBar />
      <ClassLevel />
      <AudioPlayer />
      <ChatHistory />
    </div>
  );
}

export default App;

