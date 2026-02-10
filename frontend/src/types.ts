export interface Phrase {
  id: string;
  phrase: string;
  meaning: string;
  source: string | null;
  tags: string[];
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePhraseRequest {
  phrase: string;
  meaning: string;
  source?: string;
  tags?: string[];
  memo?: string;
}

export interface UpdatePhraseRequest {
  phrase?: string;
  meaning?: string;
  source?: string;
  tags?: string[];
  memo?: string;
}

export interface SemanticSearchRequest {
  query: string;
  limit?: number;
}

export type SearchMode = "semantic" | "text";

export interface AuthStatus {
  authenticated: boolean;
  email?: string;
}
