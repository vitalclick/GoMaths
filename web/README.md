# web — the public GoMaths site

Three static pages served at `https://gomaths.co.za`:

| Page           | Path            | Why it exists                                            |
| -------------- | --------------- | -------------------------------------------------------- |
| Home           | `/`             | Google's OAuth consent screen requires an app home page.  |
| Privacy notice | `/privacy.html` | Required by Google, the App Store, Play, and POPIA.       |
| Terms          | `/terms.html`   | Required by Google's consent screen.                      |

No build step, no framework, no external requests — plain HTML plus one
stylesheet. That is deliberate: these pages must stay reachable when the
API is down, and a privacy notice that loads third-party scripts is a poor
advertisement for the policy it describes.

## Where these are hosted

**On the cPanel host, not the VPS.** The DNS for this domain splits across
two servers:

| Hostname            | Server            | Proxy      |
| ------------------- | ----------------- | ---------- |
| `gomaths.co.za`     | cPanel shared host | Proxied    |
| `api.gomaths.co.za` | the VPS (Caddy)    | DNS only   |

The apex already points at cPanel, so these pages go there. Repointing the
apex at the VPS would take down whatever cPanel currently serves.

## Deploying

Upload the contents of this directory to `public_html` on the cPanel host,
via File Manager or SFTP:

```
public_html/
  index.html
  privacy.html
  terms.html
  styles.css
```

⚠️ **If a homepage already exists at the apex, do not overwrite it.**
Upload only `privacy.html`, `terms.html` and `styles.css`, keep the
existing `index.html`, and give Google the existing homepage URL for the
"Application home page" field. Note that on a PHP site `index.php`
usually takes precedence over `index.html` anyway, so a stray upload can
silently do nothing — check what actually renders after uploading.

Re-upload the changed file to publish an edit. This directory stays in the
repo as the source of truth so the pages are reviewed and versioned like
everything else, even though the copy step is manual.

## Before publishing

Both policy pages carry loud amber "to complete before publishing" blocks.
They are styled to be impossible to miss precisely so these pages cannot go
live with template text still in them. Each names what is missing —
registered entity details, the Information Officer, retention periods,
which AI provider you actually run, and where the servers physically are.

The content was written against what the code genuinely stores and sends
(see `services/backend-api/prisma/schema.prisma` and
`services/ai-services/`), but **it is a draft, not legal advice.** GoMaths
processes children's personal information, which POPIA treats as a special
category — have an attorney review both pages before they go live.

## Checking a change locally

```sh
cd web && python3 -m http.server 8097
# then open http://127.0.0.1:8097/
```

## Related

- `apps/student/lib/links.ts` — where the app links to these pages.
  Override the base with `EXPO_PUBLIC_SITE_URL` when testing.
- `docs/Environment_Reference.md` — the OAuth client IDs these pages
  unblock.
