import { useEffect, useState } from "preact/hooks";
import { route } from "preact-router";
import { deletePhrase, getPhrase } from "../api";
import type { Phrase } from "../types";

interface Props {
  path?: string;
  id?: string;
}

export default function PhraseDetail({ id }: Props) {
  const [phrase, setPhrase] = useState<Phrase | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    getPhrase(id)
      .then(setPhrase)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [id]);

  const handleDelete = async () => {
    if (!id || !confirm("Delete this phrase?")) return;
    try {
      await deletePhrase(id);
      route("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  if (error) return <p class="text-red-500">{error}</p>;
  if (!phrase) return <p class="text-gray-500">Loading...</p>;

  return (
    <div class="max-w-2xl">
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">{phrase.phrase}</h2>

        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium text-gray-500">
              {phrase.meanings.length === 1 ? "Meaning" : "Meanings"}
            </label>
            {phrase.meanings.length === 1 ? (
              <p class="text-gray-900 mt-1">{phrase.meanings[0]}</p>
            ) : (
              <ul class="list-disc list-inside mt-1 space-y-1">
                {phrase.meanings.map((meaning, i) => (
                  <li key={i} class="text-gray-900">
                    {meaning}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {phrase.source && (
            <div>
              <label class="text-sm font-medium text-gray-500">Source</label>
              <p class="text-gray-900 mt-1">{phrase.source}</p>
            </div>
          )}

          {phrase.tags.length > 0 && (
            <div>
              <label class="text-sm font-medium text-gray-500">Tags</label>
              <div class="flex gap-1 mt-1 flex-wrap">
                {phrase.tags.map((tag) => (
                  <span
                    key={tag}
                    class="px-2 py-0.5 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {phrase.memo && (
            <div>
              <label class="text-sm font-medium text-gray-500">Memo</label>
              <p class="text-gray-900 mt-1 whitespace-pre-wrap">{phrase.memo}</p>
            </div>
          )}

          <div class="text-xs text-gray-400">
            Created: {new Date(phrase.created_at).toLocaleString()} |
            Updated: {new Date(phrase.updated_at).toLocaleString()}
          </div>
        </div>

        <div class="flex gap-3 mt-6 pt-4 border-t border-gray-200">
          <a
            href={`/phrases/${phrase.id}/edit`}
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors no-underline text-sm"
          >
            Edit
          </a>
          <button
            onClick={handleDelete}
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            Delete
          </button>
          <a
            href="/"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors no-underline text-sm"
          >
            Back
          </a>
        </div>
      </div>
    </div>
  );
}
