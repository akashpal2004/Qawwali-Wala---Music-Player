# Integrations & External Services

## 1. Google Identity Services (GIS) — OAuth 2.0 Token Client
- **Script Location**: `https://accounts.google.com/gsi/client` loaded async in `index.html`.
- **Implementation**: Managed by custom hook [`src/hooks/useGoogleDriveAuth.js`](file:///d:/D%20drive/Music%20Player/src/hooks/useGoogleDriveAuth.js).
- **OAuth Flow**: Client-side OAuth 2.0 Implicit Token Grant (Token Client).
- **Requested Scope**: `https://www.googleapis.com/auth/drive.readonly`.
- **Lifecycle**:
  1. Polls for `window.google?.accounts?.oauth2` readiness.
  2. Initializes token client with `client_id` from `import.meta.env.VITE_GOOGLE_CLIENT_ID`.
  3. `login()` invokes `tokenClient.requestAccessToken({ prompt: '' })`.
  4. Access token received via callback, stored in component state and used for Drive requests.
  5. `logout()` revokes the token via `google.accounts.oauth2.revoke(token)` and resets state.

## 2. Google Drive REST API v3
- **Base Endpoint**: `https://www.googleapis.com/drive/v3/files`
- **Service Layer**: [`src/services/driveService.js`](file:///d:/D%20drive/Music%20Player/src/services/driveService.js)
- **Key Operations**:
  - `fetchDriveAudioFiles(folderId, accessToken)`:
    - Queries files inside specified folder: `'<folderId>' in parents and (mimeType = 'audio/mpeg' or mimeType = 'audio/mp3') and trashed = false`
    - Requests fields: `files(id, name, size, mimeType, modifiedTime)`
    - Formats titles and parses artists using clean delimiter detection (`"Artist - Title"`).
  - `streamTrackAudio(fileId, accessToken)`:
    - Fetches binary media via `GET https://www.googleapis.com/drive/v3/files/<fileId>?alt=media` with Bearer auth.
    - Converts raw binary response to an in-memory `Blob` object.
    - Generates local Object URL via `URL.createObjectURL(audioBlob)` for HTML5 `<audio>` element.
  - `revokeAudioStream(objectUrl)`:
    - Releases blob memory via `URL.revokeObjectURL(objectUrl)` to avoid browser memory leaks during track switches.

## 3. Local Audio Assets & Demo Fallbacks
- **Audio Files**:
  - `/demo-better-days.wav` (stored in `public/`): Default offline audio track for immediate playback without requiring OAuth login.
- **Images & Thumbnails**:
  - `/hero-mehfil.jpg`: High-resolution traditional Qawwali mehfil performance photograph.
  - `/cover-tere-ishq.jpg`, `/cover-mast-qalandar.jpg`, `/cover-allah-hoo.jpg`, `/cover-dam-mast.jpg`, `/cover-bhar-do-jholi.jpg`, `/cover-ajj-din.jpg`, `/cover-teri-deewani.jpg`: High-fidelity track cover art matching the reference design.
  - `/nusrat.jpg`, `/cover-better-days.png`, `/artist-cover.jpg`: Legacy asset fallbacks.

## 4. Browser Web APIs
- **HTML5 Audio Element**: Single global `<audio>` element referenced via `useRef` for playback, buffering, seeking, volume, and event handling.
- **Web Storage API (`localStorage`)**:
  - `sonic_drive_locations_v2`: Persisted user-defined Google Drive folder locations.
  - `sonic_active_location_id_v2`: Active folder selection ID.
  - `qawwali_favorites`: Set of favorited track IDs.
