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

export type VstepLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export const VSTEP_LEVELS: VstepLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export interface ClassLevel {
  level: VstepLevel;
  progress: number;
}