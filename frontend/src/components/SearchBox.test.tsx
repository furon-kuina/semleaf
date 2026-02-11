import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import SearchBox from "./SearchBox";

describe("SearchBox", () => {
  it("renders with semantic placeholder by default", () => {
    render(<SearchBox onSearch={() => {}} />);
    expect(screen.getByPlaceholderText("Search by meaning...")).toBeInTheDocument();
  });

  it("renders with text placeholder when mode is text", () => {
    render(<SearchBox onSearch={() => {}} initialMode="text" />);
    expect(screen.getByPlaceholderText("Search by text...")).toBeInTheDocument();
  });

  it("calls onSearch with query and mode on submit", async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<SearchBox onSearch={onSearch} />);

    const input = screen.getByPlaceholderText("Search by meaning...");
    await user.type(input, "test query");
    await user.click(screen.getByText("Search"));

    expect(onSearch).toHaveBeenCalledWith("test query", "semantic");
  });

  it("trims whitespace before searching", async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<SearchBox onSearch={onSearch} />);

    const input = screen.getByPlaceholderText("Search by meaning...");
    await user.type(input, "  spaced  ");
    await user.click(screen.getByText("Search"));

    expect(onSearch).toHaveBeenCalledWith("spaced", "semantic");
  });

  it("does not call onSearch with empty query", async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<SearchBox onSearch={onSearch} />);

    await user.click(screen.getByText("Search"));
    expect(onSearch).not.toHaveBeenCalled();
  });
});
