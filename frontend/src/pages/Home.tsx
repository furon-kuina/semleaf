import { useEffect, useState } from "preact/hooks";
import PhraseTable from "../components/PhraseTable";
import PhraseFormModal from "../components/PhraseFormModal";
import { listPhrases } from "../api";
import type { Phrase } from "../types";

interface Props {
  path?: string;
}

export default function Home(_props: Props) {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPhrase, setEditPhrase] = useState<Phrase | null>(null);

  useEffect(() => {
    listPhrases(20)
      .then(setPhrases)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDeleted = (id: string) => {
    setPhrases(phrases.filter((p) => p.id !== id));
  };

  const handleUpdated = (updated: Phrase) => {
    setPhrases(phrases.map((p) => (p.id === updated.id ? updated : p)));
    setEditPhrase(null);
  };

  return (
    <div class="flex flex-col gap-5">
      <div class="flex items-center justify-between">
        <h1 class="text-base font-semibold text-gray-900 font-mono">
          Phrases
        </h1>
        {!loading && (
          <span class="text-[13px] text-gray-400">
            {phrases.length} phrases
          </span>
        )}
      </div>

      {loading ? (
        <p class="text-sm text-gray-400">Loading...</p>
      ) : (
        <PhraseTable
          phrases={phrases}
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
