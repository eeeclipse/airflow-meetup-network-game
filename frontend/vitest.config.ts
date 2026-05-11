import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Default to node for fast/pure-logic tests. Component/DOM tests opt
    // into jsdom via the `// @vitest-environment jsdom` docblock at the
    // top of each .test.tsx file. setupFiles still loads jest-dom matchers
    // and RTL cleanup for any test that opts into jsdom.
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
});
