import type { DockLink } from "./links";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return ch;
    }
  });
}

function renderDockItem(link: DockLink): string {
  const label = escapeHtml(link.label);
  const href = escapeHtml(link.href);
  const style = [
    `--icon-bg:${link.iconBg}`,
    `--icon-color:${link.iconColor}`,
    `--icon-scale:${link.iconScale ?? "54%"}`,
  ].join(";");

  return `
          <li class="dock-item" data-dock-item>
            <a
              class="dock-link"
              href="${href}"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="${label}"
              style="${style}"
            >
              <span class="dock-tooltip" aria-hidden="true">${label}</span>
              <span class="dock-icon" aria-hidden="true">${link.icon}</span>
              <span class="dock-indicator" aria-hidden="true"></span>
            </a>
          </li>`;
}

export function renderLandingPage(links: DockLink[]): string {
  const dockMarkup =
    links.length > 0
      ? `
      <nav class="dock-region" aria-label="Links">
        <div class="dock" data-dock>
          <div class="dock-shelf" aria-hidden="true"></div>
          <ul class="dock-list" role="list">${links.map(renderDockItem).join("")}
          </ul>
        </div>
      </nav>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>Douglas Lovera — Software Developer &amp; Engineering</title>
  <meta name="description" content="Douglas Lovera — Software Developer &amp; Engineering." />
  <meta name="theme-color" content="#000000" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/assets/main.css" />
  <script type="module" src="/assets/dock.js"></script>
</head>
<body>
  <div class="stage">
    <div class="ambient" aria-hidden="true"></div>

    <main class="hero">
      <p class="hero-name">Douglas Lovera</p>
      <h1 class="hero-role">Software Developer<br />&amp; Engineering</h1>
    </main>${dockMarkup}
  </div>
</body>
</html>`;
}

export function renderNotFoundPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>Not Found — Douglas Lovera</title>
  <meta name="theme-color" content="#000000" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/assets/main.css" />
</head>
<body>
  <div class="stage">
    <div class="ambient" aria-hidden="true"></div>

    <main class="hero">
      <p class="hero-name">404</p>
      <h1 class="hero-role">Link not found</h1>
      <a class="back-pill" href="/">Return home</a>
    </main>
  </div>
</body>
</html>`;
}
