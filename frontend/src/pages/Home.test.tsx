import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/preact";
import Home from "./Home";
import { makePhrase } from "../test/helpers";

// Mock api
vi.mock("../api", () => ({
  createPhrase: vi.fn(),
  updatePhrase: vi.fn(),
  deletePhrase: vi.fn(),
  listPhrases: vi.fn().mockResolvedValue([]),
}));

let apiMock: { listPhrases: ReturnType<typeof vi.fn> };

beforeEach(async () => {
  apiMock = (await import("../api")) as unknown as typeof apiMock;
  vi.clearAllMocks();
  apiMock.listPhrases.mockResolvedValue([]);
});

describe("Home", () => {
  it("renders Phrases heading", () => {
    render(<Home />);
    expect(screen.getByText("Phrases")).toBeInTheDocument();
  });

  it("shows phrases in a table when loaded", async () => {
    apiMock.listPhrases.mockResolvedValue([
      makePhrase({ phrase: "hello" }),
    ]);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("hello")).toBeInTheDocument();
    });
  });

  it("shows empty state when no phrases", async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("No phrases yet.")).toBeInTheDocument();
    });
  });
});
