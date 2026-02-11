import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/preact";
import App from "./App";

vi.mock("./api", () => ({
  getAuthStatus: vi.fn(),
  logout: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("preact-router", () => {
  const Router = ({ children }: { children: any }) => <div>{children}</div>;
  return { __esModule: true, default: Router, route: vi.fn() };
});

let apiMock: { getAuthStatus: ReturnType<typeof vi.fn> };

beforeEach(async () => {
  apiMock = (await import("./api")) as unknown as typeof apiMock;
  vi.clearAllMocks();
});

describe("App", () => {
  it("shows loading state initially", () => {
    apiMock.getAuthStatus.mockReturnValue(new Promise(() => {}));
    render(<App />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows Login when unauthenticated", async () => {
    apiMock.getAuthStatus.mockResolvedValue({ authenticated: false });
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Sign in to continue")).toBeInTheDocument();
    });
  });

  it("shows app when authenticated", async () => {
    apiMock.getAuthStatus.mockResolvedValue({
      authenticated: true,
      email: "user@example.com",
    });
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("user@example.com")).toBeInTheDocument();
    });
  });
});
