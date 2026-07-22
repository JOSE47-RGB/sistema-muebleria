import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  server: {
    host: "0.0.0.0",
    allowedHosts: [
      "exemplary-exploration-production-a7e5.up.railway.app",
    ],
  },

  preview: {
    host: "0.0.0.0",
    allowedHosts: [
      "exemplary-exploration-production-a7e5.up.railway.app",
    ],
  },
});