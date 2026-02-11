import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import PhraseDetail from "./PhraseDetail";
import { makeFullPhrase, makePhrase } from "../test/helpers";

vi.mock("../api", () => ({
  getPhrase: vi.fn(),
  deletePhrase: vi.fn(),
}));

vi.mock("preact-router", () => ({
  route: vi.fn(),
}));

let apiMock: { getPhrase: ReturnType<typeof vi.fn>; deletePhrase: ReturnType<typeof vi.fn> };

beforeEach(async () => {
  apiMock = (await import("../api")) as unknown as typeof apiMock;
  vi.clearAllMocks();
});

describe("PhraseDetail", () => {
  it("shows loading state", () => {
    apiMock.getPhrase.mockReturnValue(new Promise(() => {}));
    render(<PhraseDetail id="test-id" />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders phrase details after load", async () => {
    const phrase = makeFullPhrase({
      phrase: "ephemeral",
      meanings: ["lasting a short time"],
      source: "Book",
      tags: ["vocab"],
      memo: "Remember this",
    });
    apiMock.getPhrase.mockResolvedValue(phrase);

    render(<PhraseDetail id="test-id" />);

    await waitFor(() => {
      expect(screen.getByText("ephemeral")).toBeInTheDocument();
      expect(screen.getByText("lasting a short time")).toBeInTheDocument();
      expect(screen.getByText("Book")).toBeInTheDocument();
      expect(screen.getByText("vocab")).toBeInTheDocument();
      expect(screen.getByText("Remember this")).toBeInTheDocument();
    });
  });

  it("hides optional fields when null", async () => {
    const phrase = makePhrase({
      phrase: "minimal",
      meanings: ["bare minimum"],
      source: null,
      tags: [],
      memo: null,
    });
    apiMock.getPhrase.mockResolvedValue(phrase);

    render(<PhraseDetail id="test-id" />);

    await waitFor(() => {
      expect(screen.getByText("minimal")).toBeInTheDocument();
    });

    // Source, Tags, and Memo labels should not appear
    expect(screen.queryByText("Source")).not.toBeInTheDocument();
    expect(screen.queryByText("Tags")).not.toBeInTheDocument();
    expect(screen.queryByText("Memo")).not.toBeInTheDocument();
  });

  it("delete with confirmation navigates home", async () => {
    const phrase = makePhrase({ id: "del-id" });
    apiMock.getPhrase.mockResolvedValue(phrase);
    apiMock.deletePhrase.mockResolvedValue({ ok: true });
    vi.spyOn(window, "confirm").mockReturnValue(true);

    const { route } = await import("preact-router");
    const user = userEvent.setup();

    render(<PhraseDetail id="del-id" />);

    await waitFor(() => screen.getByText("Delete"));
    await user.click(screen.getByText("Delete"));

    expect(apiMock.deletePhrase).toHaveBeenCalledWith("del-id");
    await waitFor(() => {
      expect(route).toHaveBeenCalledWith("/");
    });
  });

  it("delete cancelled does not delete", async () => {
    const phrase = makePhrase({ id: "keep-id" });
    apiMock.getPhrase.mockResolvedValue(phrase);
    vi.spyOn(window, "confirm").mockReturnValue(false);

    const user = userEvent.setup();

    render(<PhraseDetail id="keep-id" />);

    await waitFor(() => screen.getByText("Delete"));
    await user.click(screen.getByText("Delete"));

    expect(apiMock.deletePhrase).not.toHaveBeenCalled();
  });

  it("shows error on load failure", async () => {
    apiMock.getPhrase.mockRejectedValue(new Error("Not found"));

    render(<PhraseDetail id="bad-id" />);

    await waitFor(() => {
      expect(screen.getByText("Not found")).toBeInTheDocument();
    });
  });

  it("shows error on delete failure", async () => {
    const phrase = makePhrase({ id: "fail-del" });
    apiMock.getPhrase.mockResolvedValue(phrase);
    apiMock.deletePhrase.mockRejectedValue(new Error("Delete failed"));
    vi.spyOn(window, "confirm").mockReturnValue(true);

    const user = userEvent.setup();

    render(<PhraseDetail id="fail-del" />);

    await waitFor(() => screen.getByText("Delete"));
    await user.click(screen.getByText("Delete"));

    await waitFor(() => {
      expect(screen.getByText("Delete failed")).toBeInTheDocument();
    });
  });
});
