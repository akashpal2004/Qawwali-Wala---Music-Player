import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true, // Guarantees http://localhost:5173 for Google OAuth origin whitelist
    allowedHosts: true, // Disables Vite host checks and allows all incoming tunnel/domain requests
  },
})
