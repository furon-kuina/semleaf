import type {
  AuthStatus,
  CreatePhraseRequest,
  Phrase,
  SemanticSearchRequest,
  UpdatePhraseRequest,
} from "./types";

async function fetchJSON<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || res.statusText);
  }

  return res.json();
}

// Auth
export const getAuthStatus = () => fetchJSON<AuthStatus>("/api/auth/me");
export const logout = () => fetchJSON<{ ok: boolean }>("/api/auth/logout", { method: "POST" });

// Phrases
export const createPhrase = (data: CreatePhraseRequest) =>
  fetchJSON<Phrase>("/api/phrases", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getPhrase = (id: string) => fetchJSON<Phrase>(`/api/phrases/${id}`);

export const updatePhrase = (id: string, data: UpdatePhraseRequest) =>
  fetchJSON<Phrase>(`/api/phrases/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deletePhrase = (id: string) =>
  fetchJSON<{ ok: boolean }>(`/api/phrases/${id}`, { method: "DELETE" });

// Search
export const semanticSearch = (data: SemanticSearchRequest) =>
  fetchJSON<Phrase[]>("/api/search/semantic", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const textSearch = (q: string, limit = 20) =>
  fetchJSON<Phrase[]>(`/api/search/text?q=${encodeURIComponent(q)}&limit=${limit}`);
