import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/preact";
import Login from "./Login";

describe("Login", () => {
  it("renders heading", () => {
    render(<Login />);
    expect(screen.getByText("eemee")).toBeInTheDocument();
  });

  it("renders sign-in text", () => {
    render(<Login />);
    expect(screen.getByText("Sign in to continue")).toBeInTheDocument();
  });

  it("renders Google OAuth link", () => {
    render(<Login />);
    const link = screen.getByText("Continue with Google");
    expect(link.closest("a")).toHaveAttribute("href", "/api/auth/google");
  });

  it("renders access restriction note", () => {
    render(<Login />);
    expect(screen.getByText("Access is restricted to authorized users.")).toBeInTheDocument();
  });
});
