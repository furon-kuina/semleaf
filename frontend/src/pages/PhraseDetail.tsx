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
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load"),
      );
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

  if (error) return <p class="text-sm text-red-600">{error}</p>;
  if (!phrase) return <p class="text-gray-500">Loading...</p>;

  return (
    <div class="max-w-2xl">
      <h1 class="text-xl font-semibold text-gray-900 mb-4">
        {phrase.phrase}
      </h1>

      <div class="border border-gray-200 rounded p-5">
        <div class="space-y-4">
          <div>
            <label class="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {phrase.meanings.length === 1 ? "Meaning" : "Meanings"}
            </label>
            {phrase.meanings.length === 1 ? (
              <p class="text-sm text-gray-900 mt-1">{phrase.meanings[0]}</p>
            ) : (
              <ul class="list-disc list-inside mt-1 space-y-1">
                {phrase.meanings.map((meaning, i) => (
                  <li key={i} class="text-sm text-gray-900">
                    {meaning}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {phrase.source && (
            <div>
              <label class="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </label>
              <p class="text-sm text-gray-900 mt-1">{phrase.source}</p>
            </div>
          )}

          {phrase.tags.length > 0 && (
            <div>
              <label class="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tags
              </label>
              <div class="flex gap-1 mt-1 flex-wrap">
                {phrase.tags.map((tag) => (
                  <span
                    key={tag}
                    class="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {phrase.memo && (
            <div>
              <label class="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Memo
              </label>
              <p class="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
                {phrase.memo}
              </p>
            </div>
          )}

          <div class="text-xs text-gray-400">
            Created: {new Date(phrase.created_at).toLocaleString()} | Updated:{" "}
            {new Date(phrase.updated_at).toLocaleString()}
          </div>
        </div>

        <div class="flex gap-2 mt-5 pt-4 border-t border-gray-200">
          <a
            href={`/phrases/${phrase.id}/edit`}
            class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors no-underline"
          >
            Edit
          </a>
          <button
            onClick={handleDelete}
            class="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
          <a
            href="/"
            class="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors no-underline"
          >
            Back
          </a>
        </div>
      </div>
    </div>
  );
}
