import React from 'react';

const ChatHistory: React.FC = () => {
  const messages = [
    { id: 1, text: 'Hello, how are you?' },
    { id: 2, text: 'I am fine, thank you.' },
    // Extracted from audio
  ];

  return (
    <div className="chat-history">
      <h2>Chat History</h2>
      <div style={{ height: '200px', overflowY: 'scroll' }}>
        {messages.map(msg => (
          <div key={msg.id}>{msg.text}</div>
        ))}
      </div>
    </div>
  );
};

export default ChatHistory;