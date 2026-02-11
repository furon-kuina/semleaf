CREATE TABLE phrase_meanings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phrase_id UUID NOT NULL REFERENCES phrases(id) ON DELETE CASCADE,
    meaning TEXT NOT NULL,
    meaning_embedding vector(3072) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_phrase_meanings_phrase_id ON phrase_meanings(phrase_id);

-- Migrate existing data
INSERT INTO phrase_meanings (phrase_id, meaning, meaning_embedding)
SELECT id, meaning, meaning_embedding FROM phrases;

-- Drop old columns
ALTER TABLE phrases DROP COLUMN meaning;
ALTER TABLE phrases DROP COLUMN meaning_embedding;
