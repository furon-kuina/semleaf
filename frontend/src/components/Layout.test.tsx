import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import Layout from "./Layout";

// Mock the api module
vi.mock("../api", () => ({
  logout: vi.fn().mockResolvedValue({ ok: true }),
  createPhrase: vi.fn(),
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

  it("shows email and logout when email is provided", () => {
    render(
      <Layout email="user@test.com">
        <p>Content</p>
      </Layout>,
    );

    expect(screen.getByText("user@test.com")).toBeInTheDocument();
    expect(screen.getByText("Logout")).toBeInTheDocument();
    const newButton = screen.getByText("+ New");
    expect(newButton.tagName).toBe("BUTTON");
  });

  it("hides email and logout when no email", () => {
    render(
      <Layout>
        <p>Content</p>
      </Layout>,
    );

    expect(screen.queryByText("Logout")).not.toBeInTheDocument();
    expect(screen.queryByText("+ New")).not.toBeInTheDocument();
  });

  it("logout button calls api and redirects", async () => {
    const { logout } = await import("../api");
    const user = userEvent.setup();

    render(
      <Layout email="user@test.com">
        <p>Content</p>
      </Layout>,
    );

    await user.click(screen.getByText("Logout"));

    expect(logout).toHaveBeenCalled();
  });
});
