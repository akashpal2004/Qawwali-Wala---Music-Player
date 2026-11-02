import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook managing HTML5 audio playback with:
 * 1. Gapless / preloaded next song playback support
 * 2. Automatic resumption after incoming phone calls, audio focus loss, or interruptions
 * 3. Media Session API (lock-screen & bluetooth controls)
 * 4. Audio Session API (declaring 'playback' category for mobile OS audio routing)
 */
export function useAudioPlayback({
  audioSrc,
  activeTrack,
  onNextTrack,
  onPreviousTrack,
}) {
  const audioRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.85);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off' | 'all' | 'one'
  const [isShuffle, setIsShuffle] = useState(false);
  const isSeekingRef = useRef(false);

  // Distinguish explicit user pause from system interruptions (phone calls, audio focus loss)
  const userInitiatedPauseRef = useRef(false);
  const wasInterruptedRef = useRef(false);
  const recoveryIntervalRef = useRef(null);

  const stopInterruptionRecovery = useCallback(() => {
    if (recoveryIntervalRef.current) {
      clearInterval(recoveryIntervalRef.current);
      recoveryIntervalRef.current = null;
    }
  }, []);

  /**
   * Periodic recovery loop: When an interruption (e.g. phone call) occurs,
   * attempts to resume playback as soon as the operating system releases audio focus.
   */
  const startInterruptionRecovery = useCallback(() => {
    stopInterruptionRecovery();

    let attempts = 0;
    const maxAttempts = 40; // Poll every 1.5s for up to 60 seconds

    recoveryIntervalRef.current = setInterval(() => {
      attempts += 1;
      const audio = audioRef.current;

      // Stop if user manually clicked pause or audio already resumed or component unmounted
      if (!audio || !wasInterruptedRef.current || userInitiatedPauseRef.current || !audio.paused) {
        stopInterruptionRecovery();
        return;
      }

      if (attempts > maxAttempts) {
        stopInterruptionRecovery();
        return;
      }

      // Try resuming
      audio
        .play()
        .then(() => {
          wasInterruptedRef.current = false;
          setIsPlaying(true);
          stopInterruptionRecovery();
        })
        .catch(() => {
          // Normal while phone call / external audio is actively holding focus.
          // Will succeed on subsequent check once call is cut / ended.
        });
    }, 1500);
  }, [stopInterruptionRecovery]);

  // Declare OS Audio Session category as 'playback' (iOS Safari / modern browsers)
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'audioSession' in navigator) {
      try {
        navigator.audioSession.type = 'playback';
      } catch (e) {
        console.warn('[AudioPlayback] Failed to set audioSession type:', e);
      }
    }
  }, []);

  // Update Media Session API metadata for lock-screen, car stereo, and notification shade
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    if (activeTrack) {
      const artwork = activeTrack.cover
        ? [
            { src: activeTrack.cover, sizes: '96x96', type: 'image/jpeg' },
            { src: activeTrack.cover, sizes: '128x128', type: 'image/jpeg' },
            { src: activeTrack.cover, sizes: '256x256', type: 'image/jpeg' },
            { src: activeTrack.cover, sizes: '512x512', type: 'image/jpeg' },
          ]
        : [{ src: '/cover-tere-ishq.jpg', sizes: '512x512', type: 'image/jpeg' }];

      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: activeTrack.title || 'Unknown Title',
          artist: activeTrack.artist || 'Sufi Music',
          album: activeTrack.album || 'Qawwali & Sufi Music',
          artwork,
        });
      } catch (e) {
        console.warn('[AudioPlayback] Failed to set MediaSession metadata:', e);
      }
    }
  }, [activeTrack]);

  // Sync source when audioSrc changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audioSrc) {
      userInitiatedPauseRef.current = false;
      wasInterruptedRef.current = false;
      stopInterruptionRecovery();

      // Assigning new src
      audio.src = audioSrc;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            if ('mediaSession' in navigator) {
              navigator.mediaSession.playbackState = 'playing';
            }
          })
          .catch((err) => {
            console.warn('[AudioPlayback] Playback prevented by browser autoplay policy:', err);
            setIsPlaying(false);
          });
      }
    } else {
      audio.removeAttribute('src');
      audio.load();
      userInitiatedPauseRef.current = true;
      wasInterruptedRef.current = false;
      stopInterruptionRecovery();
    }
  }, [audioSrc, stopInterruptionRecovery]);

  // Sync volume with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Register Media Session action handlers (hardware / bluetooth / notification controls)
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    const audio = audioRef.current;

    const playHandler = () => {
      userInitiatedPauseRef.current = false;
      wasInterruptedRef.current = false;
      stopInterruptionRecovery();
      if (audio) {
        audio
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => console.warn('[AudioPlayback] MediaSession play error:', err));
      }
    };

    const pauseHandler = () => {
      userInitiatedPauseRef.current = true;
      wasInterruptedRef.current = false;
      stopInterruptionRecovery();
      if (audio) {
        audio.pause();
        setIsPlaying(false);
      }
    };

    const prevHandler = () => {
      if (onPreviousTrack) onPreviousTrack();
    };

    const nextHandler = () => {
      if (onNextTrack) onNextTrack();
    };

    const seekToHandler = (details) => {
      if (details.seekTime !== undefined && audio) {
        audio.currentTime = details.seekTime;
        setCurrentTime(details.seekTime);
      }
    };

    try {
      navigator.mediaSession.setActionHandler('play', playHandler);
      navigator.mediaSession.setActionHandler('pause', pauseHandler);
      navigator.mediaSession.setActionHandler('previoustrack', prevHandler);
      navigator.mediaSession.setActionHandler('nexttrack', nextHandler);
      navigator.mediaSession.setActionHandler('seekto', seekToHandler);
    } catch (e) {
      console.warn('[AudioPlayback] MediaSession handler registration error:', e);
    }

    return () => {
      try {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('seekto', null);
      } catch {
        // ignore
      }
    };
  }, [onPreviousTrack, onNextTrack, stopInterruptionRecovery]);

  // Visibility, Focus, and PageShow interruption auto-resumption listeners
  useEffect(() => {
    const handleResumeCheck = () => {
      const audio = audioRef.current;
      if (!audio) return;

      // If playback was stopped by a call or external app and user did not explicitly pause
      if (wasInterruptedRef.current && !userInitiatedPauseRef.current && audio.paused) {
        audio
          .play()
          .then(() => {
            wasInterruptedRef.current = false;
            setIsPlaying(true);
            stopInterruptionRecovery();
          })
          .catch((err) => {
            console.warn('[AudioPlayback] Auto-resume prevented by browser policy, awaiting interaction:', err);
          });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleResumeCheck();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleResumeCheck);
    window.addEventListener('pageshow', handleResumeCheck);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleResumeCheck);
      window.removeEventListener('pageshow', handleResumeCheck);
      stopInterruptionRecovery();
    };
  }, [stopInterruptionRecovery]);

  // One-time user interaction fallback: If browser autoplay policy blocked
  // background resume, any screen tap / click resumes immediately
  useEffect(() => {
    const handleGestureResume = () => {
      const audio = audioRef.current;
      if (!audio) return;

      if (wasInterruptedRef.current && !userInitiatedPauseRef.current && audio.paused) {
        audio
          .play()
          .then(() => {
            wasInterruptedRef.current = false;
            setIsPlaying(true);
            stopInterruptionRecovery();
          })
          .catch(() => {});
      }
    };

    window.addEventListener('pointerdown', handleGestureResume, { passive: true });
    window.addEventListener('keydown', handleGestureResume, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', handleGestureResume);
      window.removeEventListener('keydown', handleGestureResume);
    };
  }, [stopInterruptionRecovery]);

  // Web Audio API AudioContext state listener (WebKit / Safari iOS call interruption detection)
  useEffect(() => {
    let audioCtx = null;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();

        const handleAudioCtxState = () => {
          if (audioCtx.state === 'interrupted') {
            if (!userInitiatedPauseRef.current) {
              wasInterruptedRef.current = true;
              startInterruptionRecovery();
            }
          } else if (audioCtx.state === 'running' || audioCtx.state === 'suspended') {
            if (wasInterruptedRef.current && !userInitiatedPauseRef.current) {
              audioCtx.resume().catch(() => {});
              const audio = audioRef.current;
              if (audio && audio.paused) {
                audio
                  .play()
                  .then(() => {
                    wasInterruptedRef.current = false;
                    setIsPlaying(true);
                    stopInterruptionRecovery();
                  })
                  .catch(() => {});
              }
            }
          }
        };

        audioCtx.addEventListener('statechange', handleAudioCtxState);
      }
    } catch {
      // AudioContext not supported or restricted
    }

    return () => {
      if (audioCtx) {
        try {
          audioCtx.close();
        } catch {
          // ignore
        }
      }
    };
  }, [startInterruptionRecovery, stopInterruptionRecovery]);

  // Native Audio Element Event Handlers
  const handleAudioPlay = useCallback(() => {
    userInitiatedPauseRef.current = false;
    wasInterruptedRef.current = false;
    stopInterruptionRecovery();
    setIsPlaying(true);
    setIsBuffering(false);
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'playing';
    }
  }, [stopInterruptionRecovery]);

  const handleAudioPause = useCallback(() => {
    const audio = audioRef.current;
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }

    // If audio paused but not at track end and not explicitly paused by user -> interruption!
    if (audio && !audio.ended && !userInitiatedPauseRef.current) {
      wasInterruptedRef.current = true;
      startInterruptionRecovery();
    }

    setIsPlaying(false);
  }, [startInterruptionRecovery]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audioSrc) return;

    if (isPlaying) {
      userInitiatedPauseRef.current = true;
      wasInterruptedRef.current = false;
      stopInterruptionRecovery();
      audio.pause();
    } else {
      userInitiatedPauseRef.current = false;
      wasInterruptedRef.current = false;
      stopInterruptionRecovery();
      audio.play().catch((err) => {
        console.warn('[AudioPlayback] Play error:', err);
      });
    }
  }, [isPlaying, audioSrc, stopInterruptionRecovery]);

  const seek = useCallback((time) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const setVolume = useCallback((val) => {
    setVolumeState(val);
    if (val > 0 && isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      setIsMuted(false);
      setVolumeState(prevVolume || 0.5);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
    }
  }, [isMuted, volume, prevVolume]);

  const cycleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev);
  }, []);

  const handleTrackEnded = useCallback(() => {
    const audio = audioRef.current;
    if (repeatMode === 'one' && audio) {
      audio.currentTime = 0;
      audio.play();
    } else if (onNextTrack) {
      onNextTrack(isShuffle);
    } else {
      setIsPlaying(false);
    }
  }, [repeatMode, onNextTrack, isShuffle]);

  return {
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
    setIsShuffle,
    toggleShuffle,
    togglePlay,
    seek,
    handleTrackEnded,
    handleAudioPlay,
    handleAudioPause,
    isSeekingRef,
    userInitiatedPauseRef,
    wasInterruptedRef,
  };
}
