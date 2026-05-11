// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAnonymousAuth } from "./useAnonymousAuth";

const signInAnonymously = vi.fn();

vi.mock("../lib/supabaseClient", () => ({
  getSupabaseClient: () => ({
    auth: {
      signInAnonymously: (...args: unknown[]) => signInAnonymously(...args),
    },
  }),
}));

describe("useAnonymousAuth", () => {
  beforeEach(() => {
    window.localStorage.clear();
    signInAnonymously.mockReset();
  });

  it("returns null userId before sign-in", () => {
    const { result } = renderHook(() => useAnonymousAuth());
    expect(result.current.userId).toBeNull();
    expect(result.current.nickname).toBeNull();
  });

  it("signs in anonymously, stores nickname + userId in localStorage, exposes them", async () => {
    signInAnonymously.mockResolvedValue({
      data: { user: { id: "anon-uuid-42" } },
      error: null,
    });
    const { result } = renderHook(() => useAnonymousAuth());

    await act(async () => {
      await result.current.signInAs("jihyun");
    });

    expect(signInAnonymously).toHaveBeenCalledWith({
      options: { data: { nickname: "jihyun" } },
    });
    expect(window.localStorage.getItem("amb_nickname")).toBe("jihyun");
    expect(window.localStorage.getItem("amb_user_id")).toBe("anon-uuid-42");
    expect(result.current.userId).toBe("anon-uuid-42");
    expect(result.current.nickname).toBe("jihyun");
  });

  it("throws if Supabase returns an error", async () => {
    signInAnonymously.mockResolvedValue({
      data: { user: null },
      error: new Error("boom"),
    });
    const { result } = renderHook(() => useAnonymousAuth());

    await expect(
      act(async () => {
        await result.current.signInAs("jihyun");
      }),
    ).rejects.toThrow("boom");
    expect(window.localStorage.getItem("amb_user_id")).toBeNull();
  });

  it("restores userId + nickname from localStorage on mount", () => {
    window.localStorage.setItem("amb_user_id", "restored-uuid");
    window.localStorage.setItem("amb_nickname", "restored-nick");
    const { result } = renderHook(() => useAnonymousAuth());
    expect(result.current.userId).toBe("restored-uuid");
    expect(result.current.nickname).toBe("restored-nick");
  });
});
