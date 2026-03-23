import React from 'react';
import { AudioProcessing } from '../services/AudioProcessing';
import type { ChatMessage } from '../types';

const ChatHistory: React.FC = () => {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const audioProcessing = React.useMemo(() => new AudioProcessing(), []);

  React.useEffect(() => {
    // Mock audio blobs for demonstration
    const mockAiBlob = new Blob(['mock ai audio'], { type: 'audio/webm' });
    const mockUserBlob = new Blob(['mock user audio'], { type: 'audio/webm' });

    const loadMessages = async () => {
      const aiMessages = await audioProcessing.extractChatFromAudio(mockAiBlob, 'ai');
      const userMessages = await audioProcessing.extractChatFromAudio(mockUserBlob, 'user');
      // Interleave messages based on timestamps (simple sort)
      const allMessages = [...aiMessages, ...userMessages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      setMessages(allMessages);
    };

    loadMessages();
  }, [audioProcessing]);

  return (
    <div className="chat-history">
      <h2>Chat History</h2>
      <div style={{ height: '200px', overflowY: 'scroll' }}>
        {messages.map(msg => (
          <div key={msg.id} className={`chat-message chat-message--${msg.speaker}`}>
            <strong>{msg.speaker === 'ai' ? 'AI' : 'User'}:</strong> {msg.text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatHistory;