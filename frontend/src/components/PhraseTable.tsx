import { useState } from "preact/hooks";
import { deletePhrase } from "../api";
import type { Phrase } from "../types";

interface Props {
  phrases: Phrase[];
  onPhraseDeleted?: (id: string) => void;
  onEditPhrase?: (phrase: Phrase) => void;
}

export default function PhraseTable({
  phrases,
  onPhraseDeleted,
  onEditPhrase,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: Event, phrase: Phrase) => {
    e.stopPropagation();
    if (!confirm(`Delete "${phrase.phrase}"?`)) return;
    setDeletingId(phrase.id);
    try {
      await deletePhrase(phrase.id);
      onPhraseDeleted?.(phrase.id);
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (e: Event, phrase: Phrase) => {
    e.stopPropagation();
    onEditPhrase?.(phrase);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (phrases.length === 0) {
    return <p class="text-sm text-gray-400 py-4">No phrases yet.</p>;
  }

  return (
    <div class="border border-gray-200 rounded-lg bg-white overflow-hidden">
      {/* Table Header */}
      <div class="flex items-center gap-4 h-10 px-4 bg-[#F9FAFB] border-b border-gray-200">
        <span class="flex-1 text-xs font-semibold text-gray-500">
          Phrase
        </span>
        <span class="flex-1 text-xs font-semibold text-gray-500">
          Meanings
        </span>
        <span class="w-11" />
      </div>

      {/* Rows */}
      {phrases.map((phrase) => (
        <div key={phrase.id}>
          {/* Row */}
          <div
            onClick={() => toggleExpand(phrase.id)}
            class={`flex items-center gap-4 h-10 px-4 cursor-pointer transition-colors ${
              expandedId === phrase.id
                ? "bg-primary-50"
                : "hover:bg-gray-50"
            } ${expandedId !== phrase.id ? "border-b border-gray-100" : ""}`}
          >
            <span
              class={`flex-1 text-[13px] truncate pr-2 ${
                expandedId === phrase.id
                  ? "font-medium text-gray-900"
                  : "text-gray-900"
              }`}
            >
              {phrase.phrase}
            </span>
            <span class="flex-1 text-[13px] text-gray-500 truncate pr-2">
              {phrase.meanings.join(" / ")}
            </span>
            <div class="flex items-center gap-3">
              <button
                onClick={(e) => handleEdit(e, phrase)}
                class="text-[#D4D4D8] hover:text-gray-600 transition-colors"
                aria-label="Edit"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  stroke-width="2"
                >
                  <path
                    d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
              <button
                onClick={(e) => handleDelete(e, phrase)}
                disabled={deletingId === phrase.id}
                class="text-[#D4D4D8] hover:text-red-500 transition-colors disabled:opacity-50"
                aria-label="Delete"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  stroke-width="2"
                >
                  <path
                    d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Expanded detail */}
          {expandedId === phrase.id && (
            <div class="border-b border-gray-200">
              <div class="px-6 py-4 flex flex-col gap-1.5">
                {phrase.source && (
                  <div class="flex items-center gap-2 h-8">
                    <span class="w-20 text-xs font-medium text-gray-400">
                      Source
                    </span>
                    <span class="text-xs text-gray-700">
                      {phrase.source}
                    </span>
                  </div>
                )}
                {phrase.tags.length > 0 && (
                  <div class="flex items-center gap-2 h-8">
                    <span class="w-20 text-xs font-medium text-gray-400">
                      Tags
                    </span>
                    <div class="flex items-center gap-1">
                      {phrase.tags.map((tag, i) => (
                        <span
                          key={i}
                          class={`inline-flex items-center h-5 px-1.5 text-[11px] rounded ${
                            i % 2 === 0
                              ? "bg-gray-100 text-gray-700"
                              : "bg-primary-50 text-primary-700"
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {phrase.memo && (
                  <div class="flex items-center gap-2 h-8">
                    <span class="w-20 text-xs font-medium text-gray-400">
                      Memo
                    </span>
                    <span class="text-xs text-gray-700">
                      {phrase.memo}
                    </span>
                  </div>
                )}
                <div class="flex items-center gap-2 h-8">
                  <span class="w-20 text-xs font-medium text-gray-400">
                    Added
                  </span>
                  <span class="text-xs text-gray-700">
                    {new Date(phrase.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                {phrase.meanings.length > 0 && (
                  <div class="flex flex-col gap-1.5 pt-2">
                    <span class="text-xs font-medium text-gray-400">
                      Meanings
                    </span>
                    {phrase.meanings.map((m, i) => (
                      <span
                        key={i}
                        class="text-xs text-gray-700 leading-relaxed"
                      >
                        {i + 1}. {m}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
