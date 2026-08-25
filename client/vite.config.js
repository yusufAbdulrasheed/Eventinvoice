import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png"],
      manifest: {
        name: "Generous Event",
        short_name: "Generous Event",
        description: "Premium event planning, rentals, and invoicing.",
        start_url: "/",
        display: "standalone",
        theme_color: "#4a1015",
        background_color: "#ece7de",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      // This is a live SaaS app, not a content site — only the built app
      // shell (JS/CSS/fonts) is precached for installability. API responses
      // are deliberately NOT runtime-cached, so users never see stale
      // invoice/client data while offline instead of a clear "you're offline".
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5005",
        changeOrigin: true,
      },
    },
  },
});
