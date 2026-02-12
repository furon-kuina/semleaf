import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/preact";
import Home from "./Home";

// Mock preact-router
vi.mock("preact-router", () => ({
  route: vi.fn(),
}));

// Mock api
vi.mock("../api", () => ({
  createPhrase: vi.fn(),
  listPhrases: vi.fn().mockResolvedValue([]),
}));

describe("Home", () => {
  it("renders SearchBox", () => {
    render(<Home />);
    expect(screen.getByPlaceholderText("Search by meaning...")).toBeInTheDocument();
  });

  it("renders New Phrase button", () => {
    render(<Home />);
    const button = screen.getByText("+ New Phrase");
    expect(button.tagName).toBe("BUTTON");
  });

  it("search routes to /search with query and mode", async () => {
    const { route } = await import("preact-router");
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();

    render(<Home />);

    const input = screen.getByPlaceholderText("Search by meaning...");
    await user.type(input, "test query");
    await user.click(screen.getByText("Search"));

    expect(route).toHaveBeenCalledWith("/search?q=test%20query&mode=semantic");
  });
});
