import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const FUTURE_HOSTS = new Set(["zukunft.croque-bistro.de"]);
const ALLOWED_HOSTS = new Set([
  "croque-bistro.de",
  "www.croque-bistro.de",
  "zukunft.croque-bistro.de",
  "localhost",
  "127.0.0.1",
  "10.10.10.101",
]);

function isBypassPath(pathname: string): boolean {
  return (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api") ||
      pathname === "/favicon.ico" ||
      pathname === "/icon.png" ||
      pathname === "/robots.txt" ||
      pathname === "/sitemap.xml"
  );
}

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();

  // Reject unknown domains/subdomains that accidentally point to this Next.js app.
  if (host && !ALLOWED_HOSTS.has(host)) {
    const isCroqueSubdomain = host.endsWith(".croque-bistro.de");
    const html = `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Seite nicht gefunden</title>
  </head>
  <body style="margin:0;background:#f6f1ea;color:#1f2937;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">
    <main style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;">
      <section style="max-width:680px;width:100%;background:#fff;border:1px solid #e5e7eb;border-radius:20px;padding:28px;box-shadow:0 8px 24px rgba(0,0,0,.06);">
        <h1 style="margin:0 0 12px;font-size:28px;line-height:1.2;">Seite nicht gefunden</h1>
        <p style="margin:0 0 14px;line-height:1.6;">
          Die aufgerufene Adresse <strong>${host}</strong> ist nicht verfügbar.
        </p>
        <p style="margin:0 0 14px;line-height:1.6;">
          Dieses Projekt gehört zu <strong>Croque Bistro Wedel</strong>.
        </p>
        ${
          isCroqueSubdomain
            ? `<p style="margin:0 0 20px;line-height:1.6;">Bitte nutze <strong>www.croque-bistro.de</strong>.</p>`
            : ""
        }
        <a href="https://www.croque-bistro.de" style="display:inline-block;text-decoration:none;background:#8B4513;color:#fff;padding:11px 16px;border-radius:12px;font-weight:600;">
          Zur Hauptseite
        </a>
      </section>
    </main>
  </body>
</html>`;

    return new NextResponse(html, {
      status: 404,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "x-robots-tag": "noindex, nofollow, noarchive",
        "cache-control": "no-store",
      },
    });
  }

  if (!FUTURE_HOSTS.has(host)) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;
  if (isBypassPath(pathname) || pathname.startsWith("/zukunft") || pathname.startsWith("/auswertung")) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? "/zukunft" : `/zukunft${pathname}`;
  url.search = search;

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!.*\\..*).*)", "/"],
};
