import { useEffect, useState } from "preact/hooks";
import { route } from "preact-router";
import { getPhrase, updatePhrase } from "../api";
import TagInput from "../components/TagInput";

interface Props {
  path?: string;
  id?: string;
}

export default function PhraseForm({ id }: Props) {
  const [phrase, setPhrase] = useState("");
  const [meanings, setMeanings] = useState<string[]>([""]);
  const [source, setSource] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    getPhrase(id).then((p) => {
      setPhrase(p.phrase);
      setMeanings(p.meanings.length > 0 ? p.meanings : [""]);
      setSource(p.source || "");
      setTags(p.tags);
      setMemo(p.memo || "");
    });
  }, [id]);

  const addMeaning = () => setMeanings([...meanings, ""]);

  const removeMeaning = (index: number) => {
    setMeanings(meanings.filter((_, i) => i !== index));
  };

  const updateMeaning = (index: number, value: string) => {
    const updated = [...meanings];
    updated[index] = value;
    setMeanings(updated);
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!id) return;
    const trimmedMeanings = meanings.map((m) => m.trim()).filter((m) => m);
    if (!phrase.trim() || trimmedMeanings.length === 0) return;

    setLoading(true);
    setError("");

    try {
      await updatePhrase(id, {
        phrase: phrase.trim(),
        meanings: trimmedMeanings,
        source: source.trim() || undefined,
        tags,
        memo: memo.trim() || undefined,
      });
      route(`/phrases/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="max-w-2xl">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Edit Phrase</h2>

      {error && <p class="text-sm text-red-600 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Phrase *
          </label>
          <input
            type="text"
            value={phrase}
            onInput={(e) => setPhrase((e.target as HTMLInputElement).value)}
            class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Meanings *
          </label>
          <div class="space-y-2">
            {meanings.map((meaning, index) => (
              <div key={index} class="flex gap-2">
                <input
                  type="text"
                  value={meaning}
                  onInput={(e) =>
                    updateMeaning(
                      index,
                      (e.target as HTMLInputElement).value,
                    )
                  }
                  placeholder={`Meaning ${index + 1}`}
                  class="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {meanings.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMeaning(index)}
                    class="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded transition-colors text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addMeaning}
            class="mt-2 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors text-sm"
          >
            + Add meaning
          </button>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Source
          </label>
          <input
            type="text"
            value={source}
            onInput={(e) => setSource((e.target as HTMLInputElement).value)}
            class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <TagInput tags={tags} onChange={setTags} />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Memo
          </label>
          <textarea
            value={memo}
            onInput={(e) => setMemo((e.target as HTMLTextAreaElement).value)}
            rows={2}
            class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div class="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={loading}
            class="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : "Update"}
          </button>
          <a
            href={`/phrases/${id}`}
            class="px-4 py-1.5 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors no-underline"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
