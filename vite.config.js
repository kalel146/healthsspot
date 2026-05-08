import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV !== "production";
const isVercel = process.env.VERCEL === "1";

export default defineConfig({
  plugins: [
    react({
      fastRefresh: isDev && !isVercel,
    }),
  ],

  define: {
    __HS_BUILD__: JSON.stringify(
      process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || new Date().toISOString()
    ),
  },

  build: {
    sourcemap: false,
    manifest: false,
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },

  server: {
    port: 5173,
    strictPort: true,
    fs: { strict: false },
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
