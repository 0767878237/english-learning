import React from 'react';
import './AudioPlayer.css';
import type { AudioTrackKind } from '../types';

type TrackProps = {
  kind: AudioTrackKind;
  title: string;
  accent: 'ai' | 'user';
  src?: string;
  disabledReason?: string;
};

const AudioTrackPanel: React.FC<TrackProps> = ({ kind, title, accent, src, disabledReason }) => {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [duration, setDuration] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime || 0);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleReplay = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    void audioRef.current.play();
  };

  const hasSource = Boolean(src);
  const isDisabled = !hasSource;

  return (
    <div className={`audio-track audio-track--${accent}`} data-kind={kind}>
      <div className="audio-track__header">
        <div className="audio-track__title-group">
          <div className="audio-track__badge">{accent === 'ai' ? 'AI' : 'User'}</div>
          <h3 className="audio-track__title">{title}</h3>
        </div>
        <button
          type="button"
          className="audio-track__replay-btn"
          onClick={handleReplay}
          disabled={isDisabled}
        >
          Phát lại
        </button>
      </div>

      <div className="audio-track__body">
        {hasSource ? (
          <>
            <audio
              ref={audioRef}
              className="audio-track__element"
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
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
                value={Number.isFinite(currentTime) ? currentTime : 0}
                onChange={handleSliderChange}
              />
            </div>
          </>
        ) : (
          <div className="audio-track__empty">
            {disabledReason ?? 'Chưa có audio để phát.'}
          </div>
        )}
      </div>
    </div>
  );
};

const formatTime = (value: number): string => {
  if (!Number.isFinite(value) || value <= 0) return '0:00';
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const AudioPlayer: React.FC = () => {
  // Tạm thời: AI dùng sample audio, User chưa có nguồn (sẽ nối pipeline sau)
  const aiSrc = 'sample-audio.mp3';
  const userSrc: string | undefined = undefined;

  return (
    <div className="audio-player">
      <h2 className="audio-player__heading">Audio giao tiếp</h2>
      <div className="audio-player__grid">
        <AudioTrackPanel
          kind="ai"
          title="AI Audio"
          accent="ai"
          src={aiSrc}
          disabledReason="Chưa có audio từ AI."
        />
        <AudioTrackPanel
          kind="user"
          title="User Audio"
          accent="user"
          src={userSrc}
          disabledReason="Chưa có ghi âm từ người dùng."
        />
      </div>
    </div>
  );
};

export default AudioPlayer;