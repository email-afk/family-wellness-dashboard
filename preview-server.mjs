import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const port = Number(process.env.PORT ?? 3000);
const root = new URL(".", import.meta.url).pathname;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://localhost:${port}`);

    if (url.pathname === "/api/oauth/oura/start" || url.pathname === "/api/oauth/whoop/start") {
      const provider = url.pathname.includes("oura") ? "Oura" : "WHOOP";
      const slug = provider.toLowerCase();
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Connect ${provider}</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: linear-gradient(135deg, #dceaf7, #fbfaf7 44%, #dff0df);
        color: #13201a;
      }
      main {
        width: min(680px, calc(100% - 32px));
        border: 1px solid rgba(255,255,255,.8);
        background: rgba(255,255,255,.76);
        border-radius: 8px;
        padding: 28px;
        box-shadow: 0 18px 50px rgba(31,42,32,.1);
      }
      h1 { margin: 0; font-size: 34px; letter-spacing: 0; }
      p, li { color: #526a4e; line-height: 1.65; }
      code { color: #13201a; font-weight: 700; }
      a {
        display: inline-block;
        margin-top: 14px;
        border-radius: 8px;
        background: #13201a;
        color: white;
        padding: 11px 15px;
        text-decoration: none;
        font-weight: 800;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>${provider} connection setup</h1>
      <p>This preview page is working, but it is not the full Next.js app. Real ${provider} OAuth needs the Next.js route handler, a signed-in Supabase user, and live provider credentials.</p>
      <ol>
        <li>Install dependencies with <code>npm install</code>.</li>
        <li>Fill <code>.env.local</code> with Supabase plus <code>${provider.toUpperCase()}_CLIENT_ID</code>, <code>${provider.toUpperCase()}_CLIENT_SECRET</code>, and <code>${provider.toUpperCase()}_REDIRECT_URI</code>.</li>
        <li>Register <code>http://localhost:3000/api/oauth/${slug}/callback</code> in the ${provider} developer dashboard.</li>
        <li>Run <code>npm run dev</code>, sign in at <code>/login</code>, then click Connect ${provider} again.</li>
      </ol>
      <p>The secure starter code for this route already exists in <code>app/api/oauth/${slug}/start/route.ts</code> and <code>app/api/oauth/${slug}/callback/route.ts</code>.</p>
      <a href="/">Back to dashboard</a>
    </main>
  </body>
</html>`);
      return;
    }

    const requestedPath = url.pathname === "/" ? "/preview.html" : url.pathname;
    const filePath = normalize(join(root, requestedPath));

    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    const bytes = await readFile(filePath);
    response.writeHead(200, {
      "content-type": types[extname(filePath)] ?? "application/octet-stream"
    });
    response.end(bytes);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Preview ready at http://localhost:${port}`);
});
