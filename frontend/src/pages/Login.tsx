export default function Login() {
  return (
    <div class="flex flex-col items-center justify-center min-h-[60vh]">
      <div class="w-full max-w-[400px] bg-white rounded-lg shadow-sm border border-gray-200 p-8 flex flex-col items-center gap-5">
        <div class="flex items-center gap-2">
          <svg
            class="w-6 h-6 text-primary-500"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.5S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
          </svg>
          <h1 class="text-2xl font-semibold text-gray-900">eemee</h1>
        </div>
        <p class="text-sm text-gray-500">Sign in to continue</p>
        <a
          href="/api/auth/google"
          class="w-full px-5 py-2.5 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors flex items-center justify-center gap-3 no-underline text-sm font-medium"
        >
          Continue with Google
        </a>
        <p class="text-xs text-gray-400">Access is restricted to authorized users.</p>
      </div>
    </div>
  );
}
