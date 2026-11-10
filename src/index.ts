/**
 * Link shortener.
 *
 * Static assets in ./public are served first. Any request that doesn't match a
 * file lands here: the path (minus slashes) is looked up in the LINKS KV
 * namespace and, if found, redirected to the stored URL.
 *
 * Add links manually in KV:  key = slug (e.g. "gh"), value = full URL.
 *
 * /l lists every short link in the namespace.
 */

interface KVNamespace {
  get(key: string): Promise<string | null>;
  list(options?: { cursor?: string }): Promise<{
    keys: { name: string }[];
    list_complete: boolean;
    cursor?: string;
  }>;
}

interface Env {
  LINKS: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
    }

    const { pathname } = new URL(request.url);
    const slug = safeDecode(pathname.replace(/^\/+|\/+$/g, ""));

    if (slug === "l") {
      return linksPage(env);
    }

    if (slug) {
      const target = await env.LINKS.get(slug);
      if (target && isHttpUrl(target.trim())) {
        return Response.redirect(target.trim(), 302);
      }
    }

    return notFound();
  },
};

async function linksPage(env: Env): Promise<Response> {
  // KV list() returns key names only (max 1000 per page), so values are read in parallel.
  const names: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await env.LINKS.list({ cursor });
    names.push(...page.keys.map((k) => k.name));
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  const values = await Promise.all(names.map((name) => env.LINKS.get(name)));
  const items = names
    .map((name, i) => ({ name, url: values[i]?.trim() ?? "" }))
    .filter(({ url }) => isHttpUrl(url))
    .map(
      ({ name, url }) =>
        `<li><a href="${escapeHtml(url)}">/${escapeHtml(name)}</a><span>${escapeHtml(url)}</span></li>`,
    )
    .join("\n      ");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Links — Douglas Lovera</title>
  <meta name="theme-color" content="#08080a" />
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      min-height: 100svh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 24px;
      padding: 40px 16px;
      background: #08080a;
      color: #f2f2ee;
      font: 14px/1.6 ui-monospace, "SFMono-Regular", Menlo, monospace;
      text-align: center;
    }
    h1 { font: 700 14px/1 system-ui, sans-serif; letter-spacing: 0.12em; }
    ul { list-style: none; display: grid; gap: 6px; max-width: 100%; }
    li { display: flex; gap: 12px; justify-content: center; min-width: 0; }
    a { color: inherit; }
    span { color: #94949c; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  </style>
</head>
<body>
  <h1>DOUGLAS LOVERA</h1>
  <ul>
      ${items}
  </ul>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300" },
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function notFound(): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Not found — Douglas Lovera</title>
  <meta name="theme-color" content="#08080a" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,700..900&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/styles.css" />
  <script src="/app.js" defer></script>
</head>
<body>
  <canvas class="backdrop" aria-hidden="true"></canvas>
  <main class="page">
    <header class="hero">
      <h1 class="hero__title"><span>404</span></h1>
      <p class="hero__subtitle"><a href="/" style="color: inherit;">Back to doulo.dev</a></p>
    </header>
  </main>
</body>
</html>`;
  return new Response(html, {
    status: 404,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
