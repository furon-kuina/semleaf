import type { Phrase } from "../types";

interface Props {
  phrase: Phrase;
}

export default function PhraseCard({ phrase }: Props) {
  return (
    <a
      href={`/phrases/${phrase.id}`}
      class="block px-4 py-3 hover:bg-gray-50 transition-colors no-underline"
    >
      <div class="flex items-baseline gap-3">
        <span class="text-sm font-medium text-gray-900">
          {phrase.phrase}
        </span>
        <span class="text-sm text-gray-500 truncate">
          {phrase.meanings.join(" / ")}
        </span>
      </div>
      {(phrase.source || phrase.tags.length > 0) && (
        <div class="flex items-center gap-2 mt-1">
          {phrase.source && (
            <span class="text-xs text-gray-400">{phrase.source}</span>
          )}
          {phrase.tags.length > 0 && (
            <div class="flex gap-1 flex-wrap">
              {phrase.tags.map((tag) => (
                <span
                  key={tag}
                  class="px-1.5 py-0 bg-gray-100 text-gray-600 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </a>
  );
}
