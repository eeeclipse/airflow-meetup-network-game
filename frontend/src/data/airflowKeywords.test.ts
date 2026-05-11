import { describe, it, expect } from "vitest";
import { AIRFLOW_KEYWORDS } from "./airflowKeywords";

describe("AIRFLOW_KEYWORDS", () => {
  it("has 30 entries", () => {
    expect(AIRFLOW_KEYWORDS.length).toBe(30);
  });

  it("has unique labels", () => {
    const set = new Set(AIRFLOW_KEYWORDS.map((k) => k.label));
    expect(set.size).toBe(30);
  });

  it("every entry has a meaningful description", () => {
    for (const k of AIRFLOW_KEYWORDS) {
      expect(k.description.length).toBeGreaterThan(3);
    }
  });

  it("every category is one of the known buckets", () => {
    const valid = ["operator", "core", "executor", "ops", "ecosystem"];
    for (const k of AIRFLOW_KEYWORDS) {
      expect(valid).toContain(k.category);
    }
  });

  it("matches spec quotas per category", () => {
    const counts = AIRFLOW_KEYWORDS.reduce<Record<string, number>>(
      (acc, k) => {
        acc[k.category] = (acc[k.category] ?? 0) + 1;
        return acc;
      },
      {},
    );
    // Spec §5: 8 operators, 8 core, 6 executor, 5 ops, 3 ecosystem.
    expect(counts).toEqual({
      operator: 8,
      core: 8,
      executor: 6,
      ops: 5,
      ecosystem: 3,
    });
  });
});
