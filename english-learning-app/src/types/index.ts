// types/index.ts
export interface VoiceData {
  blob: Blob;
  transcript: string;
}

export interface ChatMessage {
  id: number;
  text: string;
  timestamp: Date;
}

export interface ClassLevel {
  level: string;
  progress: number;
}