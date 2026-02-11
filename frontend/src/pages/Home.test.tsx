import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/preact";
import Home from "./Home";

// Mock preact-router
vi.mock("preact-router", () => ({
  route: vi.fn(),
}));

describe("Home", () => {
  it("renders SearchBox", () => {
    render(<Home />);
    expect(screen.getByPlaceholderText("Search by meaning...")).toBeInTheDocument();
  });

  it("renders New Phrase link", () => {
    render(<Home />);
    const link = screen.getByText("+ New Phrase");
    expect(link.closest("a")).toHaveAttribute("href", "/new");
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
