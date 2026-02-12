import { useState } from "preact/hooks";
import type { SearchMode } from "../types";

interface Props {
  onSearch: (query: string, mode: SearchMode) => void;
  initialMode?: SearchMode;
}

export default function SearchBox({
  onSearch,
  initialMode = "semantic",
}: Props) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>(initialMode);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), mode);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="flex items-center gap-2">
      <input
        type="text"
        value={query}
        onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
        placeholder={
          mode === "semantic" ? "Search by meaning..." : "Search by text..."
        }
        class="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
      />
      <div class="flex border border-gray-300 rounded overflow-hidden text-sm flex-shrink-0">
        <button
          type="button"
          onClick={() => setMode("semantic")}
          class={`px-3 py-1.5 transition-colors ${
            mode === "semantic"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          Semantic
        </button>
        <button
          type="button"
          onClick={() => setMode("text")}
          class={`px-3 py-1.5 border-l border-gray-300 transition-colors ${
            mode === "text"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          Text
        </button>
      </div>
      <button
        type="submit"
        class="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex-shrink-0"
      >
        Search
      </button>
    </form>
  );
}
