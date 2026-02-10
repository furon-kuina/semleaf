import { useEffect, useState } from "preact/hooks";
import { route } from "preact-router";
import { semanticSearch, textSearch } from "../api";
import PhraseCard from "../components/PhraseCard";
import SearchBox from "../components/SearchBox";
import type { Phrase, SearchMode } from "../types";

interface Props {
  path?: string;
  q?: string;
  mode?: string;
}

export default function SearchResults({ q, mode }: Props) {
  const [results, setResults] = useState<Phrase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const searchMode = (mode === "text" ? "text" : "semantic") as SearchMode;

  useEffect(() => {
    if (!q) return;

    setLoading(true);
    setError("");

    const doSearch = async () => {
      try {
        const data =
          searchMode === "semantic"
            ? await semanticSearch({ query: q })
            : await textSearch(q);
        setResults(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Search failed");
      } finally {
        setLoading(false);
      }
    };

    doSearch();
  }, [q, searchMode]);

  const handleSearch = (query: string, newMode: SearchMode) => {
    route(`/search?q=${encodeURIComponent(query)}&mode=${newMode}`);
  };

  return (
    <div>
      <div class="mb-6">
        <SearchBox onSearch={handleSearch} initialMode={searchMode} />
      </div>

      {loading && <p class="text-gray-500">Searching...</p>}
      {error && <p class="text-red-500">{error}</p>}

      {!loading && !error && results.length === 0 && q && (
        <p class="text-gray-500">No results found.</p>
      )}

      <div class="flex flex-col gap-3">
        {results.map((phrase) => (
          <PhraseCard key={phrase.id} phrase={phrase} />
        ))}
      </div>
    </div>
  );
}
