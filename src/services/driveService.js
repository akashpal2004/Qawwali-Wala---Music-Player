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
 * Extract clean song name and artist from audio file names.
 * Supports pipe '|', dash '-', en-dash '–', em-dash '—', and artist keyword detection.
 */
export function parseAudioFileMetadata(fileName) {
  const clean = cleanTrackTitle(fileName);

  const cleanText = (str) => {
    return str
      .replace(/\s*[([\[](official\s*(video|audio|hd\s*video)?|full\s*song|hq|lyrics|complete\s*full\s*version|osa\s*official\s*hd\s*video|hd|audio)[)\]]/gi, '')
      .replace(/\s+(lyrics\s+in\s+description|complete\s+full\s+version|full\s+song|official\s+video)$/i, '')
      .trim();
  };

  const knownArtists = [
    'Ustad Nusrat Fateh Ali Khan',
    'Nusrat Fateh Ali Khan',
    'Sabri Brothers',
    'Rahat Fateh Ali Khan',
    'Abida Parveen',
    'Amjad Sabri',
    'Aziz Mian Qawwal',
  ];

  let songName = '';
  let artistName = '';

  // 1. Pipe-separated: e.g. "Ae Wadah Shikan | Nusrat Fateh Ali Khan | complete full version"
  if (clean.includes('|')) {
    const parts = clean.split('|').map((p) => p.trim()).filter(Boolean);
    const artistIndex = parts.findIndex((p) =>
      knownArtists.some((ka) => p.toLowerCase().includes(ka.toLowerCase())) ||
      /nusrat|sabri|rahat|qawwal|khan/i.test(p)
    );
    if (artistIndex === 1) {
      songName = cleanText(parts[0]);
      artistName = parts[1];
    } else if (artistIndex === 0) {
      artistName = parts[0];
      songName = cleanText(parts[1]);
    } else {
      songName = cleanText(parts[0]);
      artistName = parts[1] || 'Ustad Nusrat Fateh Ali Khan';
    }
  }
  // 2. Dash-separated: hyphen (-), en-dash (–), or em-dash (—)
  else if (/(\s+[-–—]\s+|\s+[-–—]|[-–—]\s+)/.test(clean)) {
    const parts = clean.split(/\s*[-–—]\s*/).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const isPart0Artist = knownArtists.some((ka) => parts[0].toLowerCase().includes(ka.toLowerCase())) ||
        /^(ustad|sabri|qawwal)/i.test(parts[0]) ||
        /osa\s*official/i.test(parts[0]);
      const isPart1Artist = knownArtists.some((ka) => parts[1].toLowerCase().includes(ka.toLowerCase())) ||
        /^(ustad|sabri|qawwal)/i.test(parts[1]) ||
        /osa\s*official/i.test(parts[1]);

      if (isPart1Artist && !isPart0Artist) {
        songName = cleanText(parts[0]);
        artistName = parts[1];
      } else if (isPart0Artist && !isPart1Artist) {
        artistName = parts[0];
        songName = cleanText(parts.slice(1).join(' - '));
      } else {
        songName = cleanText(parts[0]);
        artistName = parts.slice(1).join(' - ');
      }
    } else {
      songName = cleanText(clean);
      artistName = 'Ustad Nusrat Fateh Ali Khan';
    }
  }
  // 3. String contains known artist without separator
  else {
    const matchedArtist = knownArtists.find((ka) => clean.toLowerCase().includes(ka.toLowerCase())) ||
      (clean.match(/Nusrat\s+Fateh\s+Ali\s+Khan/i) ? 'Nusrat Fateh Ali Khan' : null);

    if (matchedArtist) {
      const regex = new RegExp(matchedArtist, 'i');
      const parts = clean.split(regex);
      songName = cleanText(parts[0]);
      artistName = matchedArtist;
      if (!songName && parts[1]) {
        songName = cleanText(parts[1]);
      }
    } else {
      songName = cleanText(clean);
      artistName = 'Ustad Nusrat Fateh Ali Khan';
    }
  }

  // Never allow empty or 'Google Drive'
  if (!songName || songName.toLowerCase() === 'google drive') {
    songName = cleanText(clean) || 'Sufi Qawwali';
  }
  if (!artistName || artistName.toLowerCase() === 'google drive') {
    artistName = 'Ustad Nusrat Fateh Ali Khan';
  }

  return { artistName, songName };
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
    throw new Error('Google Drive Folder ID is required. Please check your folder settings.');
  }
  if (!accessToken) {
    throw new Error('Google OAuth access token is required. Please connect your Google Drive.');
  }

  console.log(`[Google Drive] Scanning folder ID: "${cleanFolderId}"...`);

  // Query all non-trashed items inside the target folder
  const query = `'${cleanFolderId}' in parents and trashed = false`;

  const params = new URLSearchParams({
    q: query,
    fields: 'files(id, name, size, mimeType, modifiedTime, thumbnailLink)',
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
    let errorMessage = `Failed to fetch files from Google Drive (HTTP ${response.status})`;
    try {
      const errData = await response.json();
      if (errData.error?.message) {
        errorMessage = errData.error.message;
      }
    } catch {
      // Ignore JSON parse errors
    }

    if (response.status === 401) {
      throw new Error('OAuth token expired or invalid. Please reconnect your Google Drive.');
    }
    if (response.status === 403) {
      throw new Error(`Permission denied for folder "${cleanFolderId}". Please ensure the folder is shared with read access or your account has permission.`);
    }
    if (response.status === 404) {
      throw new Error(`Google Drive folder "${cleanFolderId}" was not found. Please verify the Folder ID.`);
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const rawItems = data.files || [];
  console.log(`[Google Drive] Found ${rawItems.length} total items in root folder.`);

  const audioExtensions = /\.(mp3|wav|m4a|aac|ogg|flac|opus|wma|aiff)$/i;

  // Filter for audio files directly in root folder
  let audioFiles = rawItems.filter((file) => {
    return file.mimeType?.startsWith('audio/') || audioExtensions.test(file.name);
  });

  // If no audio files directly in root folder, check if there are subfolders (e.g. artist or album folders)
  if (audioFiles.length === 0) {
    const subfolders = rawItems.filter(
      (f) => f.mimeType === 'application/vnd.google-apps.folder'
    );
    if (subfolders.length > 0) {
      console.log(`[Google Drive] Root folder has ${subfolders.length} subfolders. Scanning subfolders for audio files...`);
      const subResults = await Promise.all(
        subfolders.slice(0, 15).map(async (folder) => {
          try {
            const subParams = new URLSearchParams({
              q: `'${folder.id}' in parents and trashed = false`,
              fields: 'files(id, name, size, mimeType, modifiedTime, thumbnailLink)',
              orderBy: 'name',
              pageSize: '1000',
              supportsAllDrives: 'true',
              includeItemsFromAllDrives: 'true',
            });
            const subRes = await fetch(`${DRIVE_API_BASE}?${subParams.toString()}`, {
              headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
            });
            if (subRes.ok) {
              const subData = await subRes.json();
              return (subData.files || []).filter(
                (f) => f.mimeType?.startsWith('audio/') || audioExtensions.test(f.name)
              );
            }
          } catch (e) {
            console.warn(`Failed scanning subfolder "${folder.name}":`, e);
          }
          return [];
        })
      );
      audioFiles = subResults.flat();
      console.log(`[Google Drive] Found ${audioFiles.length} audio files inside subfolders.`);
    }
  }

  console.log(`[Google Drive] Returning ${audioFiles.length} total audio tracks.`);

  return audioFiles.map((file) => {
    const { artistName, songName } = parseAudioFileMetadata(file.name);
    return {
      id: file.id,
      name: file.name,
      title: artistName,
      artist: songName,
      genre: 'Sufi / Qawwali',
      year: file.modifiedTime ? new Date(file.modifiedTime).getFullYear().toString() : '2024',
      size: parseInt(file.size, 10) || 0,
      formattedSize: formatBytes(file.size),
      mimeType: file.mimeType,
      modifiedTime: file.modifiedTime,
      cover: '/nusrat-all-songs.jpg',
      isDemo: false,
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
