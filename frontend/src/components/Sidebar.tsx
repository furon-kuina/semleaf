interface Props {
  currentUrl: string;
}

interface NavItem {
  label: string;
  href: string;
  matchPaths: string[];
  icon: "home" | "search" | "download";
}

const navItems: NavItem[] = [
  { label: "Home", href: "/", matchPaths: ["/"], icon: "home" },
  { label: "Search", href: "/search", matchPaths: ["/search"], icon: "search" },
  { label: "Export", href: "/export", matchPaths: ["/export"], icon: "download" },
];

function NavIcon({ type }: { type: NavItem["icon"] }) {
  const cls = "w-4 h-4 flex-shrink-0";
  switch (type) {
    case "home":
      return (
        <svg
          class={cls}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          stroke-width="2"
        >
          <path
            d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M9 22V12h6v10"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      );
    case "search":
      return (
        <svg
          class={cls}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          stroke-width="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" stroke-linecap="round" />
        </svg>
      );
    case "download":
      return (
        <svg
          class={cls}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          stroke-width="2"
        >
          <path
            d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <polyline
            points="7 10 12 15 17 10"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <line
            x1="12"
            y1="15"
            x2="12"
            y2="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      );
  }
}

export default function Sidebar({ currentUrl }: Props) {
  const isActive = (item: NavItem) =>
    item.matchPaths.some(
      (p) =>
        currentUrl === p ||
        currentUrl.startsWith(p + "?") ||
        (p !== "/" && currentUrl.startsWith(p + "/")),
    );

  return (
    <nav class="h-full overflow-y-auto px-3 py-4 flex flex-col gap-1">
      <span class="px-2 mb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
        Navigation
      </span>
      {navItems.map((item) => (
        <a
          key={item.label}
          href={item.href}
          class={`flex items-center gap-2 px-2 h-9 text-[13px] rounded-md no-underline transition-colors ${
            isActive(item)
              ? "bg-primary-50 text-primary-500 font-medium"
              : "text-gray-600 hover:bg-primary-50/50"
          }`}
        >
          <NavIcon type={item.icon} />
          {item.label}
        </a>
      ))}
    </nav>
  );
}
