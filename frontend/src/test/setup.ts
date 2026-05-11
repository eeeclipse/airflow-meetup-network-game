// Vitest setup file.
//
// Loaded for every test regardless of environment. We only register
// DOM-dependent helpers (jest-dom matchers, RTL cleanup) when the test
// actually runs in jsdom (opted in per-file via `// @vitest-environment
// jsdom`). In pure-node tests there is no `document`, so importing
// jest-dom would throw.
import { afterEach } from "vitest";

if (typeof document !== "undefined") {
  // Node 22.4+ ships an experimental built-in `localStorage` /
  // `sessionStorage` global. When the runtime has `--experimental-webstorage`
  // enabled without `--localstorage-file=PATH` (which is how vitest workers
  // boot), the global is a null-prototype no-op stub with no Storage
  // methods. It also shadows whatever jsdom installs on `window`, so
  // `window.localStorage.clear` is undefined too.
  //
  // We install a tiny Storage shim (Map-backed) on both globalThis and
  // window so tests can call setItem/getItem/removeItem/clear normally.
  // It is not a full Storage spec (no `length`, no index access), but it
  // is enough for our hooks which only use the named methods.
  // See https://nodejs.org/docs/latest/api/globals.html#localstorage
  class MapStorage {
    private map = new Map<string, string>();
    get length() {
      return this.map.size;
    }
    clear() {
      this.map.clear();
    }
    getItem(key: string) {
      return this.map.has(key) ? this.map.get(key)! : null;
    }
    setItem(key: string, value: string) {
      this.map.set(key, String(value));
    }
    removeItem(key: string) {
      this.map.delete(key);
    }
    key(index: number) {
      return Array.from(this.map.keys())[index] ?? null;
    }
  }
  const localStub = new MapStorage();
  const sessionStub = new MapStorage();
  for (const target of [globalThis, window] as object[]) {
    Object.defineProperty(target, "localStorage", {
      configurable: true,
      value: localStub,
    });
    Object.defineProperty(target, "sessionStorage", {
      configurable: true,
      value: sessionStub,
    });
  }

  await import("@testing-library/jest-dom/vitest");
  const { cleanup } = await import("@testing-library/react");
  afterEach(() => {
    cleanup();
  });
}
