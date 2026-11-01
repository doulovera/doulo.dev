/**
 * Link shortener.
 *
 * Static assets in ./public are served first. Any request that doesn't match a
 * file lands here: the path (minus slashes) is looked up in the LINKS KV
 * namespace and, if found, redirected to the stored URL.
 *
 * Add links manually in KV:  key = slug (e.g. "gh"), value = full URL.
 */

interface KVNamespace {
  get(key: string): Promise<string | null>;
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

    if (slug) {
      const target = await env.LINKS.get(slug);
      if (target && isHttpUrl(target.trim())) {
        return Response.redirect(target.trim(), 302);
      }
    }

    return notFound();
  },
};

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
  <link rel="stylesheet" href="/styles.css" />
</head>
<body>
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
