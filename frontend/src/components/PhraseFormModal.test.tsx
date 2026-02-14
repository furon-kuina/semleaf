import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import PhraseFormModal from "./PhraseFormModal";

vi.mock("../api", () => ({
  createPhrase: vi.fn(),
  updatePhrase: vi.fn(),
}));

let apiMock: {
  createPhrase: ReturnType<typeof vi.fn>;
  updatePhrase: ReturnType<typeof vi.fn>;
};

// Mock HTMLDialogElement methods
beforeEach(async () => {
  apiMock = (await import("../api")) as unknown as typeof apiMock;
  vi.clearAllMocks();

  HTMLDialogElement.prototype.showModal =
    HTMLDialogElement.prototype.showModal ||
    vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    });
  HTMLDialogElement.prototype.close =
    HTMLDialogElement.prototype.close ||
    vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute("open");
    });
});

function getInputByLabel(
  labelText: string,
): HTMLInputElement | HTMLTextAreaElement {
  const labels = screen.getAllByText(labelText);
  const label = labels[0]!;
  const container = label.parentElement!;
  const input = container.querySelector(
    "input, textarea",
  ) as HTMLInputElement | HTMLTextAreaElement;
  return input;
}

describe("PhraseFormModal", () => {
  it("shows New Phrase heading when open", () => {
    render(
      <PhraseFormModal open={true} onClose={vi.fn()} onCreated={vi.fn()} />,
    );
    expect(screen.getByText("New Phrase")).toBeInTheDocument();
  });

  it("shows Edit Phrase heading when editPhrase is provided", () => {
    const phrase = {
      id: "1",
      phrase: "test",
      meanings: ["meaning"],
      source: null,
      tags: [],
      memo: null,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    };
    render(
      <PhraseFormModal
        open={true}
        onClose={vi.fn()}
        onCreated={vi.fn()}
        editPhrase={phrase}
      />,
    );
    expect(screen.getByText("Edit Phrase")).toBeInTheDocument();
  });

  it("calls onClose when Cancel is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <PhraseFormModal open={true} onClose={onClose} onCreated={vi.fn()} />,
    );

    await user.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when X button is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <PhraseFormModal open={true} onClose={onClose} onCreated={vi.fn()} />,
    );

    // The × button
    await user.click(screen.getByText("×"));
    expect(onClose).toHaveBeenCalled();
  });

  it("submits the form and calls onCreated", async () => {
    const created = {
      id: "new-id",
      phrase: "test",
      meanings: ["a test"],
      source: null,
      tags: [],
      memo: null,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    };
    apiMock.createPhrase.mockResolvedValue(created);
    const onCreated = vi.fn();
    const user = userEvent.setup();

    render(
      <PhraseFormModal open={true} onClose={vi.fn()} onCreated={onCreated} />,
    );

    const phraseInput = getInputByLabel("Phrase *");
    const meaningInput = screen.getByPlaceholderText("Meaning 1");

    await user.type(phraseInput, "test");
    await user.type(meaningInput, "a test");
    await user.click(screen.getByText("Save Phrase"));

    await waitFor(() => {
      expect(apiMock.createPhrase).toHaveBeenCalledWith(
        expect.objectContaining({
          phrase: "test",
          meanings: ["a test"],
        }),
      );
      expect(onCreated).toHaveBeenCalledWith(created);
    });
  });

  it("does not submit with empty required fields", async () => {
    const user = userEvent.setup();

    render(
      <PhraseFormModal open={true} onClose={vi.fn()} onCreated={vi.fn()} />,
    );

    await user.click(screen.getByText("Save Phrase"));

    expect(apiMock.createPhrase).not.toHaveBeenCalled();
  });

  it("shows error on failure", async () => {
    apiMock.createPhrase.mockRejectedValue(new Error("Server error"));
    const user = userEvent.setup();

    render(
      <PhraseFormModal open={true} onClose={vi.fn()} onCreated={vi.fn()} />,
    );

    const phraseInput = getInputByLabel("Phrase *");
    const meaningInput = screen.getByPlaceholderText("Meaning 1");

    await user.type(phraseInput, "test");
    await user.type(meaningInput, "a test");
    await user.click(screen.getByText("Save Phrase"));

    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument();
    });
  });

  it("shows Saving... while submitting", async () => {
    apiMock.createPhrase.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();

    render(
      <PhraseFormModal open={true} onClose={vi.fn()} onCreated={vi.fn()} />,
    );

    const phraseInput = getInputByLabel("Phrase *");
    const meaningInput = screen.getByPlaceholderText("Meaning 1");

    await user.type(phraseInput, "test");
    await user.type(meaningInput, "a test");
    await user.click(screen.getByText("Save Phrase"));

    await waitFor(() => {
      expect(screen.getByText("Saving...")).toBeInTheDocument();
    });
  });
});
