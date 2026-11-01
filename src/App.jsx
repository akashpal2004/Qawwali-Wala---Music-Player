import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Navbar from './components/Navbar';
import HeroPlayer from './components/HeroPlayer';
import TrackList from './components/TrackList';
import MiniPlayerBar from './components/MiniPlayerBar';
import DriveLocationModal from './components/DriveLocationModal';
import AboutModal from './components/AboutModal';
import { useGoogleDriveAuth } from './hooks/useGoogleDriveAuth';
import { useAudioPlayback } from './hooks/useAudioPlayback';
import { DEFAULT_DEMO_TRACKS } from './utils/demoTracks';
import {
  fetchDriveAudioFiles,
  streamTrackAudio,
  revokeAudioStream,
  extractDriveFolderId,
} from './services/driveService';
import './App.css';

const DEFAULT_LOCATIONS_KEY = 'sonic_drive_locations_v2';
const ACTIVE_LOCATION_KEY = 'sonic_active_location_id_v2';
const FAVORITES_STORAGE_KEY = 'qawwali_favorites';
const CACHED_TRACKS_KEY = 'qw_cached_drive_tracks_v1';
const ACTIVE_TRACK_ID_KEY = 'qw_active_track_id_v1';

export default function App() {
  // Navigation tabs: 'home' | 'explore' | 'library'
  const [activeTab, setActiveTab] = useState('home');

  // Search query state shared between Navbar and TrackList
  const [searchQuery, setSearchQuery] = useState('');

  // About modal visibility
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  // Favorites state persisted in localStorage
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (saved) return new Set(JSON.parse(saved));
    } catch (e) {
      console.warn('Failed to parse favorites:', e);
    }
    return new Set(['demo-tere-ishq']);
  });

  const handleToggleFavorite = useCallback((trackId) => {
    if (!trackId) return;
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...next]));
      } catch (e) {
        console.warn('Failed to save favorites:', e);
      }
      return next;
    });
  }, []);

  // Drive locations state (persisted in localStorage)
  const [locations, setLocations] = useState(() => {
    try {
      const saved = localStorage.getItem(DEFAULT_LOCATIONS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved locations:', e);
    }
    const envFolder = import.meta.env.VITE_FOLDER_ID;
    const defaultFolderId = extractDriveFolderId(envFolder || '1nx4Kh9RYMbz-oveDzui8k74t0NrjAK3w');
    return [
      {
        id: 'loc-default',
        name: 'My Drive Music',
        folderId: defaultFolderId,
        isDefault: true,
      },
      {
        id: 'loc-chill',
        name: 'Chill & Lo-Fi Lounge',
        folderId: defaultFolderId,
        isDefault: false,
      },
    ];
  });

  const [activeLocationId, setActiveLocationId] = useState(() => {
    return localStorage.getItem(ACTIVE_LOCATION_KEY) || 'loc-default';
  });

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Derive active folder ID from active location
  const activeLocation = useMemo(() => {
    return locations.find((l) => l.id === activeLocationId) || locations[0] || null;
  }, [locations, activeLocationId]);

  const activeFolderId = activeLocation?.folderId || '';

  // Google Drive Authentication
  const {
    token,
    isAuthenticated,
    isLoading: isAuthLoading,
    error: authError,
    login,
    logout,
  } = useGoogleDriveAuth();

  // Track list state (initialized from cached tracks if available)
  const [driveTracks, setDriveTracks] = useState(() => {
    try {
      const isConn = localStorage.getItem('qw_gdrive_is_connected_v1') === 'true';
      if (isConn) {
        const saved = localStorage.getItem(CACHED_TRACKS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load cached drive tracks:', e);
    }
    return [];
  });
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [tracksError, setTracksError] = useState(null);

  // Active track and audio stream state (persists user's selected track)
  const [activeTrack, setActiveTrack] = useState(() => {
    try {
      const isConn = localStorage.getItem('qw_gdrive_is_connected_v1') === 'true';
      if (isConn) {
        const savedTracks = localStorage.getItem(CACHED_TRACKS_KEY);
        if (savedTracks) {
          const parsed = JSON.parse(savedTracks);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const savedActiveId = localStorage.getItem(ACTIVE_TRACK_ID_KEY);
            const found = parsed.find((t) => t.id === savedActiveId);
            return found || parsed[0];
          }
        }
        return null;
      }
    } catch (e) {
      console.warn('Failed to load initial active track:', e);
    }
    return DEFAULT_DEMO_TRACKS[0];
  });
  const [audioSrc, setAudioSrc] = useState(null);
  const [isStreamLoading, setIsStreamLoading] = useState(false);

  // Active blob url reference for garbage collection
  const activeBlobUrlRef = useRef(null);

  // Save locations when modified
  const saveLocations = (newLocs) => {
    setLocations(newLocs);
    try {
      localStorage.setItem(DEFAULT_LOCATIONS_KEY, JSON.stringify(newLocs));
    } catch (e) {
      console.warn('Failed to save locations:', e);
    }
  };

  const handleSelectLocation = (locId) => {
    setActiveLocationId(locId);
    try {
      localStorage.setItem(ACTIVE_LOCATION_KEY, locId);
    } catch (e) {
      console.warn('Failed to save active location:', e);
    }
  };

  const handleAddLocation = ({ name, folderId }) => {
    const newLoc = {
      id: `loc-${Date.now()}`,
      name,
      folderId,
      isDefault: false,
    };
    const updated = [...locations, newLoc];
    saveLocations(updated);
    handleSelectLocation(newLoc.id);
  };

  const handleDeleteLocation = (locId) => {
    if (locations.length <= 1) return;
    const updated = locations.filter((l) => l.id !== locId);
    saveLocations(updated);
    if (activeLocationId === locId) {
      handleSelectLocation(updated[0].id);
    }
  };

  /**
   * Release object URL memory
   */
  const cleanupCurrentAudioStream = useCallback(() => {
    if (activeBlobUrlRef.current) {
      revokeAudioStream(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }
    setAudioSrc(null);
  }, []);

  useEffect(() => {
    return () => {
      cleanupCurrentAudioStream();
    };
  }, [cleanupCurrentAudioStream]);

  /**
   * Select and stream track
   */
  const handleSelectTrack = useCallback(
    async (track) => {
      if (!track) return;

      cleanupCurrentAudioStream();
      setActiveTrack(track);

      // SAFETY: If connected to Drive, NEVER allow playing any demo track or wav!
      if (isAuthenticated && track.isDemo) {
        console.warn('Blocked demo track playback while connected to Google Drive.');
        setAudioSrc(null);
        return;
      }

      if (!track.isDemo) {
        try {
          localStorage.setItem(ACTIVE_TRACK_ID_KEY, track.id);
        } catch {
          // ignore
        }
      }

      // If previewing demo track when NOT authenticated
      if (track.isDemo || track.src) {
        if (!isAuthenticated) {
          setAudioSrc(track.src || '/demo-better-days.wav');
        }
        return;
      }

      // Stream from Google Drive
      if (token) {
        setIsStreamLoading(true);
        try {
          const blobUrl = await streamTrackAudio(track.id, token);
          activeBlobUrlRef.current = blobUrl;
          setAudioSrc(blobUrl);
          setTracksError(null);
        } catch (err) {
          console.error(`Failed to stream track "${track.title}":`, err);
          setTracksError(`Failed to stream "${track.title}". Check folder permissions.`);
          setAudioSrc(null);
        } finally {
          setIsStreamLoading(false);
        }
      }
    },
    [token, isAuthenticated, cleanupCurrentAudioStream]
  );

  /**
   * Fetch tracks from Google Drive
   */
  const loadFolderTracks = useCallback(async () => {
    if (!token || !activeFolderId) return;

    setIsLoadingTracks(true);
    setTracksError(null);

    try {
      const files = await fetchDriveAudioFiles(activeFolderId, token);
      setDriveTracks(files);
      try {
        localStorage.setItem(CACHED_TRACKS_KEY, JSON.stringify(files));
      } catch (e) {
        console.warn('Failed to cache drive tracks:', e);
      }
      if (files.length === 0) {
        setTracksError('No audio files (.mp3, .wav, .m4a) found in this Google Drive folder. Please add music files to this folder.');
        setActiveTrack(null);
        cleanupCurrentAudioStream();
      } else {
        // Auto-select first Drive track if none selected or if on demo track
        if (!activeTrack || activeTrack.isDemo || !files.some((f) => f.id === activeTrack.id)) {
          handleSelectTrack(files[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching tracks from Google Drive:', err);
      setTracksError(err.message || 'Failed to retrieve tracks from Google Drive.');
      setDriveTracks([]);
      setActiveTrack(null);
      cleanupCurrentAudioStream();
    } finally {
      setIsLoadingTracks(false);
    }
  }, [token, activeFolderId, activeTrack, handleSelectTrack, cleanupCurrentAudioStream]);

  // Handle authentication state changes & folder changes
  useEffect(() => {
    if (isAuthenticated) {
      // Clear demo audio and demo track immediately when Drive is connected
      if (activeTrack?.isDemo) {
        cleanupCurrentAudioStream();
        setActiveTrack(null);
      }
      if (activeFolderId) {
        loadFolderTracks();
      }
    } else {
      // If user logs out of Drive, reset to initial demo state
      setDriveTracks([]);
      setTracksError(null);
      setActiveTrack(DEFAULT_DEMO_TRACKS[0]);
      cleanupCurrentAudioStream();
    }
  }, [isAuthenticated, activeFolderId]);

  // Combined tracks list: when connected to Drive, STRICTLY return Drive tracks (never demo tracks!)
  const currentTrackList = useMemo(() => {
    if (isAuthenticated) {
      return driveTracks;
    }
    return DEFAULT_DEMO_TRACKS;
  }, [isAuthenticated, driveTracks]);

  /**
   * Skip Next
   */
  const handleNextTrack = useCallback(
    (isShuffle = false) => {
      if (currentTrackList.length === 0) return;
      const currentIndex = currentTrackList.findIndex((t) => t.id === activeTrack?.id);

      if (isShuffle && currentTrackList.length > 1) {
        let randomIndex = Math.floor(Math.random() * currentTrackList.length);
        while (randomIndex === currentIndex) {
          randomIndex = Math.floor(Math.random() * currentTrackList.length);
        }
        handleSelectTrack(currentTrackList[randomIndex]);
        return;
      }

      const nextIndex = (currentIndex + 1) % currentTrackList.length;
      handleSelectTrack(currentTrackList[nextIndex]);
    },
    [currentTrackList, activeTrack, handleSelectTrack]
  );

  /**
   * Skip Previous
   */
  const handlePreviousTrack = useCallback(
    (isShuffle = false) => {
      if (currentTrackList.length === 0) return;
      const currentIndex = currentTrackList.findIndex((t) => t.id === activeTrack?.id);

      if (isShuffle && currentTrackList.length > 1) {
        let randomIndex = Math.floor(Math.random() * currentTrackList.length);
        while (randomIndex === currentIndex) {
          randomIndex = Math.floor(Math.random() * currentTrackList.length);
        }
        handleSelectTrack(currentTrackList[randomIndex]);
        return;
      }

      const prevIndex = (currentIndex - 1 + currentTrackList.length) % currentTrackList.length;
      handleSelectTrack(currentTrackList[prevIndex]);
    },
    [currentTrackList, activeTrack, handleSelectTrack]
  );

  // Audio Playback Hook
  const {
    audioRef,
    isPlaying,
    setIsPlaying,
    isBuffering,
    setIsBuffering,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    repeatMode,
    setRepeatMode,
    cycleRepeat,
    isShuffle,
    toggleShuffle,
    togglePlay,
    seek,
    handleTrackEnded,
    isSeekingRef,
  } = useAudioPlayback({
    audioSrc,
    onNextTrack: handleNextTrack,
  });

  // Safe play toggle that fetches audio if not yet loaded
  const handleTogglePlay = useCallback(() => {
    if (isAuthenticated && activeTrack?.isDemo) return;
    if (!audioSrc && activeTrack) {
      handleSelectTrack(activeTrack);
      return;
    }
    togglePlay();
  }, [isAuthenticated, audioSrc, activeTrack, handleSelectTrack, togglePlay]);

  const handleLogout = () => {
    cleanupCurrentAudioStream();
    setDriveTracks([]);
    setActiveTrack(DEFAULT_DEMO_TRACKS[0]);
    setAudioSrc(null);
    try {
      localStorage.removeItem(CACHED_TRACKS_KEY);
      localStorage.removeItem(ACTIVE_TRACK_ID_KEY);
    } catch (e) {
      console.warn('Failed to clear cached tracks on logout:', e);
    }
    logout();
  };

  // Seek bar event handlers
  const handleSeekChange = (e) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
  };

  const handleSeekStart = () => {
    isSeekingRef.current = true;
  };

  const handleSeekEnd = (e) => {
    isSeekingRef.current = false;
    const val = parseFloat(e.target.value);
    seek(val);
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
  };

  return (
    <div className="qw-app-root">
      {/* Hidden HTML5 Audio Element */}
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={() => {
          if (!isSeekingRef.current && audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration || 372);
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
          console.warn('Audio playback error:', e);
          setIsBuffering(false);
          setIsPlaying(false);
        }}
      />

      {/* 1. Header: Navigation, Search, Profile */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isAuthenticated={isAuthenticated}
        isLoading={isAuthLoading}
        error={authError}
        onLogin={login}
        onLogout={handleLogout}
        locationsCount={locations.length}
        onOpenLocations={() => setIsLocationModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAbout={() => setIsAboutModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="qw-main-content">
        {activeTab === 'home' && (
          <div className="qw-home-layout">
            {/* 2. Hero Section: Cinematic Sufi Mehfil & Overlaid Minimal Player */}
            <HeroPlayer
              activeTrack={activeTrack}
              isPlaying={isPlaying}
              isBuffering={isBuffering}
              isStreamLoading={isStreamLoading}
              isLoadingTracks={isLoadingTracks}
              isAuthenticated={isAuthenticated}
              tracksCount={currentTrackList.length}
              currentTime={currentTime}
              duration={duration || activeTrack?.duration || 0}
              volume={volume}
              isMuted={isMuted}
              repeatMode={repeatMode}
              isShuffle={isShuffle}
              onTogglePlay={handleTogglePlay}
              onNext={() => handleNextTrack(isShuffle)}
              onPrevious={() => handlePreviousTrack(isShuffle)}
              onToggleShuffle={toggleShuffle}
              onCycleRepeat={cycleRepeat}
              onSetRepeatMode={setRepeatMode}
              onSeekChange={handleSeekChange}
              onSeekStart={handleSeekStart}
              onSeekEnd={handleSeekEnd}
              onVolumeChange={handleVolumeChange}
              onToggleMute={toggleMute}
              isFavorite={favorites.has(activeTrack?.id)}
              onToggleFavorite={handleToggleFavorite}
            />

            {/* 3. All Songs Section: Positioned Immediately Below Hero */}
            <TrackList
              tracks={currentTrackList}
              activeTrack={activeTrack}
              isPlaying={isPlaying}
              isLoadingTracks={isLoadingTracks}
              isBuffering={isStreamLoading || isBuffering}
              error={tracksError}
              isAuthenticated={isAuthenticated}
              onSelectTrack={handleSelectTrack}
              onTogglePlay={handleTogglePlay}
              onRefresh={loadFolderTracks}
              onLogin={login}
              onOpenLocations={() => setIsLocationModalOpen(true)}
              activeLocationName={activeLocation?.name}
              searchQuery={searchQuery}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
            />
          </div>
        )}

        {(activeTab === 'explore' || activeTab === 'library') && (
          <TrackList
            tracks={currentTrackList}
            activeTrack={activeTrack}
            isPlaying={isPlaying}
            isLoadingTracks={isLoadingTracks}
            isBuffering={isStreamLoading || isBuffering}
            error={tracksError}
            isAuthenticated={isAuthenticated}
            onSelectTrack={handleSelectTrack}
            onTogglePlay={handleTogglePlay}
            onRefresh={loadFolderTracks}
            onLogin={login}
            onOpenLocations={() => setIsLocationModalOpen(true)}
            activeLocationName={activeLocation?.name}
            searchQuery={searchQuery}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
          />
        )}
      </main>

      {/* Floating Bottom Mini Player (Mobile adaptation, and on desktop when on Explore tab) */}
      <MiniPlayerBar
        activeTrack={activeTrack}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onMaximize={() => setActiveTab('home')}
        isFavorite={favorites.has(activeTrack?.id)}
        onToggleFavorite={handleToggleFavorite}
        showOnDesktop={activeTab !== 'home'}
        isAuthenticated={isAuthenticated}
      />

      {/* Drive Locations Management Modal */}
      <DriveLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        locations={locations}
        activeLocationId={activeLocationId}
        onSelectLocation={(locId) => {
          handleSelectLocation(locId);
          setIsLocationModalOpen(false);
        }}
        onAddLocation={handleAddLocation}
        onDeleteLocation={handleDeleteLocation}
      />

      {/* About Modal */}
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />
    </div>
  );
}
