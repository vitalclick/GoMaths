# web — the public GoMaths site

Three static pages served at `https://gomaths.co.za`:

| Page           | Path           | Why it exists                                             |
| -------------- | -------------- | --------------------------------------------------------- |
| Home           | `/`            | Google's OAuth consent screen requires an app home page.   |
| Privacy notice | `/privacy.html`| Required by Google, the App Store, Play, and POPIA.        |
| Terms          | `/terms.html`  | Required by Google's consent screen.                       |

No build step, no framework, no external requests — plain HTML plus one
stylesheet. That is deliberate: these pages must stay reachable when the
API is down, and a privacy notice that loads third-party scripts is a
poor advertisement for the policy it describes.

## Deploying

Caddy serves this directory straight off the VPS checkout — see the
`site` volume in `infrastructure/vps/caddy/docker-compose.yml` and the
`gomaths.co.za` block in its `Caddyfile`. So:

**Editing a page is a `git push`.** The existing VPS deploy fast-forwards
the checkout, and Caddy reads from disk on each request. No rebuild, no
container restart.

First-time setup on the VPS (once):

```sh
# DNS: point gomaths.co.za and www.gomaths.co.za at the VPS.
# Then, from the repo checkout:
cd infrastructure/vps/caddy
docker compose up -d          # picks up the new volume mount
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

Caddy obtains the TLS certificate automatically on first request.

## Before publishing

Both policy pages carry loud amber "to complete before publishing" blocks.
They are styled to be impossible to miss precisely so these pages cannot
go live with template text still in them. Each one names what is missing —
registered entity details, the Information Officer, retention periods,
which AI provider you actually run, and where the servers physically are.

The content was written against what the code genuinely stores and sends
(see `services/backend-api/prisma/schema.prisma` and
`services/ai-services/`), but **it is a draft, not legal advice.** GoMaths
processes children's personal information, which POPIA treats as a special
category — have an attorney review both pages before they go live.

## Checking a change

```sh
cd web && python3 -m http.server 8097
# then open http://127.0.0.1:8097/
```

## Related

- `apps/student/lib/links.ts` — where the app links to these pages.
  Override the base with `EXPO_PUBLIC_SITE_URL` when testing.
- `docs/Environment_Reference.md` — the OAuth client IDs these pages
  unblock.
