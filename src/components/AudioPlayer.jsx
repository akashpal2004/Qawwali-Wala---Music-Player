import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Volume1,
  VolumeX,
  Repeat,
  Repeat1,
  Shuffle,
  Loader2,
  Music2,
  AlertTriangle,
} from 'lucide-react';
import { formatTime } from '../utils/formatters';

export default function AudioPlayer({
  activeTrack,
  audioSrc,
  isStreamLoading,
  streamError,
  onNext,
  onPrevious,
  hasPrevious,
  hasNext,
}) {
  const audioRef = useRef(null);

  // Playback States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  // Audio settings
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.85);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off' | 'all' | 'one'
  const [isShuffle, setIsShuffle] = useState(false);

  // When audioSrc changes (new track loaded)
  useEffect(() => {
    if (!audioRef.current) return;

    if (audioSrc) {
      audioRef.current.src = audioSrc;
      audioRef.current.load();
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('Auto-play was prevented by the browser or stream interrupted:', err);
            setIsPlaying(false);
          });
      }
    } else {
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [audioSrc]);

  // Sync volume with HTML5 audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Play / Pause toggle
  const togglePlayPause = useCallback(() => {
    if (!audioRef.current || !audioSrc) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => {
        console.error('Play failed:', err);
      });
    }
  }, [isPlaying, audioSrc]);

  // Cycle repeat modes: off -> all -> one -> off
  const cycleRepeatMode = () => {
    if (repeatMode === 'off') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('off');
  };

  // Skip Back logic: if current time > 3s, restart track; else go to previous track
  const handleSkipBack = () => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    } else if (onPrevious) {
      onPrevious(isShuffle);
    }
  };

  // Skip Forward
  const handleSkipForward = () => {
    if (onNext) {
      onNext(isShuffle);
    }
  };

  // Track Ended Handler
  const handleTrackEnded = () => {
    if (repeatMode === 'one' && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else if (repeatMode === 'all' || hasNext) {
      if (onNext) onNext(isShuffle);
    } else {
      setIsPlaying(false);
    }
  };

  // Seek bar handling
  const handleSeekChange = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
  };

  const handleSeekMouseDown = () => {
    setIsSeeking(true);
  };

  const handleSeekMouseUp = (e) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
    setIsSeeking(false);
  };

  // Volume toggles
  const handleMuteToggle = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(prevVolume || 0.5);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  // Compute progress percentage for CSS gradient
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volumePercent = isMuted ? 0 : volume * 100;

  if (!activeTrack) {
    return null;
  }

  return (
    <div className="bottom-player-bar">
      {/* Hidden HTML5 Audio element */}
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={() => {
          if (!isSeeking && audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration || 0);
          }
        }}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={handleTrackEnded}
        onError={(e) => {
          console.error('Audio playback error:', e);
          setIsBuffering(false);
          setIsPlaying(false);
        }}
      />

      <div className="player-inner">
        {/* Left: Track Information */}
        <div className="player-track-info">
          <div className="player-album-art">
            <Music2 size={24} className={isPlaying ? 'pulse-icon' : ''} />
          </div>
          <div className="player-meta-texts">
            <div className="player-title" title={activeTrack.title}>
              {activeTrack.title}
            </div>
            <div className="player-sub">
              {isStreamLoading ? (
                <span className="status-badge loading">
                  <Loader2 size={12} className="spin-fast" /> Fetching stream...
                </span>
              ) : isBuffering ? (
                <span className="status-badge buffering">
                  <Loader2 size={12} className="spin-fast" /> Buffering...
                </span>
              ) : streamError ? (
                <span className="status-badge error" title={streamError}>
                  <AlertTriangle size={12} /> Stream error
                </span>
              ) : (
                <span className="player-size">{activeTrack.formattedSize}</span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Controls & Progress */}
        <div className="player-center-controls">
          <div className="transport-buttons">
            {/* Shuffle */}
            <button
              type="button"
              className={`control-btn ${isShuffle ? 'active-toggle' : ''}`}
              onClick={() => setIsShuffle(!isShuffle)}
              title={isShuffle ? 'Shuffle enabled' : 'Shuffle disabled'}
            >
              <Shuffle size={18} />
            </button>

            {/* Previous */}
            <button
              type="button"
              className="control-btn"
              onClick={handleSkipBack}
              disabled={!hasPrevious && currentTime <= 3}
              title="Previous Track"
            >
              <SkipBack size={20} />
            </button>

            {/* Play / Pause */}
            <button
              type="button"
              className="play-pause-btn"
              onClick={togglePlayPause}
              disabled={isStreamLoading}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isStreamLoading || isBuffering ? (
                <Loader2 size={24} className="spin-fast" />
              ) : isPlaying ? (
                <Pause size={24} />
              ) : (
                <Play size={24} className="play-icon-offset" />
              )}
            </button>

            {/* Next */}
            <button
              type="button"
              className="control-btn"
              onClick={handleSkipForward}
              disabled={!hasNext && repeatMode !== 'all'}
              title="Next Track"
            >
              <SkipForward size={20} />
            </button>

            {/* Repeat */}
            <button
              type="button"
              className={`control-btn ${repeatMode !== 'off' ? 'active-toggle' : ''}`}
              onClick={cycleRepeatMode}
              title={
                repeatMode === 'one'
                  ? 'Repeat One Track'
                  : repeatMode === 'all'
                  ? 'Repeat All Tracks'
                  : 'Repeat Off'
              }
            >
              {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
            </button>
          </div>

          {/* Progress / Seek bar */}
          <div className="progress-bar-container">
            <span className="time-display">{formatTime(currentTime)}</span>
            <div className="slider-wrapper">
              <input
                type="range"
                className="progress-slider"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                onChange={handleSeekChange}
                onMouseDown={handleSeekMouseDown}
                onMouseUp={handleSeekMouseUp}
                onTouchStart={handleSeekMouseDown}
                onTouchEnd={handleSeekMouseUp}
                disabled={!audioSrc || duration === 0}
                style={{
                  background: `linear-gradient(to right, var(--color-accent) ${progressPercent}%, var(--color-slider-track) ${progressPercent}%)`,
                }}
              />
            </div>
            <span className="time-display">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Volume Controls */}
        <div className="player-right-controls">
          <button
            type="button"
            className="control-btn volume-btn"
            onClick={handleMuteToggle}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX size={20} className="text-muted" />
            ) : volume < 0.5 ? (
              <Volume1 size={20} />
            ) : (
              <Volume2 size={20} />
            )}
          </button>
          <div className="volume-slider-wrapper">
            <input
              type="range"
              className="volume-slider"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              style={{
                background: `linear-gradient(to right, var(--color-accent) ${volumePercent}%, var(--color-slider-track) ${volumePercent}%)`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
