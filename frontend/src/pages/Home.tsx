import { route } from "preact-router";
import SearchBox from "../components/SearchBox";
import type { SearchMode } from "../types";

interface Props {
  path?: string;
}

export default function Home(_props: Props) {
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
    </div>
  );
}
