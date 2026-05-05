interface Env {
  RESEND_API_KEY: string;
  ALLOWED_ORIGINS: string;
  TO_EMAIL: string;
  FROM_EMAIL: string;
}

const MAX_BODY_BYTES = 8192;
const EMAIL_MIN = 5;
const EMAIL_MAX = 254;
const MESSAGE_MIN = 3;
const MESSAGE_MAX = 5000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function corsHeaders(origin: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function jsonResponse(body: object, status: number, origin: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") ?? "";
    const allowed = env.ALLOWED_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean);
    const isAllowed = allowed.includes(origin);
    const echo = isAllowed ? origin : (allowed[0] ?? "");

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(echo) });
    }

    if (request.method !== "POST" || url.pathname !== "/submit") {
      return jsonResponse({ ok: false, error: "not_found" }, 404, echo);
    }

    if (!isAllowed) {
      return jsonResponse({ ok: false, error: "forbidden" }, 403, echo);
    }

    const len = parseInt(request.headers.get("Content-Length") ?? "0", 10);
    if (len > MAX_BODY_BYTES) {
      return jsonResponse({ ok: false, error: "payload_too_large" }, 413, echo);
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return jsonResponse({ ok: false, error: "invalid_json" }, 400, echo);
    }

    if (typeof payload !== "object" || payload === null) {
      return jsonResponse({ ok: false, error: "invalid_schema" }, 400, echo);
    }

    const { email, message, botcheck } = payload as Record<string, unknown>;

    // Honeypot: bot filled the hidden field — return 200 silently.
    if (typeof botcheck === "string" && botcheck.trim() !== "") {
      return jsonResponse({ ok: true }, 200, echo);
    }

    if (typeof email !== "string" || typeof message !== "string") {
      return jsonResponse({ ok: false, error: "invalid_schema" }, 400, echo);
    }

    const emailTrim = email.trim();
    const messageTrim = message.trim();

    if (emailTrim.length < EMAIL_MIN || emailTrim.length > EMAIL_MAX || !EMAIL_RE.test(emailTrim)) {
      return jsonResponse({ ok: false, error: "invalid_email" }, 400, echo);
    }

    if (messageTrim.length < MESSAGE_MIN || messageTrim.length > MESSAGE_MAX) {
      return jsonResponse({ ok: false, error: "invalid_message" }, 400, echo);
    }

    const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
    const ua = request.headers.get("User-Agent") ?? "unknown";
    const country = request.headers.get("CF-IPCountry") ?? "unknown";

    console.log(JSON.stringify({
      event: "contact_submitted",
      email: emailTrim,
      ip,
      country,
      ua,
      message_length: messageTrim.length,
      timestamp: new Date().toISOString(),
    }));

    const resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL,
        to: env.TO_EMAIL,
        reply_to: emailTrim,
        subject: `New contact from ${emailTrim}`,
        text: messageTrim,
      }),
    });

    if (!resendResp.ok) {
      const detail = await resendResp.text().catch(() => "");
      console.error("resend_send_failed", resendResp.status, detail);
      return jsonResponse({ ok: false, error: "send_failed" }, 502, echo);
    }

    return jsonResponse({ ok: true }, 200, echo);
  },
} satisfies ExportedHandler<Env>;
