// Vitest setup file.
//
// Loaded for every test regardless of environment. We only register
// DOM-dependent helpers (jest-dom matchers, RTL cleanup) when the test
// actually runs in jsdom (opted in per-file via `// @vitest-environment
// jsdom`). In pure-node tests there is no `document`, so importing
// jest-dom would throw.
import { afterEach } from "vitest";

if (typeof document !== "undefined") {
  await import("@testing-library/jest-dom/vitest");
  const { cleanup } = await import("@testing-library/react");
  afterEach(() => {
    cleanup();
  });
}
