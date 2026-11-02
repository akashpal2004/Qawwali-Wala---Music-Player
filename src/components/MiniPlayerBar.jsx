import React from 'react';
import { Play, Pause, Heart } from 'lucide-react';

export default function MiniPlayerBar({
  activeTrack,
  isPlaying,
  onTogglePlay,
  onMaximize,
  isFavorite,
  onToggleFavorite,
  showOnDesktop = false,
  isAuthenticated = false,
}) {
  if (!activeTrack) return null;
  if (isAuthenticated && activeTrack.isDemo) return null;

  const currentTitle = activeTrack.title || 'Tere Ishq Nachaya';
  const currentArtist = activeTrack.artist && activeTrack.artist !== 'Google Drive'
    ? activeTrack.artist
    : (activeTrack.title || 'Ustad Nusrat Fateh Ali Khan');
  const currentCover = activeTrack.cover || '/nusrat-all-songs.jpg';

  return (
    <aside
      className={`qw-mobile-bottom-bar ${showOnDesktop ? 'qw-show-desktop' : ''}`}
      aria-label="Now Playing Mini Bar"
      onClick={onMaximize}
    >
      <div className="qw-mini-bar-inner">
        {/* Left: Thumbnail & Info */}
        <div className="qw-mini-left">
          <img
            src={currentCover}
            alt={currentTitle}
            className="qw-mini-thumb"
            onError={(e) => {
              e.target.src = '/nusrat-all-songs.jpg';
            }}
          />
          <div className="qw-mini-text">
            <span className="qw-mini-title">{currentTitle}</span>
            <span className="qw-mini-artist">{currentArtist}</span>
          </div>
        </div>

        {/* Right: Heart & Play / Pause Button */}
        <div className="qw-mini-right" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className={`qw-mini-icon-btn ${isFavorite ? 'favorited' : ''}`}
            onClick={() => onToggleFavorite && onToggleFavorite(activeTrack.id)}
            title={isFavorite ? 'Remove Favorite' : 'Add Favorite'}
            aria-label="Favorite"
          >
            <Heart
              size={18}
              fill={isFavorite ? '#D9A85B' : 'none'}
              stroke={isFavorite ? '#D9A85B' : 'currentColor'}
            />
          </button>

          <button
            type="button"
            className="qw-mini-play-btn"
            onClick={onTogglePlay}
            title={isPlaying ? 'Pause' : 'Play'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause size={18} />
            ) : (
              <Play size={18} className="play-icon-offset" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
