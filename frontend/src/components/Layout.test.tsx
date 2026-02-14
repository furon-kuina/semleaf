import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import Layout from "./Layout";

// Mock the api module
vi.mock("../api", () => ({
  createPhrase: vi.fn(),
  updatePhrase: vi.fn(),
}));

// Mock preact-router
vi.mock("preact-router", () => ({
  route: vi.fn(),
}));

describe("Layout", () => {
  it("renders children and header link", () => {
    render(
      <Layout>
        <p>Child content</p>
      </Layout>,
    );

    expect(screen.getByText("Child content")).toBeInTheDocument();
    expect(screen.getByText("Semleaf")).toBeInTheDocument();
    expect(screen.getByText("Semleaf").closest("a")).toHaveAttribute("href", "/");
  });

  it("shows search box and new phrase button when authenticated", () => {
    render(
      <Layout email="user@test.com">
        <p>Content</p>
      </Layout>,
    );

    expect(screen.getByPlaceholderText("Search by meaning...")).toBeInTheDocument();
    const buttons = screen.getAllByText("New Phrase");
    const headerButton = buttons.find((el) => el.tagName === "BUTTON");
    expect(headerButton).toBeDefined();
  });

  it("hides search and new phrase when no email", () => {
    render(
      <Layout>
        <p>Content</p>
      </Layout>,
    );

    expect(screen.queryByPlaceholderText("Search by meaning...")).not.toBeInTheDocument();
    const matches = screen.queryAllByText("New Phrase");
    const headerButton = matches.find((el) => el.tagName === "BUTTON");
    expect(headerButton).toBeUndefined();
  });

  it("opens phrase form modal on New Phrase click", async () => {
    const user = userEvent.setup();

    render(
      <Layout email="user@test.com">
        <p>Content</p>
      </Layout>,
    );

    const buttons = screen.getAllByText("New Phrase");
    const headerButton = buttons.find((el) => el.tagName === "BUTTON")!;
    await user.click(headerButton);

    expect(screen.getByText("Phrase *")).toBeInTheDocument();
  });
});
