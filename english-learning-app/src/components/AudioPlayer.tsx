import React from 'react';
import './AudioPlayer.css';
import type { AudioTrackKind } from '../types';

const MAX_AUDIO_SECONDS = 300;

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

const formatTime = (v: number) => {
  const m = Math.floor(v / 60);
  const s = Math.floor(v % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
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
      setDuration(Math.min(audioRef.current.duration || 0, MAX_AUDIO_SECONDS));
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const time = audioRef.current.currentTime;
    if (time >= MAX_AUDIO_SECONDS) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    setCurrentTime(Math.min(time, MAX_AUDIO_SECONDS));
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !src) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      void audioRef.current.play();
    }
  };

  const seekBy = (delta: number) => {
    if (!audioRef.current) return;
    const target = Math.min(
      Math.max(audioRef.current.currentTime + delta, 0),
      Math.min(duration, MAX_AUDIO_SECONDS),
    );
    audioRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const next = !isMuted;
    audioRef.current.muted = next;
    setIsMuted(next);
  };

  const handleReplay = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    void audioRef.current.play();
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = Number(e.target.value);
    const target = Math.min(Math.max(raw, 0), Math.min(duration, MAX_AUDIO_SECONDS));
    if (!audioRef.current) return;
    audioRef.current.currentTime = target;
    setCurrentTime(target);
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
          <button type="button" className="audio-track__seek-btn" onClick={() => seekBy(-5)} disabled={!hasSource}>
            -5s
          </button>
          <button type="button" className="audio-track__mute-btn" onClick={togglePlayPause} disabled={!hasSource}>
            {isPlaying ? 'Tạm dừng' : 'Nghe lại'}
          </button>
          <button type="button" className="audio-track__seek-btn" onClick={() => seekBy(5)} disabled={!hasSource}>
            +5s
          </button>
          <button
            type="button"
            className={`audio-track__mute-btn ${isMuted ? 'is-muted' : ''}`}
            onClick={toggleMute}
            disabled={!hasSource}
          >
            {isMuted ? 'Loa: Tắt' : 'Loa: Bật'}
          </button>
          <button type="button" className="audio-track__replay-btn" onClick={handleReplay} disabled={!hasSource}>
            ↺
          </button>
        </div>
      </div>

      <div className="audio-track__body">
        {isRecording ? (
          <div className="audio-track__empty audio-track__empty--recording">
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
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={currentTime}
                onChange={handleSliderChange}
              />
            </div>
          </>
        ) : (
          <div className="audio-track__empty">{disabledReason ?? 'Chưa có dữ liệu.'}</div>
        )}
      </div>
    </div>
  );
};

const AudioPlayer: React.FC = () => {
  const [userAudios, setUserAudios] = React.useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState<number>(-1);
  const [isRecording, setIsRecording] = React.useState(false);
  const [isPausedRecording, setIsPausedRecording] = React.useState(false);
  const [recordingTimer, setRecordingTimer] = React.useState(0);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);
  const recordChunksRef = React.useRef<BlobPart[]>([]);
  const userAudiosRef = React.useRef<string[]>([]);

  React.useEffect(() => {
    userAudiosRef.current = userAudios;
  }, [userAudios]);

  React.useEffect(() => {
    let interval: number | undefined;
    if (isRecording && !isPausedRecording) {
      interval = window.setInterval(() => {
        setRecordingTimer((prev) => {
          if (prev >= MAX_AUDIO_SECONDS - 1) {
            stopRecording();
            return MAX_AUDIO_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, [isRecording, isPausedRecording]);

  React.useEffect(() => {
    return () => {
      userAudiosRef.current.forEach((url) => URL.revokeObjectURL(url));
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    setRecordingTimer(0);
    setIsRecording(true);
    setIsPausedRecording(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recordChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const url = URL.createObjectURL(new Blob(recordChunksRef.current, { type: 'audio/webm' }));
        setUserAudios((prev) => {
          const next = [...prev, url];
          setCurrentIndex(next.length - 1);
          return next;
        });
        setIsRecording(false);
        setIsPausedRecording(false);
        mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      };

      recorder.start();
    } catch {
      setIsRecording(false);
      setIsPausedRecording(false);
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
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
    if (currentIndex >= nextList.length) {
      setCurrentIndex(nextList.length - 1);
    }
  };

  return (
    <div className="audio-player">
      <h2 className="audio-player__heading">Audio giao tiếp</h2>
      <div className="audio-player__grid">
        <AudioTrackPanel
          kind="ai"
          title="AI Phản hồi"
          accent="ai"
          src={undefined}
          disabledReason="Chưa có audio từ AI model."
        />

        <div className="audio-player__user-stack">
          <AudioTrackPanel
            kind="user"
            title={currentIndex !== -1 ? `Bản ghi #${currentIndex + 1}` : 'User Audio'}
            accent="user"
            src={userAudios[currentIndex]}
            isRecording={isRecording}
            recordingTimer={recordingTimer}
            headerActions={
              <div className="audio-track__record-actions">
                {isRecording && (
                  <button
                    className="audio-track__seek-btn audio-track__seek-btn--recording"
                    onClick={togglePauseRecording}
                  >
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
            <div className="audio-track audio-track--history">
              <div
                className="audio-track__header audio-track__header--clickable"
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              >
                <div className="audio-track__title audio-track__title--history">
                  DANH SÁCH ({userAudios.length}) {isHistoryOpen ? '▲' : '▼'}
                </div>
              </div>
              {isHistoryOpen && (
                <div className="audio-track__history-list">
                  {userAudios.map((_, idx) => (
                    <div key={idx} className="audio-track__history-row">
                      <button
                        className={`audio-track__seek-btn ${currentIndex === idx ? 'audio-track__seek-btn--active' : ''}`}
                        onClick={() => setCurrentIndex(idx)}
                      >
                        Bản ghi {idx + 1}
                      </button>
                      <button className="audio-track__seek-btn audio-track__seek-btn--danger" onClick={(e) => deleteAudio(e, idx)}>
                        Xóa
                      </button>
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