import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Requests to /api go to the Django server, so we don't need CORS settings
export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api": "http://localhost:8000" } },
});
