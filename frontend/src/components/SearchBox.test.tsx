import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import SearchBox from "./SearchBox";

vi.mock("preact-router", () => ({
  route: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SearchBox", () => {
  it("renders with placeholder text", () => {
    render(<SearchBox />);
    expect(screen.getByPlaceholderText("Search by meaning...")).toBeInTheDocument();
  });

  it("renders with current query when provided", () => {
    render(<SearchBox currentQuery="test query" />);
    expect(screen.getByDisplayValue("test query")).toBeInTheDocument();
  });

  it("navigates to search on submit", async () => {
    const { route } = await import("preact-router");
    const user = userEvent.setup();
    render(<SearchBox />);

    const input = screen.getByPlaceholderText("Search by meaning...");
    await user.type(input, "test query{enter}");

    expect(route).toHaveBeenCalledWith("/search?q=test%20query");
  });

  it("does not navigate with empty query", async () => {
    const { route } = await import("preact-router");
    const user = userEvent.setup();
    render(<SearchBox />);

    const input = screen.getByPlaceholderText("Search by meaning...");
    await user.type(input, "{enter}");

    expect(route).not.toHaveBeenCalled();
  });

  it("trims whitespace before navigating", async () => {
    const { route } = await import("preact-router");
    const user = userEvent.setup();
    render(<SearchBox />);

    const input = screen.getByPlaceholderText("Search by meaning...");
    await user.type(input, "  spaced  {enter}");

    expect(route).toHaveBeenCalledWith("/search?q=spaced");
  });
});
