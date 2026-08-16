import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Sueca Online",
        short_name: "Sueca",
        description: "Jogo de cartas Sueca — 4 jogadores em tempo real",
        theme_color: "#0b3d2e",
        background_color: "#0b3d2e",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
  server: { port: 5173 },
});
