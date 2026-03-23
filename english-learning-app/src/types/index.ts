// types/index.ts
export interface VoiceData {
  blob: Blob;
  transcript: string;
}

export interface ChatMessage {
  id: number;
  text: string;
  timestamp: Date;
  speaker: 'ai' | 'user';
}

export type AudioTrackKind = 'ai' | 'user';

export interface AudioSource {
  url?: string;
  blob?: Blob;
  mimeType?: string;
}

export interface AudioTrackState {
  kind: AudioTrackKind;
  source?: AudioSource;
  isReady: boolean;
  durationSec: number;
  currentTimeSec: number;
  error?: string;
}

export type VstepLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export const VSTEP_LEVELS: VstepLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export interface ClassLevel {
  level: VstepLevel;
  progress: number;
}

// Auth Types
export interface User {
  id: string;
  username: string;
  email?: string;
  createdAt: Date;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error?: string;
}