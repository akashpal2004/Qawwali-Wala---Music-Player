/**
 * Audio Preloader and In-Memory Blob Cache Service
 * Enables seamless, zero-latency transitions between tracks by preloading
 * the upcoming track in the background while the current track is playing.
 */

import { streamTrackAudio, revokeAudioStream } from './driveService.js';

// In-memory cache for audio blob URLs: trackId -> { blobUrl, isDemo, timestamp }
const audioCache = new Map();

// In-flight download promises: trackId -> Promise<string>
const inFlightRequests = new Map();

// Maximum number of cached audio blobs to hold simultaneously in RAM
const MAX_CACHED_TRACKS = 4;

/**
 * Check if a track's audio is already preloaded and ready in memory.
 * @param {string} trackId
 * @returns {boolean}
 */
export function isTrackPreloaded(trackId) {
  return audioCache.has(trackId);
}

/**
 * Get the cached blob URL if available, otherwise return null.
 * @param {string} trackId
 * @returns {string|null}
 */
export function getCachedBlobUrl(trackId) {
  const item = audioCache.get(trackId);
  return item ? item.blobUrl : null;
}

/**
 * Preload a track's audio in the background without interrupting current playback.
 * Deduplicates concurrent requests for the same track.
 *
 * @param {Object} track - Track object with id, src, isDemo, etc.
 * @param {string} [token] - Google OAuth access token if streaming from Drive
 * @returns {Promise<string|null>} Resolves with the blob URL or null on failure
 */
export function preloadTrack(track, token) {
  if (!track || !track.id) return Promise.resolve(null);

  // 1. If already cached, return existing blob URL immediately
  if (audioCache.has(track.id)) {
    const cached = audioCache.get(track.id);
    cached.timestamp = Date.now();
    return Promise.resolve(cached.blobUrl);
  }

  // 2. If already in flight, reuse the active promise to avoid duplicate downloads
  if (inFlightRequests.has(track.id)) {
    return inFlightRequests.get(track.id);
  }

  // 3. Initiate background download
  const fetchPromise = (async () => {
    try {
      let blobUrl = null;

      if (track.isDemo || track.src) {
        // Preload demo audio file
        const src = track.src || '/demo-better-days.wav';
        const res = await fetch(src);
        if (!res.ok) throw new Error(`HTTP ${res.status} fetching demo track`);
        const blob = await res.blob();
        blobUrl = URL.createObjectURL(blob);
      } else if (token) {
        // Preload Google Drive audio binary stream
        blobUrl = await streamTrackAudio(track.id, token);
      } else {
        // No token available yet for Drive track
        return null;
      }

      if (blobUrl) {
        audioCache.set(track.id, {
          blobUrl,
          isDemo: Boolean(track.isDemo),
          timestamp: Date.now(),
        });
      }

      return blobUrl;
    } catch (err) {
      console.warn(`[AudioPreloader] Preload failed for track "${track.title || track.id}":`, err);
      return null;
    } finally {
      inFlightRequests.delete(track.id);
    }
  })();

  inFlightRequests.set(track.id, fetchPromise);
  return fetchPromise;
}

/**
 * Retrieve audio URL for a track, utilizing cache / in-flight requests or fetching directly.
 *
 * @param {Object} track
 * @param {string} [token]
 * @returns {Promise<string>}
 */
export async function getTrackAudioUrl(track, token) {
  if (!track) throw new Error('Track is required');

  // Check cache
  if (audioCache.has(track.id)) {
    const item = audioCache.get(track.id);
    item.timestamp = Date.now();
    return item.blobUrl;
  }

  // Check in-flight preloading
  if (inFlightRequests.has(track.id)) {
    const url = await inFlightRequests.get(track.id);
    if (url) return url;
  }

  // Fallback: fetch now
  return preloadTrack(track, token);
}

/**
 * Evict older cached audio blobs to prevent memory leaks while keeping essential tracks in memory.
 *
 * @param {Array<string>} keepTrackIds - Track IDs that must NOT be evicted (e.g. current, next, previous)
 */
export function evictOldBlobs(keepTrackIds = []) {
  const keepSet = new Set(keepTrackIds.filter(Boolean));

  // If cache exceeds limit, evict least recently used items not in keepSet
  if (audioCache.size > MAX_CACHED_TRACKS) {
    const sorted = [...audioCache.entries()]
      .filter(([id]) => !keepSet.has(id))
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    while (audioCache.size > MAX_CACHED_TRACKS && sorted.length > 0) {
      const [idToEvict, item] = sorted.shift();
      revokeAudioStream(item.blobUrl);
      audioCache.delete(idToEvict);
    }
  }
}

/**
 * Clear all cached audio streams and release all object URLs.
 * Call this when logging out or changing Google Drive folder locations.
 */
export function clearAudioCache() {
  for (const [, item] of audioCache.entries()) {
    revokeAudioStream(item.blobUrl);
  }
  audioCache.clear();
  inFlightRequests.clear();
}
