import { useEffect, useRef, useState } from "preact/hooks";
import { createPhrase, updatePhrase } from "../api";
import type { Phrase } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (phrase: Phrase) => void;
  editPhrase?: Phrase | null;
}

export default function PhraseFormModal({
  open,
  onClose,
  onCreated,
  editPhrase,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [phrase, setPhrase] = useState("");
  const [meanings, setMeanings] = useState<string[]>([""]);
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!editPhrase;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (editPhrase) {
      setPhrase(editPhrase.phrase);
      setMeanings(
        editPhrase.meanings.length > 0 ? [...editPhrase.meanings] : [""],
      );
      setMemo(editPhrase.memo || "");
    }
  }, [editPhrase]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  const resetForm = () => {
    setPhrase("");
    setMeanings([""]);
    setMemo("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === dialogRef.current) {
      handleClose();
    }
  };

  const addMeaning = () => setMeanings([...meanings, ""]);

  const removeMeaning = (index: number) => {
    setMeanings(meanings.filter((_, i) => i !== index));
  };

  const updateMeaning = (index: number, value: string) => {
    const updated = [...meanings];
    updated[index] = value;
    setMeanings(updated);
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const trimmedMeanings = meanings.map((m) => m.trim()).filter((m) => m);
    if (!phrase.trim() || trimmedMeanings.length === 0) return;

    setLoading(true);
    setError("");

    try {
      let result: Phrase;
      if (isEdit) {
        result = await updatePhrase(editPhrase.id, {
          phrase: phrase.trim(),
          meanings: trimmedMeanings,
          memo: memo.trim() || undefined,
        });
      } else {
        result = await createPhrase({
          phrase: phrase.trim(),
          meanings: trimmedMeanings,
          memo: memo.trim() || undefined,
        });
      }
      resetForm();
      onCreated(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      class="p-0 rounded shadow-lg backdrop:bg-black/50 max-w-2xl w-full"
    >
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">
            {isEdit ? "Edit Phrase" : "New Phrase"}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            class="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {error && <p class="text-sm text-red-600 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Phrase *
            </label>
            <textarea
              value={phrase}
              onInput={(e) =>
                setPhrase((e.target as HTMLTextAreaElement).value)
              }
              rows={2}
              class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Meanings *
            </label>
            <div class="space-y-2">
              {meanings.map((meaning, index) => (
                <div key={index} class="flex gap-2">
                  <input
                    type="text"
                    value={meaning}
                    onInput={(e) =>
                      updateMeaning(
                        index,
                        (e.target as HTMLInputElement).value,
                      )
                    }
                    placeholder={`Meaning ${index + 1}`}
                    class="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                  {meanings.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMeaning(index)}
                      class="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded transition-colors text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addMeaning}
              class="mt-2 px-3 py-1 text-primary-500 hover:bg-orange-50 rounded transition-colors text-sm"
            >
              + Add meaning
            </button>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Memo
            </label>
            <textarea
              value={memo}
              onInput={(e) =>
                setMemo((e.target as HTMLTextAreaElement).value)
              }
              rows={2}
              class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div class="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              class="px-4 py-1.5 bg-primary-500 text-white text-sm rounded hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Phrase"}
            </button>
            <button
              type="button"
              onClick={handleClose}
              class="px-4 py-1.5 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
