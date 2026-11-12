const ENGINE_URL = "https://forms.arixem.com.mx/v1/forms/spg-ingenieria/submit";
const FIELDS = ["nombre", "empresa", "email", "telefono", "tipo", "ubicacion", "detalle", "bot-field"];
const ALLOWED_ORIGINS = new Set(["https://spg-ingenieria.com.mx", "https://www.spg-ingenieria.com.mx"]);
const PREVIEW_SUFFIX = ".arxm-spg.pages.dev";
const MAX_BODY_BYTES = 32 * 1024;

const json = (status, body, extra = {}) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extra },
    });

const fail = (status, response) => json(status, { status: "error", code: status, response, data: null });

function originAllowed(origin) {
    if (!origin) return true;
    if (ALLOWED_ORIGINS.has(origin)) return true;
    try {
        const u = new URL(origin);
        return u.protocol === "https:" && u.hostname.endsWith(PREVIEW_SUFFIX);
    } catch {
        return false;
    }
}

export async function onRequestPost({ request, env }) {
    if (!originAllowed(request.headers.get("Origin"))) return fail(403, "Forbidden");

    const length = Number(request.headers.get("Content-Length") || 0);
    if (length > MAX_BODY_BYTES) return fail(413, "Payload Too Large");

    let input;
    try {
        input = await request.json();
    } catch {
        return fail(400, "Bad Request");
    }
    if (!input || typeof input !== "object" || Array.isArray(input)) return fail(400, "Bad Request");

    const payload = {};
    for (const field of FIELDS) payload[field] = typeof input[field] === "string" ? input[field] : "";

    if (!env.FORMS_KEY) return fail(500, "Internal Server Error");

    let engine;
    try {
        engine = await fetch(ENGINE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Notifications-Key": env.FORMS_KEY,
                "X-Client-IP": request.headers.get("CF-Connecting-IP") || "",
                "User-Agent": request.headers.get("User-Agent") || "",
            },
            body: JSON.stringify(payload),
        });
    } catch {
        return fail(502, "Bad Gateway");
    }

    const text = await engine.text();
    return new Response(text, {
        status: engine.status,
        headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    });
}

export const onRequest = () =>
    json(405, { status: "error", code: 405, response: "Method Not Allowed", data: null }, { Allow: "POST" });
