export interface Phrase {
  id: string;
  phrase: string;
  meanings: string[];
  source: string | null;
  tags: string[];
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePhraseRequest {
  phrase: string;
  meanings: string[];
  source?: string;
  tags?: string[];
  memo?: string;
}

export interface UpdatePhraseRequest {
  phrase?: string;
  meanings?: string[];
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
