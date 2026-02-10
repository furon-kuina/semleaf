import { useEffect, useState } from "preact/hooks";
import { route } from "preact-router";
import { createPhrase, getPhrase, updatePhrase } from "../api";
import TagInput from "../components/TagInput";

interface Props {
  path?: string;
  id?: string;
}

export default function PhraseForm({ id }: Props) {
  const isEdit = !!id;
  const [phrase, setPhrase] = useState("");
  const [meaning, setMeaning] = useState("");
  const [source, setSource] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    getPhrase(id).then((p) => {
      setPhrase(p.phrase);
      setMeaning(p.meaning);
      setSource(p.source || "");
      setTags(p.tags);
      setMemo(p.memo || "");
    });
  }, [id]);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!phrase.trim() || !meaning.trim()) return;

    setLoading(true);
    setError("");

    try {
      if (isEdit) {
        await updatePhrase(id, {
          phrase: phrase.trim(),
          meaning: meaning.trim(),
          source: source.trim() || undefined,
          tags,
          memo: memo.trim() || undefined,
        });
        route(`/phrases/${id}`);
      } else {
        const created = await createPhrase({
          phrase: phrase.trim(),
          meaning: meaning.trim(),
          source: source.trim() || undefined,
          tags,
          memo: memo.trim() || undefined,
        });
        route(`/phrases/${created.id}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="max-w-2xl">
      <h2 class="text-xl font-bold text-gray-900 mb-4">
        {isEdit ? "Edit Phrase" : "New Phrase"}
      </h2>

      {error && <p class="text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Phrase *
          </label>
          <input
            type="text"
            value={phrase}
            onInput={(e) => setPhrase((e.target as HTMLInputElement).value)}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Meaning *
          </label>
          <textarea
            value={meaning}
            onInput={(e) => setMeaning((e.target as HTMLTextAreaElement).value)}
            rows={3}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Source
          </label>
          <input
            type="text"
            value={source}
            onInput={(e) => setSource((e.target as HTMLInputElement).value)}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div class="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
          >
            {loading ? "Saving..." : isEdit ? "Update" : "Create"}
          </button>
          <a
            href={isEdit ? `/phrases/${id}` : "/"}
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors no-underline text-sm"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
