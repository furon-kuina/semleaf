import { useState } from "preact/hooks";
import { route } from "preact-router";

interface Props {
  currentQuery?: string;
}

export default function SearchBox({ currentQuery }: Props) {
  const [query, setQuery] = useState(currentQuery ?? "");

  const hasQuery = !!currentQuery;

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (query.trim()) {
      route(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setQuery("");
    }
  };

  return (
    <form onSubmit={handleSubmit} class="w-[400px]">
      <div
        class={`flex items-center gap-2 h-9 rounded-md px-3 border ${
          hasQuery
            ? "bg-white border-primary-500"
            : "bg-gray-100 border-gray-200"
        }`}
      >
        <svg
          class={`w-4 h-4 flex-shrink-0 ${hasQuery ? "text-primary-500" : "text-gray-400"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          stroke-width="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" stroke-linecap="round" />
        </svg>
        <input
          type="text"
          value={query}
          onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
          onKeyDown={handleKeyDown}
          placeholder="Search by meaning..."
          class="flex-1 bg-transparent text-[13px] text-gray-900 placeholder-gray-400 outline-none"
        />
      </div>
    </form>
  );
}
