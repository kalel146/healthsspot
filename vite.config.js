import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { fileURLToPath } from "url";

// Για __dirname σε ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
  registerType: "autoUpdate",
  manifest: {
    name: "Health's Spot",
    short_name: "HealthSpot",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#f97316",
    icons: [
      {
        src: "/logo-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/logo-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
  devOptions: {
    enabled: false, // ✅ απαραίτητο για production build στο Vercel
    navigateFallback: '/',
  },
  workbox: {
    maximumFileSizeToCacheInBytes: 5000000,
  },
}),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    fs: {
      strict: false,
    },
    // για routing που σπάει σε refresh
    historyApiFallback: true,
  },
});
