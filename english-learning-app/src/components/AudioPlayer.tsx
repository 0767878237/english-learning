import React from 'react';
import './AudioPlayer.css';
import type { AudioTrackKind } from '../types';

type TrackProps = {
  kind: AudioTrackKind;
  title: string;
  accent: 'ai' | 'user';
  src?: string;
  isRecording?: boolean;
  recordingTimer?: number;
  disabledReason?: string;
  headerActions?: React.ReactNode;
};

const AudioTrackPanel: React.FC<TrackProps> = ({
  kind,
  title,
  accent,
  src,
  isRecording,
  recordingTimer = 0,
  disabledReason,
  headerActions,
}) => {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [duration, setDuration] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);

  // Reset khi đổi track hoặc ghi âm mới
  React.useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
    }
  }, [src, isRecording]);

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(Math.min(audioRef.current.duration || 0, 300));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      if (time >= 300) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      setCurrentTime(Math.min(time, 300));
    }
  };

  // Các hàm điều khiển Player
  const togglePlayPause = () => {
    if (!audioRef.current || !src) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
  };

  const seekBy = (delta: number) => {
    if (audioRef.current) {
      const target = Math.min(Math.max(audioRef.current.currentTime + delta, 0), duration);
      audioRef.current.currentTime = target;
      setCurrentTime(target);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const newMuteState = !isMuted;
      audioRef.current.muted = newMuteState;
      setIsMuted(newMuteState);
    }
  };

  const handleReplay = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = raw;
      setCurrentTime(raw);
    }
  };

  const hasSource = Boolean(src) && !isRecording;

  return (
    <div className={`audio-track audio-track--${accent}`} data-kind={kind}>
      <div className="audio-track__header">
        <div className="audio-track__title-group">
          <div className="audio-track__badge">{accent === 'ai' ? 'AI' : 'User'}</div>
          <h3 className="audio-track__title">{title}</h3>
        </div>
        
        <div className="audio-track__actions">
          {headerActions}
          
          {/* Cụm nút điều khiển nghe lại */}
          <button type="button" className="audio-track__seek-btn" onClick={() => seekBy(-5)} disabled={!hasSource}>-5s</button>
          
          <button 
            type="button" 
            className="audio-track__mute-btn" 
            onClick={togglePlayPause} 
            disabled={!hasSource}
            style={{ minWidth: '85px' }}
          >
            {isPlaying ? 'Tạm dừng' : 'Nghe lại'}
          </button>

          <button type="button" className="audio-track__seek-btn" onClick={() => seekBy(5)} disabled={!hasSource}>+5s</button>
          
          <button 
            type="button" 
            className="audio-track__mute-btn" 
            onClick={toggleMute} 
            disabled={!hasSource}
            style={{ background: isMuted ? '#ef4444' : '#111827' }}
          >
            {isMuted ? 'Loa: Tắt' : 'Loa: Bật'}
          </button>

          <button type="button" className="audio-track__replay-btn" onClick={handleReplay} disabled={!hasSource}>↺</button>
        </div>
      </div>

      <div className="audio-track__body">
        {isRecording ? (
          <div className="audio-track__empty" style={{ color: '#ef4444', fontWeight: '700', border: '1px solid #fee2e2' }}>
            🔴 ĐANG GHI: {formatTime(recordingTimer)} / 5:00
          </div>
        ) : hasSource ? (
          <>
            <audio 
              ref={audioRef} 
              onLoadedMetadata={handleLoadedMetadata} 
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            >
              <source src={src} />
            </audio>
            <div className="audio-track__slider-row">
              <span className="audio-track__time">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <input type="range" min={0} max={duration || 0} step={0.1} value={currentTime} onChange={handleSliderChange} />
            </div>
          </>
        ) : (
          <div className="audio-track__empty">{disabledReason ?? 'Chưa có dữ liệu.'}</div>
        )}
      </div>
    </div>
  );
};

const formatTime = (v: number) => {
  const m = Math.floor(v / 60);
  const s = Math.floor(v % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const AudioPlayer: React.FC = () => {
  const [userAudios, setUserAudios] = React.useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState<number>(-1);
  const [isRecording, setIsRecording] = React.useState(false);
  const [isPausedRecording, setIsPausedRecording] = React.useState(false);
  const [recordingTimer, setRecordingTimer] = React.useState(0);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
  
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const recordChunksRef = React.useRef<BlobPart[]>([]);

  // Giới hạn 300s tự ngưng khi ghi
  React.useEffect(() => {
    let interval: number;
    if (isRecording && !isPausedRecording) {
      interval = window.setInterval(() => {
        setRecordingTimer((prev) => {
          if (prev >= 299) {
            stopRecording();
            return 300;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPausedRecording]);

  const startRecording = async () => {
    setRecordingTimer(0);
    setIsRecording(true);
    setIsPausedRecording(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recordChunksRef.current = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && recordChunksRef.current.push(e.data);
      recorder.onstop = () => {
        const url = URL.createObjectURL(new Blob(recordChunksRef.current, { type: 'audio/webm' }));
        setUserAudios(prev => [...prev, url]);
        setCurrentIndex(userAudios.length);
        setIsRecording(false);
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
    } catch { setIsRecording(false); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop();
    }
  };

  const togglePauseRecording = () => {
    if (!mediaRecorderRef.current) return;
    if (isPausedRecording) {
      mediaRecorderRef.current.resume();
      setIsPausedRecording(false);
    } else {
      mediaRecorderRef.current.pause();
      setIsPausedRecording(true);
    }
  };

  const deleteAudio = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    URL.revokeObjectURL(userAudios[idx]);
    const nextList = userAudios.filter((_, i) => i !== idx);
    setUserAudios(nextList);
    if (currentIndex >= nextList.length) setCurrentIndex(nextList.length - 1);
  };

  return (
    <div className="audio-player">
      <h2 className="audio-player__heading">Audio giao tiếp</h2>
      <div className="audio-player__grid">
        <AudioTrackPanel kind="ai" title="AI Phản hồi" accent="ai" src="sample.mp3" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <AudioTrackPanel
            kind="user"
            title={currentIndex !== -1 ? `Bản ghi #${currentIndex + 1}` : "User Audio"}
            accent="user"
            src={userAudios[currentIndex]}
            isRecording={isRecording}
            recordingTimer={recordingTimer}
            headerActions={
              <div style={{ display: 'flex', gap: '4px' }}>
                {isRecording && (
                  <button className="audio-track__seek-btn" onClick={togglePauseRecording} style={{ borderColor: '#6610f2' }}>
                    {isPausedRecording ? 'Tiếp tục ghi' : 'Tạm dừng ghi'}
                  </button>
                )}
                <button 
                  className={`audio-track__record-btn ${isRecording ? 'is-recording' : ''}`}
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  {isRecording ? 'Lưu' : 'Ghi âm mới'}
                </button>
              </div>
            }
          />

          {userAudios.length > 0 && (
            <div className="audio-track" style={{ background: '#fff' }}>
              <div className="audio-track__header" style={{ cursor: 'pointer' }} onClick={() => setIsHistoryOpen(!isHistoryOpen)}>
                <div className="audio-track__title" style={{ fontSize: '11px', color: '#6b7280' }}>
                  DANH SÁCH ({userAudios.length}) {isHistoryOpen ? '▲' : '▼'}
                </div>
              </div>
              {isHistoryOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', maxHeight: '160px', overflowY: 'auto' }}>
                  {userAudios.map((_, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="audio-track__seek-btn"
                        style={{
                          flex: 1, textAlign: 'left', padding: '8px', fontSize: '12px',
                          borderColor: currentIndex === idx ? '#6610f2' : '#e5e7eb',
                          background: currentIndex === idx ? 'rgba(102, 16, 242, 0.05)' : '#fff',
                        }}
                        onClick={() => setCurrentIndex(idx)}
                      >
                        Bản ghi {idx + 1}
                      </button>
                      <button className="audio-track__seek-btn" style={{ color: '#ef4444', borderColor: '#fee2e2' }} onClick={(e) => deleteAudio(e, idx)}>Xóa</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;