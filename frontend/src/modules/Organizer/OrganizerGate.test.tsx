// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import { airflowTheme } from "../../theme/airflow";
import { OrganizerGate } from "./OrganizerGate";

function renderWithTheme(ui: React.ReactNode) {
  return render(<ThemeProvider theme={airflowTheme}>{ui}</ThemeProvider>);
}

describe("OrganizerGate", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ORG_PIN", "TEST_PIN");
  });

  it("blocks the protected children until the correct PIN is entered", () => {
    renderWithTheme(
      <OrganizerGate>
        <div data-testid="secret">organizer panel</div>
      </OrganizerGate>,
    );
    expect(screen.queryByTestId("secret")).toBeNull();
    expect(screen.getByLabelText(/PIN/i)).toBeInTheDocument();
  });

  it("reveals the children after submitting the correct PIN", async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <OrganizerGate>
        <div data-testid="secret">organizer panel</div>
      </OrganizerGate>,
    );

    await user.type(screen.getByLabelText(/PIN/i), "TEST_PIN");
    await user.click(screen.getByRole("button", { name: /입장/ }));

    expect(screen.getByTestId("secret")).toBeInTheDocument();
  });

  it("keeps the children hidden when the wrong PIN is entered", async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <OrganizerGate>
        <div data-testid="secret">organizer panel</div>
      </OrganizerGate>,
    );

    await user.type(screen.getByLabelText(/PIN/i), "WRONG");
    await user.click(screen.getByRole("button", { name: /입장/ }));

    expect(screen.queryByTestId("secret")).toBeNull();
    expect(screen.getByText(/PIN이 일치하지 않/)).toBeInTheDocument();
  });
});
