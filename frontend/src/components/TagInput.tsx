import { useState } from "preact/hooks";

interface Props {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export default function TagInput({ tags, onChange }: Props) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const tag = input.trim();
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag]);
    }
    setInput("");
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div>
      <div class="flex gap-1 flex-wrap mb-2">
        {tags.map((tag) => (
          <span
            key={tag}
            class="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-sm rounded"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              class="text-gray-500 hover:text-gray-700"
            >
              &times;
            </button>
          </span>
        ))}
      </div>
      <div class="flex gap-2">
        <input
          type="text"
          value={input}
          onInput={(e) => setInput((e.target as HTMLInputElement).value)}
          onKeyDown={handleKeyDown}
          placeholder="Add tag..."
          class="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="button"
          onClick={addTag}
          class="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}
