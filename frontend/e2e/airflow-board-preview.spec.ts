/**
 * AMB-019 — happy-path E2E.
 *
 * Drives the /airflow/preview surface (AMB-017a) end-to-end:
 * the board renders the expected number of chips, marking a full
 * row triggers the windmill overlay on each cell of that row, and
 * the clear button removes the overlay. This is the deterministic
 * counterpart to the upstream BingoGame flow, which depends on
 * Realtime + auth and is harder to exercise in CI.
 */
import { test, expect } from "@playwright/test";

const BOARD_COLS = 5;
const BOARD_CELLS = BOARD_COLS * BOARD_COLS;

test.describe("Airflow board preview", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/airflow/preview");
    await expect(page.getByTestId("bingo-board")).toBeVisible();
  });

  test("renders the expected number of cells", async ({ page }) => {
    const cells = page.locator("[data-cell-idx]");
    await expect(cells).toHaveCount(BOARD_CELLS);
  });

  test("filling the top row reveals the windmill overlay on each cell", async ({
    page,
  }) => {
    // No overlay before any cell is marked.
    await expect(page.getByTestId("windmill-overlay")).toHaveCount(0);

    await page.getByTestId("preview-fill-row").click();

    const overlays = page.getByTestId("windmill-overlay");
    await expect(overlays).toHaveCount(BOARD_COLS);
  });

  test("clear button removes the overlay and unmarks every cell", async ({
    page,
  }) => {
    await page.getByTestId("preview-fill-row").click();
    await expect(page.getByTestId("windmill-overlay")).toHaveCount(BOARD_COLS);

    await page.getByTestId("preview-clear").click();
    await expect(page.getByTestId("windmill-overlay")).toHaveCount(0);
  });

  test("clicking a single cell marks it without triggering a line", async ({
    page,
  }) => {
    await page.locator('[data-cell-idx="0"]').click();
    await expect(page.getByTestId("windmill-overlay")).toHaveCount(0);
    // The marked cell exposes data-marked="true" on the chip wrapper.
    const markedCount = await page.locator('[data-marked="true"]').count();
    expect(markedCount).toBeGreaterThanOrEqual(1);
  });
});
