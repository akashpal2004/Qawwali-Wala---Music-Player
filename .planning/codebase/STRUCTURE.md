# Codebase Structure

## Directory Tree

```
Music Player/
├── .env                         # Local environment variables
├── .env.example                 # Environment variable template
├── .gitignore                   # Git ignore patterns
├── .oxlintrc.json               # Oxlint configuration
├── index.html                   # HTML entry point (GIS script & Google Fonts)
├── package.json                 # Dependencies and build scripts
├── package-lock.json            # Exact dependency lockfile
├── vite.config.js               # Vite bundler configuration
│
├── public/                      # Static assets served at root
│   ├── cover-better-days.png    # Fallback artwork
│   ├── cover-tere-ishq.jpg      # "Tere Ishq Nachaya" cover art
│   ├── cover-mast-qalandar.jpg  # "Mast Qalandar" cover art
│   ├── cover-allah-hoo.jpg      # "Allah Hoo" cover art
│   ├── cover-dam-mast.jpg       # "Dam Mast Qalandar" cover art
│   ├── cover-bhar-do-jholi.jpg  # "Bhar Do Jholi Meri" cover art
│   ├── cover-ajj-din.jpg        # "Ajj Din Chadheya" cover art
│   ├── cover-teri-deewani.jpg   # "Teri Deewani" cover art
│   ├── demo-better-days.wav     # Offline audio sample stream
│   ├── hero-mehfil.jpg          # Cinematic Sufi Mehfil hero image
│   ├── hero-player-thumb.jpg    # Hero player fallback thumbnail
│   ├── favicon.png              # App favicon
│   ├── favicon.svg              # App SVG icon
│   └── icons.svg                # SVG sprite icons
│
├── src/                         # Source application code
│   ├── main.jsx                 # React root bootstrap & DOM mounting
│   ├── App.jsx                  # Main application orchestrator & state manager
│   ├── App.css                  # Global application styling & component styles
│   ├── index.css                # CSS variables, theme tokens, and reset
│   │
│   ├── components/              # React UI components
│   │   ├── Navbar.jsx           # Header with crest, navigation, search, and profile
│   │   ├── HeroPlayer.jsx       # Hero section with mehfil visual & minimal player
│   │   ├── TrackList.jsx        # "All Songs" playlist, filter pills, and song rows
│   │   ├── MiniPlayerBar.jsx    # Floating bottom mini-player bar for mobile
│   │   ├── ExploreView.jsx      # Curated Sufi music collections view
│   │   ├── DriveLocationModal.jsx # Google Drive folders management modal
│   │   ├── AboutModal.jsx       # Qawwali heritage modal dialog
│   │   ├── AudioPlayer.jsx      # Legacy standalone audio player component
│   │   └── QuoteContainer.jsx   # Poetic Sufi quote container
│   │
│   ├── hooks/                   # Custom reusable React hooks
│   │   ├── useAudioPlayback.js  # Audio element control, time scrub, and repeat/shuffle
│   │   └── useGoogleDriveAuth.js# GIS OAuth 2.0 token client lifecycle
│   │
│   ├── services/                # External API client services
│   │   └── driveService.js      # Google Drive REST API v3 queries & audio streaming
│   │
│   └── utils/                   # Helpers, formatters, and seed data
│       ├── demoTracks.js        # Default offline demo tracks
│       ├── formatters.js        # Time (mm:ss) and number formatting utilities
│       └── quotes.js            # Sufi quotes repository
│
└── .planning/                   # GSD planning & architectural analysis
    └── codebase/                # Codebase analysis documents
        ├── STACK.md
        ├── INTEGRATIONS.md
        ├── ARCHITECTURE.md
        └── STRUCTURE.md
```

## Module Responsibilities

| File / Folder | Core Responsibility |
| :--- | :--- |
| [`src/main.jsx`](file:///d:/D%20drive/Music%20Player/src/main.jsx) | Entry point mounting `<App />` into `#root` DOM container |
| [`src/App.jsx`](file:///d:/D%20drive/Music%20Player/src/App.jsx) | Master state manager coordinating audio playback, Google Drive data, search queries, active tabs, and modals |
| [`src/components/Navbar.jsx`](file:///d:/D%20drive/Music%20Player/src/components/Navbar.jsx) | Header component rendering branding, nav tabs, search input, and profile dropdown |
| [`src/components/HeroPlayer.jsx`](file:///d:/D%20drive/Music%20Player/src/components/HeroPlayer.jsx) | Hero section featuring background mehfil imagery, centered branding, and playback controls |
| [`src/components/TrackList.jsx`](file:///d:/D%20drive/Music%20Player/src/components/TrackList.jsx) | "All Songs" playlist table with artist filter pills, sort controls, and song rows |
| [`src/components/MiniPlayerBar.jsx`](file:///d:/D%20drive/Music%20Player/src/components/MiniPlayerBar.jsx) | Persistent floating bottom mini-player for mobile viewports |
| [`src/hooks/useAudioPlayback.js`](file:///d:/D%20drive/Music%20Player/src/hooks/useAudioPlayback.js) | Encapsulates HTML5 Audio element lifecycle, time updates, and seek/volume actions |
| [`src/hooks/useGoogleDriveAuth.js`](file:///d:/D%20drive/Music%20Player/src/hooks/useGoogleDriveAuth.js) | Handles Google Identity Services client script loading, token requests, and logout |
| [`src/services/driveService.js`](file:///d:/D%20drive/Music%20Player/src/services/driveService.js) | Handles Google Drive API HTTP requests, metadata parsing, and binary blob URL creation |
| [`src/utils/demoTracks.js`](file:///d:/D%20drive/Music%20Player/src/utils/demoTracks.js) | Rich collection of default Qawwali tracks with audio references |
