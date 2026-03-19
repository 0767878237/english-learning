// AudioProcessing.ts
export class AudioProcessing {
  async extractChatFromAudio(audioBlob: Blob): Promise<string[]> {
    // Use Whisper ASR (mock for now)
    // In real implementation, send to Whisper API
    return ['Extracted message 1', 'Extracted message 2'];
  }
}