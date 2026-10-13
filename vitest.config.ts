import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "server-only": path.resolve(__dirname, "src/test/server-only-stub.ts"),
    },
  },
  test: {
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    environment: "node",
    // Never let a real provider key from the shell reach tests (where a failing assertion would print it).
    env: { NANOGPT_API_KEY: "", ELEVENLABS_API_KEY: "", OPENAI_API_KEY: "", OPENROUTER_API_KEY: "", CUSTOM_API_KEY: "" },
  },
});
