import { defineConfig } from "vite";
import path from "node:path";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@state": path.resolve(__dirname, "./src/state"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@types": path.resolve(__dirname, "./src/types"),
      "@lib": path.resolve(__dirname, "./src/lib"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@validations": path.resolve(__dirname, "./src/validations"),
    },
  },
  server: {
    port: 3000,
    strictPort: false, // TODO: set this to true when release
    host: true,
    origin: "http://0.0.0.0:3000",
  },
});
