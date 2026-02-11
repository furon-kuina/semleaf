import { useEffect, useState } from "preact/hooks";
import { route } from "preact-router";
import SearchBox from "../components/SearchBox";
import PhraseCard from "../components/PhraseCard";
import { listPhrases } from "../api";
import type { Phrase, SearchMode } from "../types";

interface Props {
  path?: string;
}

export default function Home(_props: Props) {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPhrases(20)
      .then(setPhrases)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (query: string, mode: SearchMode) => {
    route(`/search?q=${encodeURIComponent(query)}&mode=${mode}`);
  };

  return (
    <div class="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <h1 class="text-4xl font-bold text-gray-900">Semleaf</h1>
      <div class="w-full max-w-lg">
        <SearchBox onSearch={handleSearch} />
      </div>
      <a
        href="/new"
        class="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors no-underline"
      >
        + New Phrase
      </a>
      {loading ? (
        <p class="text-gray-400 text-sm">Loading...</p>
      ) : phrases.length > 0 ? (
        <div class="w-full max-w-2xl flex flex-col gap-3">
          {phrases.map((p) => (
            <PhraseCard key={p.id} phrase={p} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
