import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path"; // <-- 1. ADD THIS IMPORT

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  //base: "/",
  server: {
    host: "0.0.0.0",
  },
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        sandbox: path.resolve(__dirname, "sandbox.html"),
      },
    },
  },
  /* --- 2. ADD THIS RESOLVE OBJECT --- */
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@ucp/sdk": path.resolve(__dirname, "./src/lib/ucp-sdk/index.ts"),
    },
  },
  /* --- END OF ADDITION --- */
});
