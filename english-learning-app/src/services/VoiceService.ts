// VoiceService.ts
export class VoiceService {
  private recognition: any = null;

  constructor() {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
    }
  }

  async recordVoice(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject('Speech recognition not supported');
        return;
      }
      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };
      this.recognition.onerror = (error: any) => reject(error);
      this.recognition.start();
    });
  }

  /**
   * Ghi âm microphone và trả về Blob audio thô để phát lại/tua.
   * Đây là API nhẹ để sau này nối vào User Audio panel.
   */
  async recordVoiceBlob(): Promise<Blob> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Media devices not supported');
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return new Promise<Blob>((resolve, reject) => {
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onerror = (e: Event) => {
        stream.getTracks().forEach((t) => t.stop());
        reject(new Error('MediaRecorder error'));
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        resolve(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }));
      };

      recorder.start();
      // Thực tế nên điều khiển start/stop từ UI; ở đây placeholder sẽ auto stop sau 5 giây.
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, 5000);
    });
  }

  generateAIVoice(text: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      const synth = window.speechSynthesis;
      const mediaRecorder = new MediaRecorder(new MediaStream());
      // Simplified: use synthesis without recording
      // For full implementation, need to capture audio
      synth.speak(utterance);
      // Placeholder: return a blob
      resolve(new Blob());
    });
  }

  compareVoices(personVoice: Blob, aiVoice: Blob): number {
    // Placeholder: compute similarity
    // Use Web Audio API to analyze
    return Math.random(); // 0-1 similarity score
  }
}