# Coding Conventions & Patterns

## Code Style & Formatting
- **ECMAScript Standards**: ESM (`import`/`export`), modern JavaScript features (optional chaining `?.`, nullish coalescing `??`, destructuring).
- **React Patterns**:
  - Functional components with React 19 hooks (`useState`, `useEffect`, `useRef`, `useCallback`, `useMemo`).
  - No legacy class components.
  - State hoisting for components requiring synchronization (`searchQuery`, `activeTrack`, `favorites`).
- **Naming Conventions**:
  - Components: PascalCase (e.g., `HeroPlayer.jsx`, `MiniPlayerBar.jsx`).
  - Hooks: camelCase starting with `use` (e.g., `useAudioPlayback.js`, `useGoogleDriveAuth.js`).
  - Utilities / Services: camelCase (e.g., `driveService.js`, `formatters.js`).
  - Constants: UPPER_SNAKE_CASE (e.g., `DEFAULT_DEMO_TRACKS`, `DEFAULT_LOCATIONS_KEY`).
  - CSS Classes: BEM-inspired / prefixed namespaces (e.g., `.qw-navbar`, `.qw-hero-section`, `.qw-song-row`).

## CSS & Styling Architecture
- **CSS Custom Properties**: All colors, fonts, and theme variables defined in `:root` inside [`src/index.css`](file:///d:/D%20drive/Music%20Player/src/index.css).
- **Component Styling**: Clean class-based styling in [`src/App.css`](file:///d:/D%20drive/Music%20Player/src/App.css).
- **Responsive Strategy**:
  - Mobile-first adaptations via standard CSS media queries (`@media (max-width: 768px)`).
  - No external CSS framework dependencies (no Tailwind, Bootstrap, or styled-components).
  - High-performance GPU-accelerated CSS animations (`transform`, `opacity`) for equalizer bars and modal transitions.

## Audio & DOM Lifecycle
- Single `<audio>` element rendered in `App.jsx` with events attached:
  - `onTimeUpdate`: Updates current playback time when not dragging slider.
  - `onLoadedMetadata`: Retrieves true duration.
  - `onWaiting` / `onPlaying` / `onPause`: Synchronizes buffering and play status.
  - `onEnded`: Automatically advances to the next track.
- Clean memory reclamation using `URL.revokeObjectURL()` on track switches or unmount.

## Linting & Static Analysis
- **Linter**: `oxlint` configuration in `.oxlintrc.json`.
- Run command: `npm run lint`
- Clean execution with 0 errors across all codebase files.
