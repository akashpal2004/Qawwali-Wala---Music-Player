import React, { useState, useMemo } from 'react';
import {
  Play,
  Pause,
  Heart,
  MoreVertical,
  ChevronDown,
  RefreshCw,
  FolderOpen,
  FileAudio,
  Check,
  Loader2,
} from 'lucide-react';
import { formatTime } from '../utils/formatters';

export default function TrackList({
  tracks = [],
  activeTrack,
  isPlaying,
  isLoadingTracks,
  isBuffering: _isBuffering,
  error,
  isAuthenticated = false,
  onSelectTrack,
  onTogglePlay,
  onRefresh,
  onLogin: _onLogin,
  onOpenLocations,
  activeLocationName: _activeLocationName,
  searchQuery = '',
  favorites = new Set(),
  onToggleFavorite,
}) {
  // Category / Artist filter tag
  const [selectedTag, setSelectedTag] = useState('All');
  // Sort order: 'default' | 'title' | 'artist' | 'duration'
  const [sortBy, setSortBy] = useState('default');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  // Context menu for track options
  const [activeMenuTrackId, setActiveMenuTrackId] = useState(null);

  // Filter tags list inspired by the reference design
  const filterTags = [
    { id: 'All', label: 'All' },
    { id: 'Nusrat Fateh Ali Khan', label: 'Nusrat Fateh Ali Khan' },
    { id: 'Sabri Brothers', label: 'Sabri Brothers' },
    { id: 'Modern Qawwals', label: 'Modern Qawwals' },
    { id: 'Favorites', label: 'Favorites' },
  ];

  // Process tracks with search, category filtering, and sorting
  const filteredAndSortedTracks = useMemo(() => {
    let result = [...tracks];

    // 1. Text search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((t) => {
        const titleMatch = t.title?.toLowerCase().includes(q);
        const artistMatch = t.artist?.toLowerCase().includes(q);
        const albumMatch = t.album?.toLowerCase().includes(q);
        const nameMatch = t.name?.toLowerCase().includes(q);
        return titleMatch || artistMatch || albumMatch || nameMatch;
      });
    }

    // 2. Category / Filter tag
    if (selectedTag === 'Favorites') {
      result = result.filter((t) => favorites.has(t.id));
    } else if (selectedTag === 'Nusrat Fateh Ali Khan') {
      result = result.filter((t) =>
        t.artist?.toLowerCase().includes('nusrat') ||
        t.title?.toLowerCase().includes('nusrat')
      );
    } else if (selectedTag === 'Sabri Brothers') {
      result = result.filter((t) =>
        t.artist?.toLowerCase().includes('sabri') ||
        t.title?.toLowerCase().includes('sabri')
      );
    } else if (selectedTag === 'Modern Qawwals') {
      result = result.filter(
        (t) =>
          !t.artist?.toLowerCase().includes('nusrat') &&
          !t.title?.toLowerCase().includes('nusrat') &&
          !t.artist?.toLowerCase().includes('sabri') &&
          !t.title?.toLowerCase().includes('sabri')
      );
    }

    // 3. Sorting
    if (sortBy === 'title') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'artist') {
      result.sort((a, b) => (a.artist || '').localeCompare(b.artist || ''));
    } else if (sortBy === 'duration') {
      result.sort((a, b) => (b.duration || 0) - (a.duration || 0));
    }

    return result;
  }, [tracks, searchQuery, selectedTag, sortBy, favorites]);

  const handleRowClick = (track) => {
    if (activeTrack?.id === track.id) {
      onTogglePlay();
    } else {
      onSelectTrack(track);
    }
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case 'title':
        return 'Title';
      case 'artist':
        return 'Artist';
      case 'duration':
        return 'Duration';
      default:
        return 'Default';
    }
  };

  return (
    <section className="qw-songs-section" aria-label="All Songs Library">
      <div className="qw-songs-container">
        {/* Section Header: Title on Left, Sort by on Right */}
        <div className="qw-songs-header">
          <div className="qw-songs-title-wrap">
            <h2 className="qw-songs-title">
              All Songs
            </h2>
            <span className="qw-songs-total-count">
              ({isLoadingTracks ? 'Scanning...' : filteredAndSortedTracks.length})
            </span>
          </div>

          <div className="qw-songs-header-actions">
            {/* Sort by Dropdown */}
            <div className="qw-sort-dropdown-wrap">
              <button
                type="button"
                className="qw-sort-trigger-btn"
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                aria-expanded={isSortDropdownOpen}
              >
                <span className="qw-sort-label">Sort by:</span>
                <span className="qw-sort-val">{getSortLabel()}</span>
                <ChevronDown size={14} className="qw-sort-arrow" />
              </button>

              {isSortDropdownOpen && (
                <div className="qw-sort-menu" role="menu">
                  <button
                    type="button"
                    className={`qw-sort-option ${sortBy === 'default' ? 'active' : ''}`}
                    onClick={() => {
                      setSortBy('default');
                      setIsSortDropdownOpen(false);
                    }}
                  >
                    <span>Default</span>
                    {sortBy === 'default' && <Check size={14} />}
                  </button>
                  <button
                    type="button"
                    className={`qw-sort-option ${sortBy === 'title' ? 'active' : ''}`}
                    onClick={() => {
                      setSortBy('title');
                      setIsSortDropdownOpen(false);
                    }}
                  >
                    <span>Title (A-Z)</span>
                    {sortBy === 'title' && <Check size={14} />}
                  </button>
                  <button
                    type="button"
                    className={`qw-sort-option ${sortBy === 'artist' ? 'active' : ''}`}
                    onClick={() => {
                      setSortBy('artist');
                      setIsSortDropdownOpen(false);
                    }}
                  >
                    <span>Artist Name</span>
                    {sortBy === 'artist' && <Check size={14} />}
                  </button>
                  <button
                    type="button"
                    className={`qw-sort-option ${sortBy === 'duration' ? 'active' : ''}`}
                    onClick={() => {
                      setSortBy('duration');
                      setIsSortDropdownOpen(false);
                    }}
                  >
                    <span>Duration</span>
                    {sortBy === 'duration' && <Check size={14} />}
                  </button>
                </div>
              )}
            </div>

            {/* Refresh Google Drive tracks button if drive available */}
            {onRefresh && (
              <button
                type="button"
                className="qw-btn-icon-subtle"
                onClick={onRefresh}
                disabled={isLoadingTracks}
                title="Refresh library"
                aria-label="Refresh library"
              >
                <RefreshCw size={15} className={isLoadingTracks ? 'spin-fast' : ''} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Tags / Pills Row (matching reference image) */}
        <div className="qw-filter-pills-row" role="tablist">
          {filterTags.map((tag) => {
            const isActive = selectedTag === tag.id;
            return (
              <button
                key={tag.id}
                type="button"
                className={`qw-filter-pill ${isActive ? 'active-pill' : ''}`}
                onClick={() => setSelectedTag(tag.id)}
                role="tab"
                aria-selected={isActive}
              >
                {tag.label}
              </button>
            );
          })}
        </div>

        {/* Prominent Drive Loading Indicator */}
        {isLoadingTracks && (
          <div className="qw-loading-drive-box">
            <Loader2 size={36} className="spin-fast text-gold" />
            <div className="qw-loading-drive-info">
              <h3 className="qw-loading-drive-title">
                {isAuthenticated ? 'Connecting to Google Drive...' : 'Scanning audio library...'}
              </h3>
              <p className="qw-loading-drive-subtitle">
                Scanning your folder for audio tracks. Please wait a moment...
              </p>
            </div>
          </div>
        )}

        {/* Library Scan Error Notice */}
        {error && !isLoadingTracks && (
          <div className="qw-notice-banner">
            <span>{error}</span>
            <div className="qw-notice-actions">
              {onRefresh && (
                <button type="button" className="qw-btn-notice-retry" onClick={onRefresh}>
                  Retry
                </button>
              )}
              {onOpenLocations && (
                <button type="button" className="qw-btn-notice-retry" onClick={onOpenLocations}>
                  Switch Folder
                </button>
              )}
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoadingTracks && (
          <div className="qw-skeleton-list">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="qw-skeleton-row">
                <div className="qw-skeleton-thumb" />
                <div className="qw-skeleton-lines">
                  <div className="qw-skeleton-line short" />
                  <div className="qw-skeleton-line long" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoadingTracks && filteredAndSortedTracks.length === 0 && (
          <div className="qw-empty-state">
            <FileAudio size={42} className="qw-empty-icon" />
            <h3 className="qw-empty-title">
              {error ? 'Unable to Load Songs' : 'No Audio Files Found'}
            </h3>
            <p className="qw-empty-desc">
              {error
                ? error
                : searchQuery
                ? `No results matching "${searchQuery}".`
                : selectedTag === 'Favorites'
                ? 'You have not added any Qawwalis to your favorites yet. Click the heart icon on any song to add it here.'
                : isAuthenticated
                ? 'Your connected Google Drive folder does not contain any audio files (.mp3, .wav, .m4a) yet. Please upload songs to the folder or switch to another folder.'
                : 'No tracks available in this category.'}
            </p>
            <div className="qw-empty-actions">
              {selectedTag === 'Favorites' && (
                <button
                  type="button"
                  className="qw-btn-gold-sm"
                  onClick={() => setSelectedTag('All')}
                >
                  Show All Songs
                </button>
              )}
              {onRefresh && (
                <button
                  type="button"
                  className="qw-btn-gold-sm"
                  onClick={onRefresh}
                >
                  <RefreshCw size={14} />
                  <span>Retry Scanning</span>
                </button>
              )}
              {onOpenLocations && (
                <button
                  type="button"
                  className="qw-btn-subtle-sm"
                  onClick={onOpenLocations}
                >
                  <FolderOpen size={14} />
                  <span>Switch Drive Folder</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Playlist Rows (Matching Reference Mockup) */}
        {!isLoadingTracks && filteredAndSortedTracks.length > 0 && (
          <div className="qw-playlist-list" role="list">
            {filteredAndSortedTracks.map((track) => {
              const isActive = activeTrack?.id === track.id;
              const isThisPlaying = isActive && isPlaying;
              const isFav = favorites.has(track.id);
              const durationFormatted = formatTime(track.duration || 360);
              const trackCover = track.cover || '/nusrat-all-songs.jpg';
              const albumName = track.album || track.genre || 'The Legend';
              const displayArtist = track.artist && track.artist !== 'Google Drive' ? track.artist : track.title;

              return (
                <div
                  key={track.id}
                  className={`qw-song-row ${isActive ? 'is-active-row' : ''}`}
                  onClick={() => handleRowClick(track)}
                  role="listitem"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleRowClick(track);
                    }
                  }}
                >
                  {/* Left Indicator: Animated Equalizer when playing */}
                  <div className="qw-row-indicator">
                    {isActive ? (
                      isThisPlaying ? (
                        <div className="qw-row-equalizer" title="Playing">
                          <span className="row-bar rb-1" />
                          <span className="row-bar rb-2" />
                          <span className="row-bar rb-3" />
                        </div>
                      ) : (
                        <div className="qw-row-paused-dot" title="Paused" />
                      )
                    ) : null}
                  </div>

                  {/* Thumbnail Artwork */}
                  <div className="qw-row-thumb-wrap">
                    <img
                      src={trackCover}
                      alt=""
                      className="qw-row-thumb"
                      onError={(e) => {
                        e.target.src = '/nusrat-all-songs.jpg';
                      }}
                    />
                  </div>

                  {/* Song Title & Artist */}
                  <div className="qw-row-info">
                    <span className={`qw-row-title ${isActive ? 'active-text-gold' : ''}`}>
                      {track.title}
                    </span>
                    <span className="qw-row-artist">{displayArtist}</span>
                  </div>

                  {/* Album Name (Desktop) */}
                  <div className="qw-row-album">
                    <span className="qw-album-text">{albumName}</span>
                  </div>

                  {/* Song Duration */}
                  <div className="qw-row-duration">
                    <span>{durationFormatted}</span>
                  </div>

                  {/* Favorite / Heart Button */}
                  <div
                    className="qw-row-fav"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onToggleFavorite) onToggleFavorite(track.id);
                    }}
                  >
                    <button
                      type="button"
                      className={`qw-row-icon-btn ${isFav ? 'favorited' : ''}`}
                      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart
                        size={17}
                        fill={isFav ? '#D9A85B' : 'none'}
                        stroke={isFav ? '#D9A85B' : 'currentColor'}
                      />
                    </button>
                  </div>

                  {/* More Options / Three Dots */}
                  <div
                    className="qw-row-more"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuTrackId(
                        activeMenuTrackId === track.id ? null : track.id
                      );
                    }}
                  >
                    <button
                      type="button"
                      className="qw-row-icon-btn"
                      title="More options"
                      aria-label="More options"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {activeMenuTrackId === track.id && (
                      <div
                        className="qw-track-popup-menu"
                        onClick={(e) => e.stopPropagation()}
                        role="menu"
                      >
                        <button
                          type="button"
                          className="qw-popup-btn"
                          onClick={() => {
                            setActiveMenuTrackId(null);
                            onSelectTrack(track);
                          }}
                        >
                          Play Now
                        </button>
                        <button
                          type="button"
                          className="qw-popup-btn"
                          onClick={() => {
                            setActiveMenuTrackId(null);
                            if (onToggleFavorite) onToggleFavorite(track.id);
                          }}
                        >
                          {isFav ? 'Remove Favorite' : 'Add Favorite'}
                        </button>
                        {track.formattedSize && (
                          <div className="qw-popup-info">
                            Size: {track.formattedSize}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Circular Play / Pause Button on Right Edge */}
                  <div
                    className="qw-row-play-action"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRowClick(track);
                    }}
                  >
                    <button
                      type="button"
                      className={`qw-row-play-btn ${isActive ? 'is-active-btn' : ''}`}
                      title={isThisPlaying ? 'Pause' : 'Play'}
                      aria-label={isThisPlaying ? 'Pause' : 'Play'}
                    >
                      {isThisPlaying ? (
                        <Pause size={15} />
                      ) : (
                        <Play size={15} className="play-icon-offset" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
