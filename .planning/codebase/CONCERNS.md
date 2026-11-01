# Concerns, Technical Debt & Risk Analysis

## Technical Debt & Codebase Observations

### 1. In-Memory Blob Streaming for Large Audio Files
- **Observation**: [`streamTrackAudio`](file:///d:/D%20drive/Music%20Player/src/services/driveService.js) fetches the entire audio file binary into memory via `response.blob()`, then creates an object URL.
- **Risk**: For very large files (e.g. 50MB+ lossless FLAC or long 30-minute live mehfil recordings), downloading the entire blob before playback causes noticeable start latency and uses substantial client memory.
- **Remediation**: Consider chunked range streaming or using direct streaming endpoints if Google Drive API CORS supports byte-range requests directly to `<audio>`.

### 2. OAuth Token Expiration Handling
- **Observation**: The Google OAuth 2.0 access token issued by GIS Token Client expires after 60 minutes.
- **Risk**: If a user plays music after an hour of inactivity, subsequent track streaming calls may fail with HTTP 401 until the user manually reconnects.
- **Remediation**: Add automatic token refresh logic or an expired-token prompt in `driveService.js` to seamlessly request a new token via GIS.

### 3. Lack of Automated Test Suites
- **Observation**: There are no unit or end-to-end tests (Vitest, Playwright, or Cypress).
- **Risk**: Regressions in audio state handling, repeat logic, or search filtering could be introduced during future updates without automated warnings.
- **Remediation**: Introduce Vitest and React Testing Library for core hooks (`useAudioPlayback`) and utility functions (`formatters`, `driveService`).

### 4. Deprecated / Unused Components
- **Observation**: [`AudioPlayer.jsx`](file:///d:/D%20drive/Music%20Player/src/components/AudioPlayer.jsx) was the older standalone player component before the redesign.
- **Risk**: Adds slight bundle weight if imported or causes confusion for future maintainers.
- **Remediation**: Cleanly archive or deprecate [`AudioPlayer.jsx`](file:///d:/D%20drive/Music%20Player/src/components/AudioPlayer.jsx) if no longer utilized.

### 5. Media Asset Optimization
- **Observation**: Hero image (`/hero-mehfil.jpg`) is ~919 KB.
- **Risk**: Slower initial load on low-bandwidth mobile connections.
- **Remediation**: Provide WebP / AVIF compressed variants and `srcset` for responsive viewport sizes.
