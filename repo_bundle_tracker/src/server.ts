import { join } from "path";
import fsp from "node:fs/promises";

const rootDir = join(import.meta.dir, "..");
const dataDir = join(rootDir, "data");
const jsDir = join(dataDir, "js");
const port = Number(Bun.env.PORT || 4173);
const remoteOrigin = "https://www.gimkit.com";
const localMapApiOrigin = "http://localhost:5923";
const localGameOrigin = "http://localhost:5924";

type LastRun = {
    lastIndex: string;
    urls: Record<string, string>;
};

let lastRunPromise: Promise<LastRun> | null = null;
const localExperienceIds = new Set<string>();
const localIntentIds = new Set<string>();
const localRoomIds = new Set<string>();
let pendingLocalMapHost = false;

function getLastRun() {
    if(!lastRunPromise) {
        lastRunPromise = fsp.readFile(join(dataDir, "lastRun.json"), "utf-8").then(JSON.parse);
    }

    return lastRunPromise;
}

function rewriteInternalUrls(code: string) {
    return code
        .replaceAll("https://www.gimkit.com/assets/", "/assets/")
        .replaceAll("http://www.gimkit.com/assets/", "/assets/")
        .replaceAll("https://www.gimkit.com/client/", "/client/")
        .replaceAll("http://www.gimkit.com/client/", "/client/")
        .replaceAll("https://www.gimkit.com/api/", "/api/")
        .replaceAll("http://www.gimkit.com/api/", "/api/")
        .replaceAll("'./", "'/assets/")
        .replaceAll('"./', '"/assets/');
}

async function rewriteHtml(html: string, origin: string) {
    const lastRun = await getLastRun();
    let rewritten = rewriteInternalUrls(html);

    for(const [originalName, normalizedName] of Object.entries(lastRun.urls)) {
        rewritten = rewritten.replaceAll(`/assets/${originalName}`, `/assets/${normalizedName}`);
        rewritten = rewritten.replaceAll(`https://www.gimkit.com/assets/${originalName}`, `/assets/${normalizedName}`);
    }

    rewritten = rewritten.replaceAll(`/assets/${lastRun.lastIndex}`, `/assets/_index.js`);
    rewritten = rewritten.replaceAll(
        'property="cdn-map-assets-url" content="https://www.gimkit.com"',
        `property="cdn-map-assets-url" content="${origin}"`
    );
    rewritten = rewritten.replaceAll("<title>Gimkit - live learning game show</title>", "<title>Bundle Mirror</title>");
    return rewritten;
}

function injectJoinBootstrap(html: string) {
    const bootstrap = `<script type="module">
const url = new URL(location.href);
const existing = document.cookie.split("; ").find((part) => part.startsWith("gkc_name="));
let name = existing ? decodeURIComponent(existing.slice("gkc_name=".length)) : "";
if (!name) {
  name = (prompt("Choose a name for the room", localStorage.getItem("gkc_name") || "Player") || "Player").trim() || "Player";
  localStorage.setItem("gkc_name", name);
  document.cookie = "gkc_name=" + encodeURIComponent(name) + "; Path=/; Max-Age=31536000; SameSite=Lax";
}
const gc = url.searchParams.get("gc");
if (gc) {
  localStorage.setItem("gkc_gc", gc);
  document.cookie = "gkc_gc=" + encodeURIComponent(gc) + "; Path=/; Max-Age=86400; SameSite=Lax";
  const res = await fetch("/api/random-room", { credentials: "include" });
  if (res.ok) {
    window.mapProps = await res.json();
  }
} else {
  const res = await fetch("/api/random-room", { credentials: "include" });
  if (res.ok) {
    window.mapProps = await res.json();
  }
}
</script>`;
    const moduleIndex = html.indexOf('<script type="module"');
    if(moduleIndex === -1) return html;
    return html.slice(0, moduleIndex) + bootstrap + html.slice(moduleIndex);
}

function teleportShell(origin: string) {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Teleporting</title>
  <style>
    html, body { margin: 0; height: 100%; background: #0f172a; color: #e2e8f0; font-family: system-ui, sans-serif; }
    body { display: grid; place-items: center; }
    .card { text-align: center; padding: 24px; }
  </style>
  <script>
    location.replace("/join");
  </script>
</head>
<body>
  <div class="card">Finding a random room...</div>
</body>
</html>`;
}

function contentType(path: string) {
    if(path.endsWith(".js")) return "application/javascript; charset=utf-8";
    if(path.endsWith(".css")) return "text/css; charset=utf-8";
    if(path.endsWith(".svg")) return "image/svg+xml";
    if(path.endsWith(".json")) return "application/json; charset=utf-8";
    return "text/plain; charset=utf-8";
}

async function serveAsset(assetName: string) {
    const normalizedPath = assetName.replaceAll("\\", "/").replace(/^\/+/, "");
    const safeName = normalizedPath.split("/").pop();
    if(!safeName) return new Response("Not found", { status: 404 });

    const filePath = join(jsDir, safeName);
    const file = Bun.file(filePath);
    if(!(await file.exists())) {
        return proxyRemote(null, `/assets/${normalizedPath}`);
    }

    if(safeName.endsWith(".js")) {
        const code = await fsp.readFile(filePath, "utf-8");
        return new Response(rewriteInternalUrls(code), {
            headers: { "content-type": contentType(safeName) }
        });
    }

    return new Response(file, {
        headers: { "content-type": contentType(safeName) }
    });
}

function forwardedHeaders(req: Request | null, targetPath: string) {
    const headers = new Headers(req?.headers ?? undefined);
    headers.set("host", "www.gimkit.com");
    headers.set("origin", remoteOrigin);
    headers.set("referer", new URL(targetPath, remoteOrigin).toString());
    headers.delete("content-length");
    headers.delete("content-encoding");
    headers.delete("transfer-encoding");
    headers.delete("connection");
    return headers;
}

function withCors(response: Response) {
    const headers = new Headers(response.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    headers.set("Access-Control-Allow-Methods", "OPTIONS, POST, GET, PUT, DELETE, PATCH, HEAD");
    headers.set("Access-Control-Expose-Headers", "*");
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
    });
}

async function readJsonBody(req: Request) {
    const contentType = req.headers.get("content-type") ?? "";
    if(!contentType.includes("application/json")) return null;

    try {
        return await req.clone().json();
    } catch {
        return null;
    }
}

async function proxyLocalMap(req: Request | null, pathname: string) {
    const method = req?.method ?? "GET";
    const target = new URL(pathname, localMapApiOrigin);
    const response = await fetch(target, {
        method,
        headers: req ? new Headers(req.headers) : undefined,
        body: method === "GET" || method === "HEAD" ? undefined : await req!.clone().arrayBuffer(),
        redirect: "follow"
    });

    const headers = new Headers(response.headers);
    headers.delete("content-length");
    headers.delete("content-encoding");
    headers.delete("transfer-encoding");

    const contentType = headers.get("content-type") ?? "";
    if(contentType.includes("application/json")) {
        const json = await response.json();
        return withCors(Response.json(json, { status: response.status, headers }));
    }

    const text = await response.text();
    return withCors(new Response(text, { status: response.status, headers }));
}

async function proxyRemote(req: Request | null, pathname: string) {
    const remoteUrl = new URL(pathname, remoteOrigin);
    const method = req?.method ?? "GET";
    const response = await fetch(remoteUrl, {
        method,
        headers: forwardedHeaders(req, pathname),
        body: method === "GET" || method === "HEAD" ? undefined : await req!.clone().arrayBuffer(),
        redirect: "follow"
    });
    const headers = new Headers(response.headers);
    headers.delete("content-length");
    headers.delete("content-encoding");
    headers.delete("transfer-encoding");
    const csp = headers.get("content-security-policy");
    if(csp) {
        headers.set(
            "content-security-policy",
            csp.replace(
                "connect-src 'self' 'unsafe-inline' blob:",
                `connect-src 'self' 'unsafe-inline' blob: ${localGameOrigin} ws://localhost:5924 ${localMapApiOrigin} ws://localhost:4173 wss://localhost:4173`
            )
        );
    }

    const contentTypeHeader = headers.get("content-type") ?? "";
    if(contentTypeHeader.includes("text/html")) {
        let text = await response.text();
        const requestUrl = req ? new URL(req.url) : null;
        text = await rewriteHtml(text, req ? requestUrl!.origin : remoteOrigin);
        if(requestUrl?.pathname === "/join") {
            text = injectJoinBootstrap(text);
        }
        return new Response(text, {
            status: response.status,
            headers
        });
    }

    if(contentTypeHeader.includes("javascript") || contentTypeHeader.includes("css")) {
        let text = await response.text();
        text = rewriteInternalUrls(text);
        return new Response(text, {
            status: response.status,
            headers
        });
    }

    return new Response(response.body, {
        status: response.status,
        headers
    });
}

async function handleApi(req: Request, url: URL) {
    const body = (await readJsonBody(req)) as any;

    if(url.pathname === "/api/experiences" && req.method === "GET") {
        const [remoteRes, localRes] = await Promise.all([
            proxyRemote(req, url.pathname + url.search),
            fetch(new URL("/api/experiences", localMapApiOrigin))
        ]);

        const remoteJson = await remoteRes.json();
        const localJson = await localRes.json();

        if(Array.isArray(localJson)) {
            for(const category of localJson) {
                if(Array.isArray(category?.items)) {
                    for(const item of category.items) {
                        if(typeof item?._id === "string") localExperienceIds.add(item._id);
                        if(typeof item?.imageUrl === "string" && item.imageUrl.startsWith("/")) {
                            item.imageUrl = item.imageUrl;
                        }
                    }
                }
            }
        }

        return Response.json([...(Array.isArray(remoteJson) ? remoteJson : []), ...(Array.isArray(localJson) ? localJson : [])]);
    }

    if(url.pathname === "/api/random-room" && req.method === "GET") {
        return proxyLocalMap(req, url.pathname + url.search);
    }

    if(url.pathname === "/api/experience/map/hooks" && typeof body?.experience === "string" && localExperienceIds.has(body.experience)) {
        return proxyLocalMap(req, url.pathname + url.search);
    }

    if(url.pathname === "/api/matchmaker/intent/map/play/create" && typeof body?.experienceId === "string" && localExperienceIds.has(body.experienceId)) {
        const response = await proxyLocalMap(req, url.pathname + url.search);
        const text = await response.text();
        const [intentId] = text.split("&");
        if(intentId) localIntentIds.add(intentId);
        pendingLocalMapHost = true;
        return new Response(text, { status: response.status, headers: response.headers });
    }

    if(url.pathname.startsWith("/api/matchmaker/intent/fetch-source/")) {
        const intentId = decodeURIComponent(url.pathname.slice("/api/matchmaker/intent/fetch-source/".length));
        if(localIntentIds.has(intentId)) {
            return proxyLocalMap(req, url.pathname + url.search);
        }
    }

    if(url.pathname.startsWith("/api/matchmaker/intent/map/summary/")) {
        const intentId = decodeURIComponent(url.pathname.slice("/api/matchmaker/intent/map/summary/".length));
        if(localIntentIds.has(intentId)) {
            return proxyLocalMap(req, url.pathname + url.search);
        }
    }

    if(url.pathname === "/api/matchmaker/find-server-to-host-game") {
        if(pendingLocalMapHost) {
            pendingLocalMapHost = false;
            return proxyLocalMap(req, url.pathname + url.search);
        }
    }

    if(url.pathname === "/api/matchmaker/find-info-from-code") {
        const localResponse = await proxyLocalMap(req, url.pathname + url.search);
        if(localResponse.ok) {
            const json = await localResponse.json() as any;
            if(typeof json?.roomId === "string") localRoomIds.add(json.roomId);
            return Response.json(json, { status: localResponse.status, headers: localResponse.headers });
        }
        return proxyRemote(req, url.pathname + url.search);
    }

    if(url.pathname === "/api/matchmaker/join" && typeof body?.roomId === "string" && localRoomIds.has(body.roomId)) {
        const response = await proxyLocalMap(req, url.pathname + url.search);
        const json = await response.json() as any;
        if(typeof json?.roomId === "string") localRoomIds.add(json.roomId);
        if(typeof json?.intentId === "string") localIntentIds.add(json.intentId);
        return Response.json(json, { status: response.status, headers: response.headers });
    }

    return proxyRemote(req, url.pathname + url.search);
}

const server = Bun.serve({
    port,
    async fetch(req) {
        const url = new URL(req.url);

        if(req.method === "OPTIONS") {
            return withCors(new Response(null, { status: 204 }));
        }

        if(url.pathname.startsWith("/assets/")) {
            return withCors(await serveAsset(url.pathname.slice("/assets/".length)));
        }

        if(url.pathname.startsWith("/client/")) {
            return withCors(await proxyRemote(req, url.pathname + url.search));
        }

        if(url.pathname.startsWith("/api/")) {
            return withCors(await handleApi(req, url));
        }

        if(url.pathname === "/" || !url.pathname.includes(".")) {
            if(url.pathname === "/join") {
                return withCors(await proxyRemote(req, "/join" + url.search));
            }

            return withCors(new Response(teleportShell(url.origin), {
                headers: { "content-type": "text/html; charset=utf-8" }
            }));
        }

        return withCors(await proxyRemote(req, url.pathname + url.search));
    }
});

console.log(`Bundle site running at http://localhost:${server.port}`);
