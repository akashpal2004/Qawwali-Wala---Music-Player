import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Heart,
  Volume2,
  Volume1,
  VolumeX,
  Repeat,
  Repeat1,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { formatTime } from '../utils/formatters';
import { SUFI_MUSIC_QUOTES, getRandomQuote } from '../utils/quotes';

export default function HeroPlayer({
  activeTrack,
  isPlaying,
  isBuffering,
  isStreamLoading,
  isLoadingTracks = false,
  isAuthenticated = false,
  tracksCount = 0,
  currentTime,
  duration,
  volume,
  isMuted,
  repeatMode,
  isShuffle,
  onTogglePlay,
  onNext,
  onPrevious,
  onToggleShuffle,
  onCycleRepeat,
  onSeekChange,
  onSeekStart,
  onSeekEnd,
  onVolumeChange,
  onToggleMute,
  isFavorite = false,
  onToggleFavorite,
}) {
  const [showVolumePopup, setShowVolumePopup] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [fadeQuote, setFadeQuote] = useState(false);
  const prevTrackIdRef = useRef(activeTrack?.id);

  const currentQuote = SUFI_MUSIC_QUOTES[quoteIndex] || SUFI_MUSIC_QUOTES[0];

  // Rotate quote when active track changes
  useEffect(() => {
    if (activeTrack?.id && activeTrack.id !== prevTrackIdRef.current) {
      prevTrackIdRef.current = activeTrack.id;
      setFadeQuote(true);
      const timer = setTimeout(() => {
        const next = getRandomQuote(quoteIndex);
        setQuoteIndex(next.index);
        setFadeQuote(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [activeTrack?.id, quoteIndex]);

  // Rotate quote every 35 seconds while playing
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setFadeQuote(true);
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % SUFI_MUSIC_QUOTES.length);
        setFadeQuote(false);
      }, 250);
    }, 35000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleNextQuote = (e) => {
    e.stopPropagation();
    setFadeQuote(true);
    setTimeout(() => {
      const next = getRandomQuote(quoteIndex);
      setQuoteIndex(next.index);
      setFadeQuote(false);
    }, 200);
  };

  let currentTitle = 'Tere Ishq Nachaya';
  let currentArtist = 'Ustad Nusrat Fateh Ali Khan';
  let currentCover = '/nusrat-all-songs.jpg';

  if (isAuthenticated) {
    if (isLoadingTracks) {
      currentTitle = 'Loading Google Drive Music...';
      currentArtist = 'Scanning your folder for audio tracks...';
      currentCover = '/nusrat-all-songs.jpg';
    } else if (tracksCount === 0) {
      currentTitle = 'No Music Found in Drive Folder';
      currentArtist = 'Add MP3 files or choose another folder';
      currentCover = '/nusrat-all-songs.jpg';
    } else if (activeTrack) {
      currentTitle = activeTrack.title || 'Untitled Track';
      currentArtist = activeTrack.artist || 'Ustad Nusrat Fateh Ali Khan';
      currentCover = activeTrack.cover || '/nusrat-all-songs.jpg';
    }
  } else if (activeTrack) {
    currentTitle = activeTrack.title;
    currentArtist = activeTrack.artist;
    currentCover = activeTrack.cover || '/nusrat-all-songs.jpg';
  }

  const canPlay = !isLoadingTracks && (activeTrack !== null || !isAuthenticated) && (!isAuthenticated || tracksCount > 0);

  const trackDuration = duration || activeTrack?.duration || 372;
  const progressPercent = trackDuration > 0
    ? Math.min(100, Math.max(0, (currentTime / trackDuration) * 100))
    : 0;
  const volumePercent = isMuted ? 0 : (volume ?? 1) * 100;

  return (
    <section className="qw-hero-section" aria-label="Sufi Qawwali Hero">
      {/* Cinematic Mehfil Background Image */}
      <div className="qw-hero-bg-wrapper">
        <img
          src="/nusrat-saab.png"
          alt="Traditional Sufi Qawwali Mehfil"
          className="qw-hero-bg-img"
          onError={(e) => {
            e.target.src = '/hero-player-thumb.jpg';
          }}
        />
        {/* Subtle Dark Gradients for Readability and Depth */}
        <div className="qw-hero-vignette" />
        <div className="qw-hero-bottom-fade" />
      </div>

      {/* Hero Top-Right: Poetic Sufi Quote (Clean minimal display) */}
      <div className="qw-hero-quote-stage">
        <div className="qw-hero-quote-box">
          {/* Quote Text */}
          <p className={`qw-hero-quote-text ${fadeQuote ? 'quote-fade' : ''}`}>
            &ldquo;{currentQuote.quote}&rdquo;
          </p>

          {/* Quote Attribution & Rotation Button */}
          <div className="qw-hero-quote-footer">
            <span className="qw-hero-quote-author">— {currentQuote.author}</span>
            <button
              type="button"
              className="qw-quote-cycle-btn"
              onClick={handleNextQuote}
              title="Read another quote"
              aria-label="Next quote"
            >
              <Sparkles size={11} className="sparkle-gold" />
              <span>New Quote</span>
            </button>
          </div>
        </div>
      </div>

      {/* Minimal Music Player Controls (Overlaid on Hero) */}
      <div className="qw-hero-player-container">
        {/* Desktop Player Bar */}
        <div className="qw-hero-player-bar desktop-hero-player">
          {/* Left: Active Track Details */}
          <div className="qw-player-track-info">
            <div className="qw-player-thumb-wrap">
              <img
                src={currentCover}
                alt={currentTitle}
                className="qw-player-thumb"
                onError={(e) => {
                  e.target.src = '/hero-player-thumb.jpg';
                }}
              />
              {isPlaying && (
                <div className="qw-thumb-equalizer" title="Playing">
                  <span className="thumb-bar tb-1" />
                  <span className="thumb-bar tb-2" />
                  <span className="thumb-bar tb-3" />
                </div>
              )}
            </div>
            <div className="qw-player-meta">
              <h3 className="qw-player-title" title={currentTitle}>
                {currentTitle}
              </h3>
              <p className="qw-player-artist" title={currentArtist}>
                {currentArtist}
              </p>
            </div>
          </div>

          {/* Center: Controls & Scrub Bar */}
          <div className="qw-player-center-controls">
            {/* Buttons Row */}
            <div className="qw-transport-row">
              {/* Shuffle */}
              <button
                type="button"
                className={`qw-ctrl-btn ${isShuffle ? 'active-gold' : ''}`}
                onClick={onToggleShuffle}
                title={isShuffle ? 'Shuffle On' : 'Shuffle Off'}
                aria-label="Shuffle"
              >
                <Shuffle size={17} />
              </button>

              {/* Previous */}
              <button
                type="button"
                className="qw-ctrl-btn"
                onClick={onPrevious}
                title="Previous Track"
                aria-label="Previous Track"
              >
                <SkipBack size={19} />
              </button>

              {/* Big Circular Play / Pause Button */}
              <button
                type="button"
                className="qw-play-circle-btn"
                onClick={onTogglePlay}
                disabled={!canPlay || isStreamLoading}
                title={isPlaying ? 'Pause' : 'Play'}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isLoadingTracks || isStreamLoading || isBuffering ? (
                  <Loader2 size={22} className="spin-fast text-dark" />
                ) : isPlaying ? (
                  <Pause size={22} className="text-dark" />
                ) : (
                  <Play size={22} className="text-dark play-offset" />
                )}
              </button>

              {/* Next */}
              <button
                type="button"
                className="qw-ctrl-btn"
                onClick={onNext}
                title="Next Track"
                aria-label="Next Track"
              >
                <SkipForward size={19} />
              </button>

              {/* Repeat */}
              <button
                type="button"
                className={`qw-ctrl-btn ${repeatMode !== 'off' ? 'active-gold' : ''}`}
                onClick={onCycleRepeat}
                title={`Repeat: ${repeatMode}`}
                aria-label={`Repeat mode: ${repeatMode}`}
              >
                {repeatMode === 'one' ? <Repeat1 size={17} /> : <Repeat size={17} />}
              </button>

              {/* Favorite / Heart */}
              <button
                type="button"
                className={`qw-ctrl-btn qw-heart-btn ${isFavorite ? 'favorited' : ''}`}
                onClick={() => onToggleFavorite && onToggleFavorite(activeTrack?.id)}
                title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                aria-label="Favorite"
              >
                <Heart
                  size={17}
                  fill={isFavorite ? '#D9A85B' : 'none'}
                  stroke={isFavorite ? '#D9A85B' : 'currentColor'}
                />
              </button>

              {/* Volume Popover Toggle */}
              <div
                className="qw-volume-widget"
                onMouseEnter={() => setShowVolumePopup(true)}
                onMouseLeave={() => setShowVolumePopup(false)}
              >
                <button
                  type="button"
                  className="qw-ctrl-btn qw-volume-btn"
                  onClick={onToggleMute}
                  title={isMuted ? 'Unmute' : 'Mute'}
                  aria-label="Volume"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX size={17} />
                  ) : volume < 0.5 ? (
                    <Volume1 size={17} />
                  ) : (
                    <Volume2 size={17} />
                  )}
                </button>

                {showVolumePopup && (
                  <div className="qw-volume-popup">
                    <input
                      type="range"
                      className="qw-volume-slider"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={onVolumeChange}
                      aria-label="Volume level"
                      style={{
                        background: `linear-gradient(to right, #D9A85B ${volumePercent}%, rgba(255, 255, 255, 0.15) ${volumePercent}%)`,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Scrub / Progress Bar Row */}
            <div className="qw-progress-row">
              <span className="qw-time-label">{formatTime(currentTime)}</span>
              <div className="qw-slider-track-wrap">
                <input
                  type="range"
                  className="qw-progress-slider"
                  min="0"
                  max={trackDuration || 100}
                  step="0.1"
                  value={currentTime}
                  onChange={onSeekChange}
                  onMouseDown={onSeekStart}
                  onMouseUp={onSeekEnd}
                  onTouchStart={onSeekStart}
                  onTouchEnd={onSeekEnd}
                  aria-label="Seek track"
                  style={{
                    background: `linear-gradient(to right, #D9A85B ${progressPercent}%, rgba(255, 255, 255, 0.16) ${progressPercent}%)`,
                  }}
                />
              </div>
              <span className="qw-time-label">{formatTime(trackDuration)}</span>
            </div>
          </div>
        </div>

        {/* Mobile Player Card */}
        <div className="qw-hero-player-bar mobile-hero-player">
          {/* Song Info & Mini Equalizer */}
          <div className="qw-mobile-track-header">
            <div className="qw-mobile-track-left">
              <img
                src={currentCover}
                alt={currentTitle}
                className="qw-mobile-thumb"
                onError={(e) => {
                  e.target.src = '/hero-player-thumb.jpg';
                }}
              />
              <div className="qw-mobile-text">
                <span className="qw-mobile-title">{currentTitle}</span>
                <span className="qw-mobile-artist">{currentArtist}</span>
              </div>
            </div>

            <div className="qw-mobile-track-right">
              {isPlaying && (
                <div className="qw-thumb-equalizer-mobile">
                  <span className="thumb-bar tb-1" />
                  <span className="thumb-bar tb-2" />
                  <span className="thumb-bar tb-3" />
                </div>
              )}
              <button
                type="button"
                className={`qw-ctrl-btn qw-heart-btn ${isFavorite ? 'favorited' : ''}`}
                onClick={() => onToggleFavorite && onToggleFavorite(activeTrack?.id)}
                aria-label="Favorite"
              >
                <Heart
                  size={18}
                  fill={isFavorite ? '#D9A85B' : 'none'}
                  stroke={isFavorite ? '#D9A85B' : 'currentColor'}
                />
              </button>
            </div>
          </div>

          {/* Transport Controls */}
          <div className="qw-mobile-transport">
            <button
              type="button"
              className={`qw-ctrl-btn ${isShuffle ? 'active-gold' : ''}`}
              onClick={onToggleShuffle}
              aria-label="Shuffle"
            >
              <Shuffle size={18} />
            </button>

            <button
              type="button"
              className="qw-ctrl-btn"
              onClick={onPrevious}
              aria-label="Previous"
            >
              <SkipBack size={21} />
            </button>

            <button
              type="button"
              className="qw-play-circle-btn"
              onClick={onTogglePlay}
              disabled={!canPlay || isStreamLoading}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoadingTracks || isStreamLoading || isBuffering ? (
                <Loader2 size={24} className="spin-fast text-dark" />
              ) : isPlaying ? (
                <Pause size={24} className="text-dark" />
              ) : (
                <Play size={24} className="text-dark play-offset" />
              )}
            </button>

            <button
              type="button"
              className="qw-ctrl-btn"
              onClick={onNext}
              aria-label="Next"
            >
              <SkipForward size={21} />
            </button>

            <button
              type="button"
              className={`qw-ctrl-btn ${repeatMode !== 'off' ? 'active-gold' : ''}`}
              onClick={onCycleRepeat}
              aria-label="Repeat"
            >
              {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
            </button>
          </div>

          {/* Progress Bar & Timestamps */}
          <div className="qw-mobile-progress-wrap">
            <div className="qw-slider-track-wrap">
              <input
                type="range"
                className="qw-progress-slider"
                min="0"
                max={trackDuration || 100}
                step="0.1"
                value={currentTime}
                onChange={onSeekChange}
                onMouseDown={onSeekStart}
                onMouseUp={onSeekEnd}
                onTouchStart={onSeekStart}
                onTouchEnd={onSeekEnd}
                aria-label="Seek track"
                style={{
                  background: `linear-gradient(to right, #D9A85B ${progressPercent}%, rgba(255, 255, 255, 0.16) ${progressPercent}%)`,
                }}
              />
            </div>
            <div className="qw-mobile-time-row">
              <span className="qw-time-label">{formatTime(currentTime)}</span>
              <span className="qw-time-label">{formatTime(trackDuration)}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
