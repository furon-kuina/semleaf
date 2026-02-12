interface Props {
  currentUrl: string;
}

interface NavItem {
  label: string;
  href: string;
  matchPaths: string[];
  icon: "search" | "list";
}

const viewItems: NavItem[] = [
  { label: "Search", href: "/", matchPaths: ["/", "/search"], icon: "search" },
  {
    label: "Phrases",
    href: "/",
    matchPaths: ["/phrases"],
    icon: "list",
  },
];

function NavIcon({ type }: { type: NavItem["icon"] }) {
  const cls = "w-4 h-4 flex-shrink-0";
  switch (type) {
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
    case "list":
      return (
        <svg
          class={cls}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          stroke-width="2"
        >
          <path d="M4 6h16M4 12h16M4 18h12" stroke-linecap="round" />
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
    <nav class="h-full overflow-y-auto py-3">
      <div class="px-4 mb-1">
        <span class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Views
        </span>
      </div>
      {viewItems.map((item) => (
        <a
          key={item.label}
          href={item.href}
          class={`flex items-center gap-2.5 mx-2 px-2 h-8 text-sm rounded no-underline transition-colors ${
            isActive(item)
              ? "bg-gray-200 text-gray-900 font-medium"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <NavIcon type={item.icon} />
          {item.label}
        </a>
      ))}
    </nav>
  );
}
