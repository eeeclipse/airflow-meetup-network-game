// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { airflowTheme } from "../../theme/airflow";
import { WindmillOverlay } from "./WindmillOverlay";

function renderWithTheme(ui: React.ReactNode) {
  return render(<ThemeProvider theme={airflowTheme}>{ui}</ThemeProvider>);
}

describe("WindmillOverlay", () => {
  it("renders nothing when inactive", () => {
    renderWithTheme(<WindmillOverlay active={false} />);
    expect(screen.queryByTestId("windmill-overlay")).toBeNull();
  });

  it("renders glowing windmill when active", () => {
    renderWithTheme(<WindmillOverlay active />);
    const overlay = screen.getByTestId("windmill-overlay");
    expect(overlay).toHaveAttribute("data-glow", "true");
  });

  it("contains an svg child when active", () => {
    renderWithTheme(<WindmillOverlay active />);
    const overlay = screen.getByTestId("windmill-overlay");
    expect(overlay.querySelector("svg")).not.toBeNull();
  });
});
