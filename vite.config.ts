import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"
import { canvasApiPlugin } from "./server/api"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), canvasApiPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  publicDir: "public",
  server: {
    fs: {
      allow: ["."],
    },
  },
})
