import { useState } from "preact/hooks";
import type { SearchMode } from "../types";

interface Props {
  onSearch: (query: string, mode: SearchMode) => void;
  initialMode?: SearchMode;
}

export default function SearchBox({ onSearch, initialMode = "semantic" }: Props) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>(initialMode);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), mode);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="w-full">
      <div class="flex gap-2">
        <input
          type="text"
          value={query}
          onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
          placeholder={
            mode === "semantic"
              ? "Search by meaning..."
              : "Search by text..."
          }
          class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="submit"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Search
        </button>
      </div>
      <div class="flex gap-4 mt-2">
        <label class="flex items-center gap-1 text-sm text-gray-600 cursor-pointer">
          <input
            type="radio"
            name="mode"
            checked={mode === "semantic"}
            onChange={() => setMode("semantic")}
            class="accent-blue-600"
          />
          Semantic
        </label>
        <label class="flex items-center gap-1 text-sm text-gray-600 cursor-pointer">
          <input
            type="radio"
            name="mode"
            checked={mode === "text"}
            onChange={() => setMode("text")}
            class="accent-blue-600"
          />
          Text
        </label>
      </div>
    </form>
  );
}
