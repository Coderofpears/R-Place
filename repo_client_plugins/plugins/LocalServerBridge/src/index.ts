const settings = api.settings.create([
    {
        id: "apiBase",
        type: "text",
        title: "Local API Base",
        description: "Base URL for the local Gimloader server API",
        default: "http://localhost:5923"
    }
]);

const customExperienceIds = new Set<string>();
const customIntentIds = new Set<string>();
const customRoomIds = new Set<string>();
let pendingLocalHost = false;

function getApiBase() {
    return String(api.settings.apiBase || "http://localhost:5923").replace(/\/+$/, "");
}

function localUrl(path: string) {
    return `${getApiBase()}${path}`;
}

function officialUrl(path: string) {
    return new URL(path, location.origin).toString();
}

function makeInit(options: any): RequestInit {
    return {
        method: options.method ?? "GET",
        headers: options.data ? { "Content-Type": "application/json" } : undefined,
        body: options.data ? JSON.stringify(options.data) : undefined,
        credentials: "include"
    };
}

function respondSuccess(options: any, data: any) {
    options.success?.(data, false);
    options.both?.();
}

function respondError(options: any, error: any) {
    options.error?.(error);
    options.both?.();
}

async function parseResponse(response: Response) {
    const type = response.headers.get("content-type") || "";
    if(type.includes("application/json")) return await response.json();
    return await response.text();
}

async function relay(options: any, url: string) {
    const response = await fetch(url, makeInit(options));
    const data = await parseResponse(response);

    if(response.ok) respondSuccess(options, data);
    else respondError(options, data);
}

function normalizeLocalExperiences(data: any) {
    if(!Array.isArray(data)) return data;

    return data.map((category: any) => ({
        ...category,
        items: Array.isArray(category.items)
            ? category.items.map((item: any) => {
                if(item?._id) customExperienceIds.add(item._id);

                return {
                    ...item,
                    imageUrl: typeof item?.imageUrl === "string" && item.imageUrl.startsWith("/")
                        ? `${getApiBase()}${item.imageUrl}`
                        : item.imageUrl
                };
            })
            : category.items
    }));
}

function getPath(url: string) {
    return new URL(url, location.origin).pathname;
}

function getTrailingId(path: string, prefix: string) {
    return decodeURIComponent(path.slice(prefix.length));
}

api.net.modifyFetchRequest("**/api/experiences", (options) => {
    void (async () => {
        try {
            const [official, local] = await Promise.all([
                fetch(officialUrl("/api/experiences"), { credentials: "include" }).then(res => res.json()),
                fetch(localUrl("/api/experiences")).then(res => res.json()).then(normalizeLocalExperiences)
            ]);

            respondSuccess(options, [...official, ...local]);
        } catch (error) {
            respondError(options, error);
        }
    })();

    return null;
});

api.net.modifyFetchRequest("**/api/content/*", (options) => {
    const path = getPath(options.url);
    const contentId = getTrailingId(path, "/api/content/");
    if(!contentId.startsWith("gimloader/")) return;

    void relay(options, localUrl(path));
    return null;
});

api.net.modifyFetchRequest("**/api/experience/map/hooks", (options) => {
    const experienceId = options.data?.experience;
    if(typeof experienceId !== "string" || !experienceId.startsWith("gimloader-")) return;

    void relay(options, localUrl("/api/experience/map/hooks"));
    return null;
});

api.net.modifyFetchRequest("**/api/matchmaker/intent/map/play/create", (options) => {
    const experienceId = options.data?.experienceId;
    if(typeof experienceId !== "string" || !customExperienceIds.has(experienceId)) return;

    void (async () => {
        try {
            const response = await fetch(localUrl("/api/matchmaker/intent/map/play/create"), makeInit(options));
            const text = await response.text();

            if(response.ok) {
                const [intentId] = text.split("&");
                if(intentId) customIntentIds.add(intentId);
                pendingLocalHost = true;
                respondSuccess(options, text);
            } else {
                respondError(options, text);
            }
        } catch (error) {
            respondError(options, error);
        }
    })();

    return null;
});

api.net.modifyFetchRequest("**/api/matchmaker/intent/fetch-source/*", (options) => {
    const path = getPath(options.url);
    const intentId = getTrailingId(path, "/api/matchmaker/intent/fetch-source/");
    if(!customIntentIds.has(intentId)) return;

    void relay(options, localUrl(path));
    return null;
});

api.net.modifyFetchRequest("**/api/matchmaker/intent/map/summary/*", (options) => {
    const path = getPath(options.url);
    const intentId = getTrailingId(path, "/api/matchmaker/intent/map/summary/");
    if(!customIntentIds.has(intentId)) return;

    void relay(options, localUrl(path));
    return null;
});

api.net.modifyFetchRequest("**/api/matchmaker/find-server-to-host-game", (options) => {
    const shouldUseLocal = pendingLocalHost
        || customIntentIds.has(options.data?.intentId)
        || customIntentIds.has(options.data?.id);
    if(!shouldUseLocal) return;

    pendingLocalHost = false;
    void relay(options, localUrl("/api/matchmaker/find-server-to-host-game"));
    return null;
});

api.net.modifyFetchRequest("**/api/matchmaker/find-info-from-code", (options) => {
    void (async () => {
        try {
            const init = makeInit(options);
            const localResponse = await fetch(localUrl("/api/matchmaker/find-info-from-code"), init);

            if(localResponse.ok) {
                const data = await localResponse.json();
                if(data?.roomId) customRoomIds.add(data.roomId);
                respondSuccess(options, data);
                return;
            }

            await relay(options, officialUrl("/api/matchmaker/find-info-from-code"));
        } catch (error) {
            respondError(options, error);
        }
    })();

    return null;
});

api.net.modifyFetchRequest("**/api/matchmaker/join", (options) => {
    const roomId = options.data?.roomId;
    if(typeof roomId !== "string" || !customRoomIds.has(roomId)) return;

    void (async () => {
        try {
            const response = await fetch(localUrl("/api/matchmaker/join"), makeInit(options));
            const data = await response.json();

            if(response.ok) {
                if(data?.roomId) customRoomIds.add(data.roomId);
                if(data?.intentId) customIntentIds.add(data.intentId);
                respondSuccess(options, data);
            } else {
                respondError(options, data);
            }
        } catch (error) {
            respondError(options, error);
        }
    })();

    return null;
});
