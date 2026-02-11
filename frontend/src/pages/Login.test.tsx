import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/preact";
import Login from "./Login";

describe("Login", () => {
  it("renders heading", () => {
    render(<Login />);
    expect(screen.getByText("Semleaf")).toBeInTheDocument();
  });

  it("renders sign-in text", () => {
    render(<Login />);
    expect(screen.getByText("Sign in to continue")).toBeInTheDocument();
  });

  it("renders Google OAuth link", () => {
    render(<Login />);
    const link = screen.getByText("Sign in with Google");
    expect(link.closest("a")).toHaveAttribute("href", "/api/auth/google");
  });
});
