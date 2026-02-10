CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE phrases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phrase TEXT NOT NULL,
    meaning TEXT NOT NULL,
    source TEXT,
    tags TEXT[] NOT NULL DEFAULT '{}',
    memo TEXT,
    meaning_embedding vector(3072) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_phrases_created_at ON phrases (created_at DESC);
CREATE INDEX idx_phrases_tags ON phrases USING GIN (tags);
