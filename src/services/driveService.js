/**
 * Google Drive REST API v3 Service for Audio File Retrieval and Streaming.
 */

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3/files';

/**
 * Format bytes into human-readable size (e.g. "5.4 MB")
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Strip common audio file extensions for cleaner title display
 */
export function cleanTrackTitle(fileName) {
  if (!fileName) return 'Unknown Title';
  return fileName.replace(/\.(mp3|wav|ogg|m4a|aac|flac)$/i, '');
}

/**
 * Extract Google Drive Folder ID from a raw ID or full Google Drive URL.
 * Supports standard share URLs, u/0 links, and direct IDs.
 *
 * @param {string} input - Folder ID or full Drive folder URL
 * @returns {string} Sanitized folder ID
 */
export function extractDriveFolderId(input) {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim().replace(/^['"]|['"]$/g, '');

  // URL format: /folders/<ID>
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch) return folderMatch[1];

  // URL format: ?id=<ID> or &id=<ID>
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];

  // Strip trailing query parameters if present
  return trimmed.split('?')[0].split('&')[0].trim();
}

/**
 * Query all MP3 files inside a specific Google Drive folder.
 *
 * @param {string} folderId - The Google Drive Folder ID or Folder URL
 * @param {string} accessToken - Google OAuth 2.0 Bearer access token
 * @returns {Promise<Array>} List of audio file objects
 */
export async function fetchDriveAudioFiles(folderId, accessToken) {
  const cleanFolderId = extractDriveFolderId(folderId);

  if (!cleanFolderId) {
    throw new Error('Google Drive Folder ID is required.');
  }
  if (!accessToken) {
    throw new Error('Google OAuth access token is required.');
  }

  // Exact query specifying parent folder, audio mimeType, and excluding trashed files
  const query = `'${cleanFolderId}' in parents and (mimeType = 'audio/mpeg' or mimeType = 'audio/mp3') and trashed = false`;

  const params = new URLSearchParams({
    q: query,
    fields: 'files(id, name, size, mimeType, modifiedTime)',
    orderBy: 'name',
    pageSize: '1000',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
  });

  const url = `${DRIVE_API_BASE}?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    let errorMessage = `Failed to fetch files (HTTP ${response.status})`;
    try {
      const errData = await response.json();
      if (errData.error?.message) {
        errorMessage = errData.error.message;
      }
    } catch {
      // Ignore JSON parse errors
    }

    if (response.status === 401) {
      throw new Error('OAuth token expired or invalid. Please sign in again.');
    }
    if (response.status === 404) {
      throw new Error(`Folder with ID "${folderId}" was not found or is inaccessible.`);
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const files = data.files || [];

  return files.map((file) => {
    const cleanTitle = cleanTrackTitle(file.name);
    let artist = 'Nexora';
    let title = cleanTitle;
    if (cleanTitle.includes(' - ')) {
      const parts = cleanTitle.split(' - ');
      artist = parts[0].trim();
      title = parts.slice(1).join(' - ').trim();
    }
    return {
      id: file.id,
      name: file.name,
      title: title || cleanTitle,
      artist: artist,
      genre: 'Chill',
      year: file.modifiedTime ? new Date(file.modifiedTime).getFullYear().toString() : '2024',
      size: parseInt(file.size, 10) || 0,
      formattedSize: formatBytes(file.size),
      mimeType: file.mimeType,
      modifiedTime: file.modifiedTime,
      cover: '/cover-better-days.png',
    };
  });
}

/**
 * Fetch media binary stream for an audio file from Google Drive and create a local Blob Object URL.
 *
 * @param {string} fileId - The Google Drive File ID
 * @param {string} accessToken - Google OAuth 2.0 Bearer access token
 * @returns {Promise<string>} Blob Object URL (blob:http://...)
 */
export async function streamTrackAudio(fileId, accessToken) {
  if (!fileId) throw new Error('File ID is required for audio streaming.');
  if (!accessToken) throw new Error('Access token is required for audio streaming.');

  const streamUrl = `${DRIVE_API_BASE}/${fileId}?alt=media`;

  const response = await fetch(streamUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Access token expired. Please re-authenticate.');
    }
    throw new Error(`Failed to stream audio file: HTTP ${response.status} ${response.statusText}`);
  }

  const audioBlob = await response.blob();

  // Create an in-memory Object URL for HTML5 Audio playback
  const objectUrl = URL.createObjectURL(audioBlob);
  return objectUrl;
}

/**
 * Revoke an existing Object URL to release memory and avoid memory leaks.
 *
 * @param {string} objectUrl - The Blob Object URL to revoke
 */
export function revokeAudioStream(objectUrl) {
  if (objectUrl && objectUrl.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.warn('Failed to revoke Object URL:', err);
    }
  }
}
