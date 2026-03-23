import React from 'react';
import { useAuth } from './hooks/useAuth';
import TaskBar from './components/TaskBar';
import AudioPlayer from './components/AudioPlayer';
import ChatHistory from './components/ChatHistory';
import Auth from './components/Auth';
import './App.css';
import type { VstepLevel } from './types';

function AppContent() {
  const [selectedLevel, setSelectedLevel] = React.useState<VstepLevel>('A1');
  const { isLoggedIn, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="App">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Auth />;
  }

  return (
    <div className="App">
      <TaskBar selectedLevel={selectedLevel} onSelectLevel={setSelectedLevel} />
      <button
        onClick={logout}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          padding: '8px 16px',
          background: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: '600',
        }}
      >
        Đăng xuất
      </button>
      <AudioPlayer />
      <ChatHistory />
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;

