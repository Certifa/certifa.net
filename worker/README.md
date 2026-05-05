# certifa-forms (Cloudflare Worker)

Mail-relay voor de contact-form op `certifa.net`. Accepts JSON POSTs, valideert, en stuurt door naar Resend.

## Endpoint

`POST https://forms.certifa.net/submit`

```json
{
  "email": "you@example.com",
  "message": "hi mike, ...",
  "botcheck": ""
}
```

Returns `{ "ok": true }` op succes, `{ "ok": false, "error": "<code>" }` bij fout.

## Lokaal draaien

```bash
cd worker
npm install
echo 'RESEND_API_KEY="re_..."' > .dev.vars   # gitignored
npx wrangler dev                              # start op localhost:8787
```

Test:
```bash
curl -X POST http://localhost:8787/submit \
  -H "Origin: https://certifa.net" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","message":"hallo lokaal","botcheck":""}'
```

## Deploy

```bash
npx wrangler login                                    # eenmalig
npx wrangler secret put RESEND_API_KEY                # productie key
npx wrangler deploy                                   # → certifa-forms.<account>.workers.dev
```

Daarna `wrangler.toml` openen, de `[[routes]]` block uncomment'en, en opnieuw deployen om de Worker aan `forms.certifa.net` te binden. Wrangler maakt het DNS-record en SSL-cert vanzelf aan.

## Logs

```bash
npx wrangler tail
```

## Error codes

| Code | Status | Reden |
|---|---|---|
| `not_found` | 404 | Verkeerde path of method |
| `forbidden` | 403 | Origin niet in `ALLOWED_ORIGINS` |
| `payload_too_large` | 413 | Body > 8KB |
| `invalid_json` | 400 | Body geen valid JSON |
| `invalid_schema` | 400 | `email` of `message` niet aanwezig/geen string |
| `invalid_email` | 400 | Email faalt regex of length-check |
| `invalid_message` | 400 | Message < 3 of > 5000 chars |
| `send_failed` | 502 | Resend API gaf fout — check `wrangler tail` |

Honeypot trigger (`botcheck` ingevuld) → 200 OK zonder mail te sturen.
