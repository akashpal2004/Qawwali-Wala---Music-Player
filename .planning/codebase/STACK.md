# Tech Stack Analysis

## Core Runtime & Frameworks
- **Runtime**: Browser ECMAScript 2023+ (Node.js 20+ / Node.js 24+ for build tooling)
- **Frontend Framework**: [React 19](https://react.dev/) (`react@^19.3.1`, `react-dom@^19.3.1`)
- **Language / Syntax**: JavaScript (ESM, JSX)

## Build System & Tooling
- **Build Tool / Dev Server**: [Vite 8](https://vitejs.dev/) (`vite@^8.3.4`, `@vitejs/plugin-react@^6.1.2`)
- **Linter**: [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) (`oxlint@^1.88.0`, `.oxlintrc.json`)
- **Bundle Output**: Production single-page application built to `dist/` (assets with content hashing)

## User Interface & Styling
- **UI Icons**: [Lucide React](https://lucide.dev/) (`lucide-react@^1.61.0`)
- **Styling Architecture**: Pure CSS3 with CSS Custom Properties (Variables)
  - `src/index.css`: Design system tokens, color palette, custom scrollbars, typography resets
  - `src/App.css`: Master layout, responsive breakpoints, animations, and component styling
- **Typography & Web Fonts**:
  - `Cinzel` (Google Fonts): Traditional serif display typography for Sufi brand identity
  - `Playfair Display` (Google Fonts): Classic editorial serif for quotes, headings, and section titles
  - `Plus Jakarta Sans` (Google Fonts): Clean contemporary sans-serif for UI navigation, song titles, metadata, and controls

## Authentication & Cloud APIs
- **Google Identity Services (GIS)**: OAuth 2.0 Token Client via `https://accounts.google.com/gsi/client`
- **Google Drive REST API**: v3 endpoint (`https://www.googleapis.com/drive/v3/files`) for audio file queries and binary streaming

## Environment Configuration
- `.env` & `.env.example`:
  - `VITE_GOOGLE_CLIENT_ID`: OAuth 2.0 Web Client ID registered in Google Cloud Console
  - `VITE_FOLDER_ID`: Default Google Drive music folder ID

## Key Package Dependencies
| Package | Version | Purpose |
| :--- | :--- | :--- |
| `react` | `^19.3.1` | Core UI view library |
| `react-dom` | `^19.3.1` | React DOM renderer |
| `lucide-react` | `^1.61.0` | Comprehensive icon set |
| `vite` | `^8.3.4` | Development server and Rollup-based bundler |
| `@vitejs/plugin-react`| `^6.1.2` | Fast Refresh and JSX compiler plugin |
| `oxlint` | `^1.88.0` | High-performance Rust-based linter |
