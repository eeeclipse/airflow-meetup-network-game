// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import { airflowTheme } from "../../theme/airflow";
import { KeywordChipWithTooltip } from "./KeywordChipWithTooltip";

function renderWithTheme(ui: React.ReactNode) {
  return render(<ThemeProvider theme={airflowTheme}>{ui}</ThemeProvider>);
}

describe("KeywordChipWithTooltip", () => {
  it("renders the label", () => {
    renderWithTheme(
      <KeywordChipWithTooltip
        label="KubernetesPodOperator"
        description="격리 Pod 안에서 태스크 실행"
        marked={false}
      />,
    );
    expect(screen.getByText("KubernetesPodOperator")).toBeInTheDocument();
  });

  it("shows description tooltip on hover", async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <KeywordChipWithTooltip
        label="KubernetesPodOperator"
        description="격리 Pod 안에서 태스크 실행"
        marked={false}
      />,
    );
    await user.hover(screen.getByText("KubernetesPodOperator"));
    expect(
      await screen.findByRole("tooltip"),
    ).toHaveTextContent("격리 Pod 안에서 태스크 실행");
  });

  it("marks data-marked=true when marked", () => {
    renderWithTheme(
      <KeywordChipWithTooltip
        label="DAG"
        description="Directed Acyclic Graph"
        marked={true}
      />,
    );
    const el = screen.getByText("DAG").closest("[data-marked]")!;
    expect(el).toHaveAttribute("data-marked", "true");
  });

  it("marks data-line-complete=true when lineComplete", () => {
    renderWithTheme(
      <KeywordChipWithTooltip
        label="DAG"
        description="Directed Acyclic Graph"
        marked={true}
        lineComplete={true}
      />,
    );
    const el = screen.getByText("DAG").closest("[data-line-complete]")!;
    expect(el).toHaveAttribute("data-line-complete", "true");
  });
});
