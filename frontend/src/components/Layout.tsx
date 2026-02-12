import type { ComponentChildren } from "preact";
import { useState } from "preact/hooks";
import { route } from "preact-router";
import { logout } from "../api";
import PhraseFormModal from "./PhraseFormModal";
import Sidebar from "./Sidebar";

interface Props {
  children: ComponentChildren;
  email?: string;
  currentUrl?: string;
}

export default function Layout({
  children,
  email,
  currentUrl = "/",
}: Props) {
  const [showModal, setShowModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <div class="h-screen flex flex-col bg-white">
      {/* Top header — 56px, full width, white with bottom border */}
      <header class="h-14 flex-shrink-0 flex items-center border-b border-gray-200 px-4 bg-white z-10">
        <div class="flex items-center gap-3">
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
          <a
            href="/"
            class="text-base font-semibold text-gray-900 no-underline"
          >
            Semleaf
          </a>
        </div>

        {email && (
          <div class="ml-auto flex items-center gap-3">
            <button
              onClick={() => setShowModal(true)}
              class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              + New
            </button>
            <span class="text-sm text-gray-500">{email}</span>
            <button
              onClick={handleLogout}
              class="text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </div>
        )}
      </header>

      <div class="flex flex-1 overflow-hidden">
        {/* Sidebar — only shown when authenticated */}
        {email && (
          <>
            {/* Mobile backdrop overlay */}
            {sidebarOpen && (
              <div
                class="fixed inset-0 bg-black/30 z-20 md:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            <aside
              class={`w-60 bg-gray-50 border-r border-gray-200 flex-shrink-0 overflow-y-auto
                fixed top-14 bottom-0 left-0 z-30 transition-transform duration-150 ease-in-out
                md:static md:z-auto md:transition-none md:translate-x-0
                ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
              <Sidebar currentUrl={currentUrl} />
            </aside>
          </>
        )}

        {/* Main content area */}
        <main class="flex-1 overflow-y-auto">
          <div class="p-6 max-w-4xl">{children}</div>
        </main>
      </div>

      <PhraseFormModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={(created) => {
          setShowModal(false);
          route(`/phrases/${created.id}`);
        }}
      />
    </div>
  );
}
