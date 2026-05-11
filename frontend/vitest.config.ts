import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  // vitest does not auto-load vite.config.ts when a dedicated
  // vitest.config.ts exists, so we re-register the plugins we need
  // (react SWC for JSX + svgr so `import X from './x.svg?react'`
  // resolves to a React component instead of a data URL).
  plugins: [react(), svgr()],
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
