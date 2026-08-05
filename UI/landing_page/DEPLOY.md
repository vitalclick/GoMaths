# Deploying the landing page to cPanel

The public site (`https://gomaths.co.za`) is this TanStack Start app,
prerendered to static HTML and uploaded to cPanel. It carries the pages
Google's OAuth consent screen requires — home, `/privacy`, `/terms` —
so social sign-in cannot leave Testing status without it.

## Why static, and why cPanel

The apex `gomaths.co.za` A record points at the cPanel shared host. Only
`api.gomaths.co.za` points at the VPS. Repointing the apex would take down
whatever cPanel already serves, so the site goes where the DNS already is.

TanStack Start is an SSR framework, so `vite build` alone does not produce
an uploadable folder. The recipe below builds the SSR server, runs it, and
snapshots the routes.

## Build

```sh
cd UI/landing_page
npm install
NITRO_PRESET=node_server npx vite build     # → .output/
node .output/server/index.mjs &             # serves on :3000 by default
```

Then snapshot into an upload folder:

```sh
OUT=../../.site-dist
rm -rf "$OUT" && mkdir -p "$OUT"/{privacy,terms,contact}
cp -r .output/public/. "$OUT"/
curl -s localhost:3000/         -o "$OUT/index.html"
curl -s localhost:3000/privacy  -o "$OUT/privacy/index.html"
curl -s localhost:3000/terms    -o "$OUT/terms/index.html"
curl -s localhost:3000/contact  -o "$OUT/contact/index.html"
```

The directory layout (`privacy/index.html`) is what makes `/privacy` work
on Apache without a `.html` suffix.

## Upload

Copy the contents of the output folder into `public_html`. Keep
`contact.php` at the root — it comes from `public/`, which Vite copies
verbatim.

**If a homepage already exists at the apex, do not overwrite it.** Upload
only `privacy/`, `terms/`, `contact/`, `contact.php` and `assets/`, and
give Google the existing homepage URL. On a PHP site `index.php` usually
wins over `index.html` anyway, so check what actually renders afterwards.

## The contact form

`public/contact.php` handles submissions and emails `support@gomaths.co.za`.
It replaces the TanStack server function the form originally posted to,
which cannot exist on a static host — it used the Supabase **service-role**
key, which must never reach a browser.

After uploading, confirm:

1. `contact.php` is readable and PHP is enabled for the domain.
2. Mail actually leaves the server — cPanel hosts sometimes require the
   `From` address to be a real mailbox. `no-reply@gomaths.co.za` is used as
   the envelope sender; create that address if delivery fails.
3. SPF/DKIM cover the sending host, or the mail lands in spam.

If `mail()` is unavailable, the fallback is to point the form at a
transactional provider — the backend already uses Resend, so reusing that
API from PHP is the shortest path.

## Not deployed from CI

This is a manual upload. The repo holds the source of truth; the copy step
is deliberate rather than automated, because the apex is shared with
whatever else cPanel serves.
