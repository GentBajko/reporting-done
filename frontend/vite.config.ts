import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/auth": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/user": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/project": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/task": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/log": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/event": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/availability": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "^/calendar/": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path,
      },
      "/dashboard": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
