import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/preact";
import SearchResults from "./SearchResults";
import { makePhrase } from "../test/helpers";

// Mock the api module
vi.mock("../api", () => ({
  semanticSearch: vi.fn(),
  textSearch: vi.fn(),
}));

// Mock preact-router
vi.mock("preact-router", () => ({
  route: vi.fn(),
}));

let apiMock: { semanticSearch: ReturnType<typeof vi.fn>; textSearch: ReturnType<typeof vi.fn> };

beforeEach(async () => {
  apiMock = await import("../api") as typeof apiMock;
  vi.clearAllMocks();
});

describe("SearchResults", () => {
  it("shows loading state", () => {
    apiMock.semanticSearch.mockReturnValue(new Promise(() => {})); // never resolves
    render(<SearchResults q="test" mode="semantic" />);
    expect(screen.getByText("Searching...")).toBeInTheDocument();
  });

  it("calls semanticSearch for semantic mode", async () => {
    const phrases = [makePhrase({ phrase: "result1" })];
    apiMock.semanticSearch.mockResolvedValue(phrases);

    render(<SearchResults q="test" mode="semantic" />);

    await waitFor(() => {
      expect(apiMock.semanticSearch).toHaveBeenCalledWith({ query: "test" });
    });
  });

  it("calls textSearch for text mode", async () => {
    apiMock.textSearch.mockResolvedValue([]);

    render(<SearchResults q="hello" mode="text" />);

    await waitFor(() => {
      expect(apiMock.textSearch).toHaveBeenCalledWith("hello");
    });
  });

  it("renders PhraseCards with results", async () => {
    const phrases = [
      makePhrase({ phrase: "alpha" }),
      makePhrase({ phrase: "beta" }),
    ];
    apiMock.semanticSearch.mockResolvedValue(phrases);

    render(<SearchResults q="test" mode="semantic" />);

    await waitFor(() => {
      expect(screen.getByText("alpha")).toBeInTheDocument();
      expect(screen.getByText("beta")).toBeInTheDocument();
    });
  });

  it("shows no results message", async () => {
    apiMock.semanticSearch.mockResolvedValue([]);

    render(<SearchResults q="nothing" mode="semantic" />);

    await waitFor(() => {
      expect(screen.getByText("No results found.")).toBeInTheDocument();
    });
  });

  it("shows error message", async () => {
    apiMock.semanticSearch.mockRejectedValue(new Error("Search failed"));

    render(<SearchResults q="test" mode="semantic" />);

    await waitFor(() => {
      expect(screen.getByText("Search failed")).toBeInTheDocument();
    });
  });

  it("does not search when q is empty", () => {
    render(<SearchResults mode="semantic" />);

    expect(apiMock.semanticSearch).not.toHaveBeenCalled();
    expect(screen.queryByText("Searching...")).not.toBeInTheDocument();
  });
});
