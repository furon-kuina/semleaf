import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import PhraseTable from "./PhraseTable";
import { makePhrase, makeFullPhrase } from "../test/helpers";

vi.mock("../api", () => ({
  deletePhrase: vi.fn().mockResolvedValue({ ok: true }),
}));

describe("PhraseTable", () => {
  it("renders header columns", () => {
    render(<PhraseTable phrases={[makePhrase()]} />);
    expect(screen.getByText("Phrase")).toBeInTheDocument();
    expect(screen.getByText("Meanings")).toBeInTheDocument();
  });

  it("renders phrase data in rows", () => {
    const phrases = [
      makePhrase({ phrase: "hello", meanings: ["greeting"] }),
      makePhrase({ phrase: "world", meanings: ["earth"] }),
    ];
    render(<PhraseTable phrases={phrases} />);
    expect(screen.getByText("hello")).toBeInTheDocument();
    expect(screen.getByText("world")).toBeInTheDocument();
    expect(screen.getByText("greeting")).toBeInTheDocument();
    expect(screen.getByText("earth")).toBeInTheDocument();
  });

  it("shows empty state when no phrases", () => {
    render(<PhraseTable phrases={[]} />);
    expect(screen.getByText("No phrases yet.")).toBeInTheDocument();
  });

  it("expands row on click to show details", async () => {
    const phrase = makeFullPhrase({
      phrase: "test",
      memo: "A test memo",
      source: "Test Book",
    });
    const user = userEvent.setup();

    render(<PhraseTable phrases={[phrase]} />);

    // Memo is not visible initially
    expect(screen.queryByText("A test memo")).not.toBeInTheDocument();

    // Click to expand
    await user.click(screen.getByText("test"));

    // Now details are visible
    expect(screen.getByText("A test memo")).toBeInTheDocument();
    expect(screen.getByText("Test Book")).toBeInTheDocument();
  });

  it("calls onEditPhrase when edit button is clicked", async () => {
    const phrase = makePhrase({ phrase: "editable" });
    const onEdit = vi.fn();
    const user = userEvent.setup();

    render(<PhraseTable phrases={[phrase]} onEditPhrase={onEdit} />);

    const editButton = screen.getByLabelText("Edit");
    await user.click(editButton);

    expect(onEdit).toHaveBeenCalledWith(phrase);
  });
});
