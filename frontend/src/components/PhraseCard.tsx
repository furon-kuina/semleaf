import type { Phrase } from "../types";

interface Props {
  phrase: Phrase;
}

export default function PhraseCard({ phrase }: Props) {
  return (
    <a
      href={`/phrases/${phrase.id}`}
      class="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all no-underline"
    >
      <p class="text-gray-900 font-medium">{phrase.phrase}</p>
      <p class="text-sm text-gray-600 mt-1 line-clamp-2">
        {phrase.meanings.join(" / ")}
      </p>
      {phrase.source && (
        <p class="text-xs text-gray-400 mt-2">{phrase.source}</p>
      )}
      {phrase.tags.length > 0 && (
        <div class="flex gap-1 mt-2 flex-wrap">
          {phrase.tags.map((tag) => (
            <span
              key={tag}
              class="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </a>
  );
}
