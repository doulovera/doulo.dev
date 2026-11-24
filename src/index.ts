import { listLinks, resolveLink, type KVNamespace } from "./links";
import { renderLandingPage, renderNotFoundPage } from "./page";

interface Env {
  LINKS: KVNamespace;
}

function decodeSlug(pathname: string): string {
  const trimmed = pathname.replace(/^\/+|\/+$/g, "");
  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { Allow: "GET, HEAD" },
      });
    }

    const { pathname } = new URL(request.url);
    const slug = decodeSlug(pathname);

    if (!slug) {
      const links = await listLinks(env.LINKS);
      return new Response(renderLandingPage(links), {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=300",
        },
      });
    }

    const destination = await resolveLink(env.LINKS, slug);
    if (destination) {
      return Response.redirect(destination, 302);
    }

    return new Response(renderNotFoundPage(), {
      status: 404,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  },
};
