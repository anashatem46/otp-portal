import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsx: "automatic"
  },
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.ts"]
  },
  resolve: {
    alias: {
      "@": new URL(".", import.meta.url).pathname
    }
  }
});
