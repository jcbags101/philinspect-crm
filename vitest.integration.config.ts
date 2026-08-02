import { config } from "dotenv";
import { defineConfig } from "vitest/config";

config({ path: ".env.local", quiet: true });

export default defineConfig({
  test: {
    include: ["tests/integration/**/*.test.ts"],
    fileParallelism: false,
    hookTimeout: 60_000,
    testTimeout: 60_000,
  },
});
