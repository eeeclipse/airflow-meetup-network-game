// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import { airflowTheme } from "../../theme/airflow";
import { KeywordPoolEditor } from "./KeywordPoolEditor";

function renderWithTheme(ui: React.ReactNode) {
  return render(<ThemeProvider theme={airflowTheme}>{ui}</ThemeProvider>);
}

/**
 * Stub `global.fetch` with a simple in-memory keyword pool so the
 * editor's GET / POST / DELETE round-trip is exercised without a
 * real BE.
 */
function installFetchStub(initial: string[]) {
  let pool = [...initial];
  const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
    const path = typeof url === "string" ? url : url.toString();
    const method = init?.method ?? "GET";
    if (method === "GET" && path.endsWith("/keywords")) {
      return {
        ok: true,
        status: 200,
        json: async () => [...pool],
      } as Response;
    }
    if (method === "POST" && path.endsWith("/keywords")) {
      const body = JSON.parse(init!.body as string) as { keyword: string };
      if (!pool.includes(body.keyword)) pool.push(body.keyword);
      return {
        ok: true,
        status: 201,
        json: async () => ({ keyword: body.keyword, added: true }),
      } as Response;
    }
    if (method === "DELETE") {
      const segments = path.split("/");
      const label = decodeURIComponent(segments[segments.length - 1]);
      pool = pool.filter((k) => k !== label);
      return { ok: true, status: 204, json: async () => null } as Response;
    }
    throw new Error(`unhandled ${method} ${path}`);
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return { fetchMock, snapshot: () => [...pool] };
}

describe("KeywordPoolEditor", () => {
  beforeEach(() => {
    // Nothing global to set up — installFetchStub installs per test.
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads the keyword pool on mount and renders each label", async () => {
    installFetchStub(["DAG", "XCom", "SLA"]);
    renderWithTheme(<KeywordPoolEditor eventId={3} />);
    expect(await screen.findByText("DAG")).toBeInTheDocument();
    expect(screen.getByText("XCom")).toBeInTheDocument();
    expect(screen.getByText("SLA")).toBeInTheDocument();
  });

  it("posts a new keyword and refreshes the list", async () => {
    const { snapshot } = installFetchStub(["DAG"]);
    const user = userEvent.setup();
    renderWithTheme(<KeywordPoolEditor eventId={3} />);
    await screen.findByText("DAG");

    await user.type(screen.getByLabelText(/키워드/), "Apache Iceberg");
    await user.click(screen.getByRole("button", { name: /추가/ }));

    await waitFor(() => {
      expect(screen.getByText("Apache Iceberg")).toBeInTheDocument();
    });
    expect(snapshot()).toContain("Apache Iceberg");
  });

  it("deletes a keyword and removes it from the list", async () => {
    installFetchStub(["DAG", "XCom"]);
    const user = userEvent.setup();
    renderWithTheme(<KeywordPoolEditor eventId={3} />);
    await screen.findByText("DAG");

    // Each row exposes a delete button — find the one whose aria-label
    // mentions the target label.
    const deleteBtn = screen.getByLabelText(/XCom 삭제/);
    await user.click(deleteBtn);

    await waitFor(() => {
      expect(screen.queryByText("XCom")).toBeNull();
    });
    expect(screen.getByText("DAG")).toBeInTheDocument();
  });

  it("shows an error when the fetch fails", async () => {
    global.fetch = vi
      .fn()
      .mockRejectedValue(new Error("boom")) as unknown as typeof fetch;
    renderWithTheme(<KeywordPoolEditor eventId={3} />);
    expect(await screen.findByText(/키워드 풀을 불러오지 못/)).toBeInTheDocument();
  });
});
