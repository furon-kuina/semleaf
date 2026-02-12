import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import PhraseForm from "./PhraseForm";
import { makeFullPhrase } from "../test/helpers";

vi.mock("../api", () => ({
  getPhrase: vi.fn(),
  updatePhrase: vi.fn(),
}));

vi.mock("preact-router", () => ({
  route: vi.fn(),
}));

let apiMock: {
  getPhrase: ReturnType<typeof vi.fn>;
  updatePhrase: ReturnType<typeof vi.fn>;
};

beforeEach(async () => {
  apiMock = (await import("../api")) as unknown as typeof apiMock;
  vi.clearAllMocks();
});

// Helper to get inputs by their label text (using DOM traversal since labels lack for/id)
function getInputByLabel(labelText: string): HTMLInputElement | HTMLTextAreaElement {
  const labels = screen.getAllByText(labelText);
  const label = labels[0]!;
  const container = label.parentElement!;
  const input = container.querySelector("input, textarea") as HTMLInputElement | HTMLTextAreaElement;
  return input;
}

describe("PhraseForm", () => {
  it("shows Edit Phrase heading and populates form", async () => {
    const phrase = makeFullPhrase({
      id: "edit-id",
      phrase: "existing",
      meanings: ["existing meaning"],
      source: "source",
      memo: "memo",
    });
    apiMock.getPhrase.mockResolvedValue(phrase);

    render(<PhraseForm id="edit-id" />);

    expect(screen.getByText("Edit Phrase")).toBeInTheDocument();

    await waitFor(() => {
      expect(getInputByLabel("Phrase *")).toHaveValue("existing");
      expect(screen.getByDisplayValue("existing meaning")).toBeInTheDocument();
    });
  });

  it("submit calls updatePhrase and navigates", async () => {
    const phrase = makeFullPhrase({ id: "edit-id", phrase: "old" });
    apiMock.getPhrase.mockResolvedValue(phrase);
    apiMock.updatePhrase.mockResolvedValue({ ...phrase, phrase: "updated" });
    const { route } = await import("preact-router");
    const user = userEvent.setup();

    render(<PhraseForm id="edit-id" />);

    await waitFor(() => {
      expect(getInputByLabel("Phrase *")).toHaveValue("old");
    });

    const phraseInput = getInputByLabel("Phrase *");
    await user.clear(phraseInput);
    await user.type(phraseInput, "updated");
    await user.click(screen.getByText("Update"));

    await waitFor(() => {
      expect(apiMock.updatePhrase).toHaveBeenCalledWith(
        "edit-id",
        expect.objectContaining({ phrase: "updated" }),
      );
      expect(route).toHaveBeenCalledWith("/phrases/edit-id");
    });
  });

  it("shows Saving... while submitting", async () => {
    const phrase = makeFullPhrase({ id: "save-id" });
    apiMock.getPhrase.mockResolvedValue(phrase);
    apiMock.updatePhrase.mockReturnValue(new Promise(() => {})); // never resolves
    const user = userEvent.setup();

    render(<PhraseForm id="save-id" />);

    await waitFor(() => {
      expect(getInputByLabel("Phrase *")).toHaveValue(phrase.phrase);
    });

    await user.click(screen.getByText("Update"));

    await waitFor(() => {
      expect(screen.getByText("Saving...")).toBeInTheDocument();
    });
  });
});
