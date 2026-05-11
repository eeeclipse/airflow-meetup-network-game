// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useKeywordPick } from "./useKeywordPick";

describe("useKeywordPick", () => {
  it("starts empty and incomplete", () => {
    const { result } = renderHook(() => useKeywordPick());
    expect(result.current.selected).toEqual([]);
    expect(result.current.isComplete).toBe(false);
  });

  it("adds keywords up to the 7-pick cap", () => {
    const { result } = renderHook(() => useKeywordPick());
    for (let i = 0; i < 10; i++) {
      act(() => result.current.toggle(`kw${i}`));
    }
    expect(result.current.selected.length).toBe(7);
    expect(result.current.selected).toEqual([
      "kw0","kw1","kw2","kw3","kw4","kw5","kw6",
    ]);
    expect(result.current.isComplete).toBe(true);
  });

  it("toggling an already-selected keyword removes it", () => {
    const { result } = renderHook(() => useKeywordPick());
    act(() => result.current.toggle("a"));
    act(() => result.current.toggle("b"));
    expect(result.current.selected).toEqual(["a", "b"]);
    act(() => result.current.toggle("a"));
    expect(result.current.selected).toEqual(["b"]);
  });

  it("reports isComplete only when exactly 7 are selected", () => {
    const { result } = renderHook(() => useKeywordPick());
    for (let i = 0; i < 6; i++) {
      act(() => result.current.toggle(`x${i}`));
    }
    expect(result.current.isComplete).toBe(false);
    act(() => result.current.toggle("x6"));
    expect(result.current.isComplete).toBe(true);
    act(() => result.current.toggle("x6"));
    expect(result.current.isComplete).toBe(false);
  });
});
