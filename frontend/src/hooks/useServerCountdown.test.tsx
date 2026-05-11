// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useServerCountdown } from "./useServerCountdown";

/**
 * Helper: stub global.fetch to return a fixed `now` + `cutoff_at`
 * payload as if the BE `/api/events/{id}/cutoff` endpoint replied.
 */
function stubCutoffEndpoint(now: string, cutoffAt: string | null) {
  const json = vi.fn().mockResolvedValue({ now, cutoff_at: cutoffAt });
  global.fetch = vi
    .fn()
    .mockResolvedValue({ ok: true, status: 200, json }) as unknown as typeof fetch;
}

describe("useServerCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns null remainingSec before fetch resolves", () => {
    vi.setSystemTime(new Date("2026-06-20T12:00:00Z"));
    stubCutoffEndpoint("2026-06-20T12:00:00Z", "2026-06-20T12:45:00Z");
    const { result } = renderHook(() => useServerCountdown(3));
    expect(result.current.remainingSec).toBeNull();
  });

  it("computes remaining seconds from server-vs-client drift", async () => {
    // Client clock is 10s ahead of the server.
    vi.setSystemTime(new Date("2026-06-20T12:00:10Z"));
    stubCutoffEndpoint("2026-06-20T12:00:00Z", "2026-06-20T12:45:00Z");

    const { result } = renderHook(() => useServerCountdown(3));
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    // Server says we're 0s into the round; cutoff is 45min later.
    // Even though the client clock thinks it's 10s ahead, the
    // drift-adjusted remaining should be ~45*60 (within a 2s window).
    expect(result.current.remainingSec).not.toBeNull();
    expect(result.current.remainingSec!).toBeLessThanOrEqual(45 * 60);
    expect(result.current.remainingSec!).toBeGreaterThan(45 * 60 - 2);
  });

  it("ticks down once per second", async () => {
    vi.setSystemTime(new Date("2026-06-20T12:00:00Z"));
    stubCutoffEndpoint("2026-06-20T12:00:00Z", "2026-06-20T12:00:10Z");

    const { result } = renderHook(() => useServerCountdown(3));
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
    const before = result.current.remainingSec!;

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    const after = result.current.remainingSec!;

    expect(before - after).toBeGreaterThanOrEqual(2);
    expect(before - after).toBeLessThanOrEqual(4);
  });

  it("clamps at 0 once cutoff has passed", async () => {
    vi.setSystemTime(new Date("2026-06-20T12:50:00Z"));
    stubCutoffEndpoint("2026-06-20T12:50:00Z", "2026-06-20T12:45:00Z");

    const { result } = renderHook(() => useServerCountdown(3));
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(result.current.remainingSec).toBe(0);
  });

  it("leaves remainingSec null when cutoff_at is null", async () => {
    vi.setSystemTime(new Date("2026-06-20T12:00:00Z"));
    stubCutoffEndpoint("2026-06-20T12:00:00Z", null);

    const { result } = renderHook(() => useServerCountdown(3));
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(result.current.remainingSec).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("surfaces an error when the cutoff endpoint returns HTTP error", async () => {
    vi.setSystemTime(new Date("2026-06-20T12:00:00Z"));
    global.fetch = vi
      .fn()
      .mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn(),
      }) as unknown as typeof fetch;

    const { result } = renderHook(() => useServerCountdown(3));
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(result.current.remainingSec).toBeNull();
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toContain("HTTP 500");
  });

  it("surfaces a network rejection as an error", async () => {
    vi.setSystemTime(new Date("2026-06-20T12:00:00Z"));
    global.fetch = vi
      .fn()
      .mockRejectedValue(new Error("network down")) as unknown as typeof fetch;

    const { result } = renderHook(() => useServerCountdown(3));
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(result.current.error?.message).toBe("network down");
  });
});
