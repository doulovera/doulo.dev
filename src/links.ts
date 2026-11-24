export interface KVNamespace {
  get(key: string): Promise<string | null>;
  list(options?: { cursor?: string }): Promise<{
    keys: { name: string }[];
    list_complete: boolean;
    cursor?: string;
  }>;
}

export interface DockLink {
  slug: string;
  href: string;
  label: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  iconScale?: string;
}

interface LinkPreset {
  label: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  iconScale?: string;
}

const ICONS = {
  // Official Substack mark
  substack: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"/></svg>`,
  // Official GitHub Invertocat mark
  github: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z"/></svg>`,
  // Official Instagram glyph (Meta brand geometry)
  instagram: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069ZM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z"/></svg>`,
  // Official LinkedIn "in" letterforms (direct on LinkedIn blue app tile)
  linkedin: `<svg viewBox="22 22 210 210" fill="currentColor" aria-hidden="true"><path d="M218.123 218.127h-37.931v-59.403c0-14.165-.253-32.4-19.728-32.4-19.756 0-22.779 15.434-22.779 31.369v60.43h-37.93V95.967h36.413v16.694h.51a39.907 39.907 0 0 1 35.928-19.733c38.445 0 45.533 25.288 45.533 58.186l-.016 67.013ZM56.955 79.27c-12.157.002-22.014-9.852-22.016-22.009-.002-12.157 9.851-22.014 22.008-22.016 12.157-.003 22.014 9.851 22.016 22.008A22.013 22.013 0 0 1 56.955 79.27m18.966 138.858H37.95V95.967h37.97v122.16Z"/></svg>`,
  // Official X logo
  x: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>`,
  // Official YouTube play logo
  youtube: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814ZM9.545 15.568V8.432L15.818 12l-6.273 3.568Z"/></svg>`,
  web: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a13.5 13.5 0 0 1 3.6 9A13.5 13.5 0 0 1 12 21a13.5 13.5 0 0 1-3.6-9A13.5 13.5 0 0 1 12 3Z"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4.5 7 7.5 5.5L19.5 7"/></svg>`,
  resume: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.5L14.5 3Z"/><path d="M14 3v5h5"/><path d="M9 13h6"/><path d="M9 17h4"/></svg>`,
  link: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13.5a4.5 4.5 0 0 0 6.4.4l2.3-2.3a4.5 4.5 0 0 0-6.4-6.4L11 6.5"/><path d="M14 10.5a4.5 4.5 0 0 0-6.4-.4l-2.3 2.3a4.5 4.5 0 0 0 6.4 6.4l1.3-1.3"/></svg>`,
};

const PRESETS: Record<string, LinkPreset> = {
  blog: {
    label: "Substack",
    icon: ICONS.substack,
    iconBg: "linear-gradient(180deg, #ff792e 0%, #ff6719 52%, #e65409 100%)",
    iconColor: "#ffffff",
    iconScale: "52%",
  },
  substack: {
    label: "Substack",
    icon: ICONS.substack,
    iconBg: "linear-gradient(180deg, #ff792e 0%, #ff6719 52%, #e65409 100%)",
    iconColor: "#ffffff",
    iconScale: "52%",
  },
  gh: {
    label: "GitHub",
    icon: ICONS.github,
    iconBg: "linear-gradient(180deg, #2b3137 0%, #16181c 100%)",
    iconColor: "#ffffff",
    iconScale: "62%",
  },
  ig: {
    label: "Instagram",
    icon: ICONS.instagram,
    iconBg:
      "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285aeb 90%)",
    iconColor: "#ffffff",
    iconScale: "58%",
  },
  in: {
    label: "LinkedIn",
    icon: ICONS.linkedin,
    iconBg: "linear-gradient(180deg, #1278dd 0%, #0a66c2 55%, #074f99 100%)",
    iconColor: "#ffffff",
    iconScale: "64%",
  },
  x: {
    label: "X",
    icon: ICONS.x,
    iconBg: "linear-gradient(180deg, #18181b 0%, #050506 100%)",
    iconColor: "#ffffff",
    iconScale: "52%",
  },
  web: {
    label: "Website",
    icon: ICONS.web,
    iconBg: "linear-gradient(180deg, #32a8ff 0%, #0a74e5 100%)",
    iconColor: "#ffffff",
    iconScale: "56%",
  },
  mail: {
    label: "Email",
    icon: ICONS.mail,
    iconBg: "linear-gradient(180deg, #2ea3ff 0%, #0b6ae6 100%)",
    iconColor: "#ffffff",
    iconScale: "56%",
  },
  cv: {
    label: "Resume",
    icon: ICONS.resume,
    iconBg: "linear-gradient(180deg, #3a3d45 0%, #1f2126 100%)",
    iconColor: "#ffffff",
    iconScale: "54%",
  },
  yt: {
    label: "YouTube",
    icon: ICONS.youtube,
    iconBg: "linear-gradient(180deg, #ff1f1f 0%, #d90000 100%)",
    iconColor: "#ffffff",
    iconScale: "58%",
  },
};

const ALIASES: Record<string, string> = {
  github: "gh",
  linkedin: "in",
  instagram: "ig",
  twitter: "x",
  writing: "blog",
  notes: "blog",
  site: "web",
  website: "web",
  home: "web",
  email: "mail",
  contact: "mail",
  resume: "cv",
  youtube: "yt",
};

const DEFAULT_PRESET: Omit<LinkPreset, "label"> = {
  icon: ICONS.link,
  iconBg: "linear-gradient(180deg, #34363d 0%, #1c1d22 100%)",
  iconColor: "#ffffff",
  iconScale: "52%",
};

function formatLabel(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildDockLink(slug: string): DockLink {
  const normalized = slug.trim().toLowerCase();
  const key = ALIASES[normalized] ?? normalized;
  const preset = PRESETS[key];

  return {
    slug,
    href: `/${encodeURIComponent(slug)}`,
    label: preset ? preset.label : formatLabel(slug),
    icon: preset ? preset.icon : DEFAULT_PRESET.icon,
    iconBg: preset ? preset.iconBg : DEFAULT_PRESET.iconBg,
    iconColor: preset ? preset.iconColor : DEFAULT_PRESET.iconColor,
    iconScale: preset?.iconScale ?? DEFAULT_PRESET.iconScale,
  };
}

export async function listLinks(kv: KVNamespace): Promise<DockLink[]> {
  const slugs: string[] = [];
  let cursor: string | undefined;

  do {
    const page = await kv.list({ cursor });
    for (const entry of page.keys) {
      slugs.push(entry.name);
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  return slugs.map(buildDockLink);
}

export async function resolveLink(kv: KVNamespace, slug: string): Promise<string | null> {
  const raw = await kv.get(slug);
  if (!raw) return null;

  const trimmed = raw.trim();
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? trimmed : null;
  } catch {
    return null;
  }
}
