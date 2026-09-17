# zerothbio.com — GitHub Pages release

Static site for **ZerothBIO** (Homepage v2). No build step: plain HTML/CSS/JS.

```
index.html          Homepage (EN)
ko/index.html       Homepage (KR) — language switch EN / KR in the header
404.html            Not-found page
assets/css/style.css
assets/js/main.js   Mobile menu, active nav, contact form (opens email app)
assets/img/         Logos, hero photo, favicons, OG image
downloads/          Approved PDFs (add before going live — see downloads/README.md)
CNAME               Custom domain: www.zerothbio.com
.nojekyll           Serve files as-is
robots.txt, sitemap.xml
```

## Deploy (5 minutes)

1. Create a GitHub repository (e.g. `zerothbio.github.io` or `zerothbio-web`).
2. Unzip this package and upload **the contents** (not the folder) to the repository root, including the hidden `.nojekyll` file.
3. Repository → **Settings → Pages** → Source: *Deploy from a branch* → Branch `main` / `/ (root)` → Save.
4. Add the PDFs to `downloads/` (see `downloads/README.md`).

### Custom domain (www.zerothbio.com)

`CNAME` is already set to `www.zerothbio.com`. At the DNS provider:

| Type | Host | Value |
| --- | --- | --- |
| CNAME | `www` | `<github-username>.github.io` |
| A | `@` | `185.199.108.153` · `185.199.109.153` · `185.199.110.153` · `185.199.111.153` |

Then in Settings → Pages, enable **Enforce HTTPS** once the certificate is issued.

> Testing on `<user>.github.io` first? Delete `CNAME` until DNS is switched over — otherwise GitHub will try to claim the domain immediately.

## Languages

- English: `/` · Korean: `/ko/` (linked with hreflang + sitemap alternates).
- Keep both pages in sync: any product value, contact detail or document version change must be applied to **both** `index.html` and `ko/index.html`.
- Korean copy uses the approved Korean slogan/terms (Brand plan v1.3.1 §6, Leaflet ZBIO-MKT-CFPS-LEF-001). Company name in Korean text: 제로스바이오; legal: (주)제로스바이오.

## Contact form

GitHub Pages has no server. The form validates input and opens the visitor's email app with a pre-filled message to `zerothbio@gmail.com`. To receive submissions directly, connect a form service (e.g. Formspree) later — a privacy notice will then be required.

## Maintenance rules (ZBIO-BRD-WEB-001)

- Colors, spacing and radii are CSS tokens in `:root` of `style.css` — do not hard-code new values.
- **Never** apply CSS case transforms to text that contains units (µL → ΜL corruption, Product Master v1.4 §07). Type capitals literally.
- Product values must match the approved Product Master / PDS / Manual. Performance values need value + unit + condition + evidence status.
