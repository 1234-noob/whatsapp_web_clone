import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: [
      "@radix-ui/themes",
      "@tanstack/react-query",
      "next-themes",
      "embla-carousel-react",
    ],
  },
  server: {
    force: true,
    hmr: {
      overlay: false,
    },
  },
  cacheDir: ".vite",
});
