import type { ComponentChildren } from "preact";
import { logout } from "../api";

interface Props {
  children: ComponentChildren;
  email?: string;
}

export default function Layout({ children, email }: Props) {
  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <div class="min-h-screen bg-gray-50">
      <header class="bg-white border-b border-gray-200">
        <div class="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" class="text-lg font-bold text-gray-900 no-underline">
            Semleaf
          </a>
          {email && (
            <div class="flex items-center gap-4">
              <a
                href="/new"
                class="text-sm text-blue-600 hover:text-blue-800 no-underline"
              >
                + New
              </a>
              <span class="text-sm text-gray-500">{email}</span>
              <button
                onClick={handleLogout}
                class="text-sm text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>
      <main class="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
