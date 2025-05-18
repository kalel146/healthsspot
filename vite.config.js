import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';


export default {
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
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
            type: "image/png"
          },
          {
            src: "/logo-512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ]
}
