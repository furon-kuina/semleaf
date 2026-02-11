import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We need to mock fetch before importing the module
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Dynamic import to ensure fetch mock is in place
let api: typeof import("./api");

beforeEach(async () => {
  mockFetch.mockReset();
  api = await import("./api");
});

afterEach(() => {
  vi.restoreAllMocks();
});

function mockJsonResponse(data: unknown, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: () => Promise.resolve(data),
  });
}

describe("getAuthStatus", () => {
  it("calls /api/auth/me", async () => {
    mockJsonResponse({ authenticated: true, email: "test@example.com" });
    const result = await api.getAuthStatus();
    expect(mockFetch).toHaveBeenCalledWith("/api/auth/me", expect.objectContaining({
      headers: expect.objectContaining({ "Content-Type": "application/json" }),
    }));
    expect(result).toEqual({ authenticated: true, email: "test@example.com" });
  });
});

describe("logout", () => {
  it("calls /api/auth/logout with POST", async () => {
    mockJsonResponse({ ok: true });
    await api.logout();
    expect(mockFetch).toHaveBeenCalledWith("/api/auth/logout", expect.objectContaining({
      method: "POST",
    }));
  });
});

describe("createPhrase", () => {
  it("calls /api/phrases with POST and body", async () => {
    const phrase = { phrase: "test", meaning: "a test" };
    mockJsonResponse({ id: "1", ...phrase, source: null, tags: [], memo: null, created_at: "", updated_at: "" });
    await api.createPhrase(phrase);
    expect(mockFetch).toHaveBeenCalledWith("/api/phrases", expect.objectContaining({
      method: "POST",
      body: JSON.stringify(phrase),
    }));
  });
});

describe("getPhrase", () => {
  it("calls /api/phrases/:id with GET", async () => {
    mockJsonResponse({ id: "abc", phrase: "hello", meaning: "greeting" });
    await api.getPhrase("abc");
    expect(mockFetch).toHaveBeenCalledWith("/api/phrases/abc", expect.objectContaining({
      headers: expect.objectContaining({ "Content-Type": "application/json" }),
    }));
  });
});

describe("updatePhrase", () => {
  it("calls /api/phrases/:id with PUT", async () => {
    const update = { phrase: "updated" };
    mockJsonResponse({ id: "abc", phrase: "updated", meaning: "test" });
    await api.updatePhrase("abc", update);
    expect(mockFetch).toHaveBeenCalledWith("/api/phrases/abc", expect.objectContaining({
      method: "PUT",
      body: JSON.stringify(update),
    }));
  });
});

describe("deletePhrase", () => {
  it("calls /api/phrases/:id with DELETE", async () => {
    mockJsonResponse({ ok: true });
    await api.deletePhrase("abc");
    expect(mockFetch).toHaveBeenCalledWith("/api/phrases/abc", expect.objectContaining({
      method: "DELETE",
    }));
  });
});

describe("semanticSearch", () => {
  it("calls /api/search/semantic with POST", async () => {
    mockJsonResponse([]);
    await api.semanticSearch({ query: "test" });
    expect(mockFetch).toHaveBeenCalledWith("/api/search/semantic", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ query: "test" }),
    }));
  });
});

describe("textSearch", () => {
  it("encodes query params correctly", async () => {
    mockJsonResponse([]);
    await api.textSearch("hello world", 10);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/search/text?q=hello%20world&limit=10",
      expect.anything(),
    );
  });
});

describe("error handling", () => {
  it("401 redirects to /login", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: () => Promise.resolve({ error: "Unauthorized" }),
    });

    await expect(api.getAuthStatus()).rejects.toThrow("Unauthorized");
    expect(window.location.href).toBe("/login");
  });

  it("non-ok response throws with error message", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: () => Promise.resolve({ error: "Invalid input" }),
    });

    await expect(api.getPhrase("bad")).rejects.toThrow("Invalid input");
  });
});
