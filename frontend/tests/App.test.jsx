import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";

describe("App interface workflow", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("allows adding an application from the interface", async () => {
    // Mock the initial load, the create request, and the refreshed list after save.
    const createdApplication = {
      id: 1,
      company: "Acme",
      position: "Backend Engineer",
      status: "applied",
      location: "Remote",
      applied_date: "2026-04-14",
      source: "LinkedIn",
      notes: "Portfolio sent",
      favorite: false,
    };

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createdApplication,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [createdApplication],
      });

    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    const user = userEvent.setup();

    // Move to the applications page and submit the form like a real user would.
    await user.click(screen.getByRole("button", { name: /Applications/i }));

    await user.type(screen.getByLabelText("Company"), "Acme");
    await user.type(screen.getByLabelText("Position"), "Backend Engineer");
    await user.selectOptions(screen.getByLabelText("Status"), "applied");
    await user.type(screen.getByLabelText("Location"), "Remote");
    await user.type(screen.getByLabelText("Applied date"), "2026-04-14");
    await user.type(screen.getByLabelText("Source"), "LinkedIn");
    await user.type(screen.getByLabelText("Notes"), "Portfolio sent");

    await user.click(screen.getByRole("button", { name: "Save Application" }));

    // Confirm both the success message and the new card rendering.
    await waitFor(() => {
      expect(screen.getByText("Application added.")).toBeInTheDocument();
    });

    expect(await screen.findByText("Backend Engineer")).toBeInTheDocument();
    expect(screen.getAllByText("Acme").length).toBeGreaterThan(0);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0][0]).toContain("/applications");
    expect(fetchMock.mock.calls[1][0]).toContain("/applications");
    expect(fetchMock.mock.calls[1][1]?.method).toBe("POST");
    expect(fetchMock.mock.calls[2][0]).toContain("/applications");
  });
});
