import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import TagInput from "./TagInput";

describe("TagInput", () => {
  it("renders existing tags", () => {
    render(<TagInput tags={["react", "preact"]} onChange={() => {}} />);
    expect(screen.getByText("react")).toBeInTheDocument();
    expect(screen.getByText("preact")).toBeInTheDocument();
  });

  it("adds tag via Add button", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TagInput tags={[]} onChange={onChange} />);

    const input = screen.getByPlaceholderText("Add tag...");
    await user.type(input, "newtag");
    await user.click(screen.getByText("Add"));

    expect(onChange).toHaveBeenCalledWith(["newtag"]);
  });

  it("adds tag via Enter key", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TagInput tags={[]} onChange={onChange} />);

    const input = screen.getByPlaceholderText("Add tag...");
    await user.type(input, "entertag{Enter}");

    expect(onChange).toHaveBeenCalledWith(["entertag"]);
  });

  it("clears input after adding", async () => {
    const user = userEvent.setup();
    render(<TagInput tags={[]} onChange={() => {}} />);

    const input = screen.getByPlaceholderText("Add tag...");
    await user.type(input, "cleartag");
    await user.click(screen.getByText("Add"));

    expect(input).toHaveValue("");
  });

  it("prevents duplicate tags", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TagInput tags={["existing"]} onChange={onChange} />);

    const input = screen.getByPlaceholderText("Add tag...");
    await user.type(input, "existing");
    await user.click(screen.getByText("Add"));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("trims whitespace", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TagInput tags={[]} onChange={onChange} />);

    const input = screen.getByPlaceholderText("Add tag...");
    await user.type(input, "  spacey  ");
    await user.click(screen.getByText("Add"));

    expect(onChange).toHaveBeenCalledWith(["spacey"]);
  });

  it("does not add empty tags", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TagInput tags={[]} onChange={onChange} />);

    await user.click(screen.getByText("Add"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("removes tag on × click", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TagInput tags={["keep", "remove"]} onChange={onChange} />);

    const removeButtons = screen.getAllByText("×");
    await user.click(removeButtons[1]!);

    expect(onChange).toHaveBeenCalledWith(["keep"]);
  });
});
