import type { ComponentChildren } from "preact";
import { useState } from "preact/hooks";
import PhraseFormModal from "./PhraseFormModal";
import SearchBox from "./SearchBox";
import Sidebar from "./Sidebar";
import type { Phrase } from "../types";

interface Props {
  children: ComponentChildren;
  email?: string;
  currentUrl?: string;
  onPhraseCreated?: () => void;
}

export default function Layout({
  children,
  email,
  currentUrl = "/",
  onPhraseCreated,
}: Props) {
  const [showModal, setShowModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleCreated = (_created: Phrase) => {
    setShowModal(false);
    onPhraseCreated?.();
  };

  // Extract search query from URL if on search page
  const searchQuery =
    currentUrl.startsWith("/search") ?
      new URLSearchParams(currentUrl.split("?")[1] || "").get("q") || undefined
    : undefined;

  return (
    <div class="h-screen flex flex-col bg-[#F8F9FA]">
      {/* Header */}
      <header class="h-14 flex-shrink-0 flex items-center justify-between px-6 bg-white border-b border-gray-200">
        {/* Left: Logo */}
        <div class="flex items-center gap-2.5">
          {email && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              class="md:hidden p-1 -ml-1 text-gray-500 hover:text-gray-700 rounded"
              aria-label="Toggle sidebar"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="2"
              >
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          )}
          <a href="/" class="flex items-center gap-2.5 no-underline">
            <svg
              class="w-5 h-5 text-primary-500"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.5S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
            </svg>
            <span class="text-base font-bold text-gray-900 font-mono">
              eemee
            </span>
          </a>
        </div>

        {/* Center: Search */}
        {email && <SearchBox currentQuery={searchQuery} />}

        {/* Right: Actions */}
        {email && (
          <div class="flex items-center gap-2">
            <button
              onClick={() => setShowModal(true)}
              class="flex items-center gap-1.5 px-3 h-8 text-[13px] font-medium bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
            >
              <svg
                class="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="2.5"
              >
                <path d="M12 5v14M5 12h14" stroke-linecap="round" />
              </svg>
              New Phrase
            </button>
          </div>
        )}
      </header>

      <div class="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {email && (
          <>
            {sidebarOpen && (
              <div
                class="fixed inset-0 bg-black/30 z-20 md:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            <aside
              class={`w-[220px] bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto
                fixed top-14 bottom-0 left-0 z-30 transition-transform duration-150 ease-in-out
                md:static md:z-auto md:transition-none md:translate-x-0
                ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
              <Sidebar currentUrl={currentUrl} />
            </aside>
          </>
        )}

        {/* Main content */}
        <main class="flex-1 overflow-y-auto">
          <div class="p-6">{children}</div>
        </main>
      </div>

      <PhraseFormModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
