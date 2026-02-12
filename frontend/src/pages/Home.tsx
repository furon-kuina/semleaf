import { useEffect, useState } from "preact/hooks";
import { route } from "preact-router";
import SearchBox from "../components/SearchBox";
import PhraseCard from "../components/PhraseCard";
import PhraseFormModal from "../components/PhraseFormModal";
import { listPhrases } from "../api";
import type { Phrase, SearchMode } from "../types";

interface Props {
  path?: string;
}

export default function Home(_props: Props) {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

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
    <div>
      <div class="flex items-center justify-end mb-4">
        <button
          onClick={() => setShowModal(true)}
          class="px-3 py-1.5 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
        >
          + New Phrase
        </button>
      </div>

      <div class="mb-6">
        <SearchBox onSearch={handleSearch} />
      </div>

      <PhraseFormModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={(created) => {
          setPhrases([created, ...phrases]);
          setShowModal(false);
        }}
      />

      <div class="mt-6">
        <h2 class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
          Recent Phrases
        </h2>
        {loading ? (
          <p class="text-sm text-gray-400">Loading...</p>
        ) : phrases.length > 0 ? (
          <div class="border border-gray-200 rounded divide-y divide-gray-200">
            {phrases.map((p) => (
              <PhraseCard key={p.id} phrase={p} />
            ))}
          </div>
        ) : (
          <p class="text-sm text-gray-400">No phrases yet.</p>
        )}
      </div>
    </div>
  );
}
