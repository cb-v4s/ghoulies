import { defineConfig } from "vite";
import path from "node:path";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@assets": path.resolve(__dirname, "./src/assets"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@libs": path.resolve(__dirname, "./src/libs"),
      "@types": path.resolve(__dirname, "./src/types"),
    },
  },
  server: {
    port: 3000,
    strictPort: false, // TODO: set this to true when release
    host: true,
    origin: "http://0.0.0.0:3000",
  },
});
