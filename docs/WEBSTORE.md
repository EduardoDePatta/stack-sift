# Chrome Web Store — checklist

Use this after `npm run package` (or `npm run build` + zip the production folder per Plasmo docs).

## Before you upload

1. **Developer account** — [Register](https://developer.chrome.com/docs/webstore/register) for the Chrome Web Store (one-time fee).
2. **Privacy policy URL** — The store requires a **public HTTPS URL** to your policy (not a local file).
   - Host `docs/privacy-policy.html` (e.g. **GitHub Pages** on `main` / `docs`, or paste the same text on your site).
   - Example (GitHub Pages): `https://eduardodepatta.github.io/stack-sift/privacy-policy.html` — or use the raw file URL from `main`: `https://raw.githubusercontent.com/EduardoDePatta/stack-sift/main/docs/privacy-policy.html` if the store accepts it (many publishers use Pages or a `/docs` site for a proper `text/html` page).
3. **Icons** — `assets/icon.png` is the Plasmo source; the built package should include generated sizes in the manifest. Rebuild after changing the icon.
4. **Manifest text** — `description` in `package.json` must stay **≤ 132 characters** for the store (Chrome limit).
5. **Screenshots** — In the dashboard, add at least **1** screenshot (1280×800 or 640×400 PNG/JPEG) showing the sidebar on a Sentry issue page.
6. **Single purpose** — Describe one clear purpose: triage/help on Sentry issue pages.

## Build artifact

- Run **`npm run package`** to produce a ZIP ready for upload (see [Plasmo packaging](https://docs.plasmo.com/framework/workflows/submit)).

## After approval

- Store metadata (except what comes from the manifest at upload time) can be edited in the dashboard; manifest changes need a **new version** and re-upload.

Official references: [Prepare your extension](https://developer.chrome.com/docs/webstore/prepare), [Publish](https://developer.chrome.com/docs/webstore/publish), [Hello World / basics](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world?hl=pt-br).
