# Testing & Verification Strategy

## Current Testing Setup
- **Automated Unit / Integration Tests**: No Jest or Vitest suite currently configured in `package.json`.
- **Static Analysis & Linting**:
  - `oxlint` (`npm run lint`): Validates React hook rules, syntax errors, and potential bugs.
- **Production Build Validation**:
  - `vite build` (`npm run build`): Validates module imports, JSX compilation, CSS bundling, and production asset generation.

## Manual Verification Checklist

### 1. Audio Playback Pipeline
- [ ] Click Play on Hero Player: audio begins streaming and playing immediately.
- [ ] Seek Slider: dragging or clicking the progress bar jumps to correct timestamp.
- [ ] Pause / Resume: audio pauses and resumes cleanly without stutter.
- [ ] Next / Previous: advances or skips backward across the playlist.
- [ ] Shuffle Mode: randomizes next track selection.
- [ ] Repeat Mode: cycles between `off` -> `all` -> `one`.
- [ ] Volume Control: slider adjusts volume; mute button toggles state.

### 2. "All Songs" Playlist
- [ ] Clicking any song row selects and plays the track.
- [ ] Active track displays animated golden equalizer bars.
- [ ] Filter pills ("All", "Nusrat Fateh Ali Khan", "Sabri Brothers", "Modern Qawwals", "Favorites") correctly filter songs.
- [ ] Clicking the heart icon adds or removes song from favorites and updates Favorites filter.
- [ ] Sort dropdown sorts songs by Title (A-Z), Artist, Duration, or Default.

### 3. Header & Search
- [ ] Typing into the header search bar immediately filters songs in the playlist.
- [ ] Clearing search restores the full track list.
- [ ] Navigation links (Home, Explore, About) switch views and open modals correctly.

### 4. Google Drive OAuth Integration
- [ ] Clicking profile icon opens the account menu.
- [ ] Clicking "Connect Google Drive" triggers the GIS token client prompt.
- [ ] Upon authentication, tracks in the selected Drive folder load into the playlist.
- [ ] Drive Location Modal allows adding custom folder IDs or URLs and switching active locations.
- [ ] Disconnecting / Signing out revokes token and falls back to offline demo tracks.

### 5. Responsive Design
- [ ] Desktop viewport (>= 1024px): Full navigation, landscape hero with overlaid player bar, All Songs table with Album column.
- [ ] Tablet viewport (768px - 1023px): Fluid layout, proportional controls.
- [ ] Mobile viewport (< 768px): Compact header, mobile hero player, stacked compact song rows, floating bottom mini-player bar.
