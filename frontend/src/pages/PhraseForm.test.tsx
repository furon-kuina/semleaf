import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import PhraseForm from "./PhraseForm";
import { makeFullPhrase } from "../test/helpers";

vi.mock("../api", () => ({
  createPhrase: vi.fn(),
  getPhrase: vi.fn(),
  updatePhrase: vi.fn(),
}));

vi.mock("preact-router", () => ({
  route: vi.fn(),
}));

let apiMock: {
  createPhrase: ReturnType<typeof vi.fn>;
  getPhrase: ReturnType<typeof vi.fn>;
  updatePhrase: ReturnType<typeof vi.fn>;
};

beforeEach(async () => {
  apiMock = (await import("../api")) as typeof apiMock;
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
  describe("create mode", () => {
    it("shows New Phrase heading", () => {
      render(<PhraseForm />);
      expect(screen.getByText("New Phrase")).toBeInTheDocument();
    });

    it("submit calls createPhrase and navigates", async () => {
      apiMock.createPhrase.mockResolvedValue({
        id: "new-id",
        phrase: "test",
        meanings: ["a test"],
      });
      const { route } = await import("preact-router");
      const user = userEvent.setup();

      render(<PhraseForm />);

      const phraseInput = getInputByLabel("Phrase *");
      const meaningInput = screen.getByPlaceholderText("Meaning 1");

      await user.type(phraseInput, "test");
      await user.type(meaningInput, "a test");
      await user.click(screen.getByText("Create"));

      await waitFor(() => {
        expect(apiMock.createPhrase).toHaveBeenCalledWith(
          expect.objectContaining({
            phrase: "test",
            meanings: ["a test"],
          }),
        );
        expect(route).toHaveBeenCalledWith("/phrases/new-id");
      });
    });

    it("does not submit with empty required fields", async () => {
      const user = userEvent.setup();
      render(<PhraseForm />);

      await user.click(screen.getByText("Create"));

      expect(apiMock.createPhrase).not.toHaveBeenCalled();
    });

    it("shows error on failure", async () => {
      apiMock.createPhrase.mockRejectedValue(new Error("Server error"));
      const user = userEvent.setup();

      render(<PhraseForm />);

      const phraseInput = getInputByLabel("Phrase *");
      const meaningInput = screen.getByPlaceholderText("Meaning 1");

      await user.type(phraseInput, "test");
      await user.type(meaningInput, "a test");
      await user.click(screen.getByText("Create"));

      await waitFor(() => {
        expect(screen.getByText("Server error")).toBeInTheDocument();
      });
    });
  });

  describe("edit mode", () => {
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
});
