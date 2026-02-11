import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/preact";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});

// Mock window.location for tests that redirect
Object.defineProperty(window, "location", {
  writable: true,
  value: { ...window.location, href: "/", assign: vi.fn(), replace: vi.fn() },
});
