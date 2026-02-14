import { useEffect, useState } from "preact/hooks";
import { semanticSearch, textSearch } from "../api";
import PhraseTable from "../components/PhraseTable";
import PhraseFormModal from "../components/PhraseFormModal";
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
  const [editPhrase, setEditPhrase] = useState<Phrase | null>(null);

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

  const handleDeleted = (id: string) => {
    setResults(results.filter((p) => p.id !== id));
  };

  const handleUpdated = (updated: Phrase) => {
    setResults(results.map((p) => (p.id === updated.id ? updated : p)));
    setEditPhrase(null);
  };

  return (
    <div class="flex flex-col gap-5">
      {q && !loading && !error && (
        <div class="flex items-center justify-between">
          <h1 class="text-base font-semibold text-gray-900 font-mono">
            Results for &ldquo;{q}&rdquo;
          </h1>
          <span class="text-[13px] text-gray-400">
            {results.length} results
          </span>
        </div>
      )}

      {loading && <p class="text-sm text-gray-500">Searching...</p>}
      {error && <p class="text-sm text-red-600">{error}</p>}

      {!loading && !error && results.length === 0 && q && (
        <p class="text-sm text-gray-500">No results found.</p>
      )}

      {!loading && results.length > 0 && (
        <PhraseTable
          phrases={results}
          onPhraseDeleted={handleDeleted}
          onEditPhrase={setEditPhrase}
        />
      )}

      <PhraseFormModal
        open={!!editPhrase}
        onClose={() => setEditPhrase(null)}
        onCreated={handleUpdated}
        editPhrase={editPhrase}
      />
    </div>
  );
}
