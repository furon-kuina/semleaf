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
            class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              class="text-blue-600 hover:text-blue-900"
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
          class="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={addTag}
          class="px-3 py-1.5 text-sm bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Add
        </button>
      </div>
    </div>
  );
}
