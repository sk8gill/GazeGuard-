import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/GazeGuard-/', // ⚠️ This must EXACTLY match your GitHub repo name!
})