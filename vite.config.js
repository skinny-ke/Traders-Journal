import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // Never cache Supabase API, auth, or storage responses.
        // All trading data, authentication tokens, and screenshots must
        // only be served from the network.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/[^/]+\.supabase\.co\/rest\/v1\/.*/,
            handler: "NetworkOnly",
            options: {
              cacheName: "supabase-api-no-cache",
            },
          },
          {
            urlPattern: /^https:\/\/[^/]+\.supabase\.co\/auth\/v1\/.*/,
            handler: "NetworkOnly",
            options: {
              cacheName: "supabase-auth-no-cache",
            },
          },
          {
            urlPattern: /^https:\/\/[^/]+\.supabase\.co\/storage\/v1\/.*/,
            handler: "NetworkOnly",
            options: {
              cacheName: "supabase-storage-no-cache",
            },
          },
        ],
      },
      manifest: {
        name: "Trade Journal",
        short_name: "Trade Journal",
        description: "Personal trading journal for recording and reviewing trades.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#0b1120",
        theme_color: "#0f172a",
        orientation: "any",
        id: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-maskable-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  build: {
    // Increase the warning threshold slightly; the bundle is well within
    // acceptable limits for a production SPA with Supabase included.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Split vendor libraries from the app code for better caching.
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "supabase-vendor": ["@supabase/supabase-js"],
          "ui-vendor": ["lucide-react"],
        },
      },
    },
  },
});
