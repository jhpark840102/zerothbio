# ZerothBIO Corporate Website — GitHub Pages Deployment

**Document:** ZBIO-BRD-WEB-SITE-001  
**Release:** v1.0 / Controlled Release / External  
**Deployment build:** 2026-08-13  
**Target:** GitHub Pages static hosting

## Deploy in GitHub

1. Create or open the GitHub repository that will host the website.
2. Upload **all files and folders in this package to the repository root**. `index.html` must stay at the root.
3. Commit/push to the `main` branch.
4. In GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
5. Select **Branch: `main` / Folder: `/ (root)`**, then Save.
6. Wait for GitHub Pages to publish the site.

The package is intentionally dependency-free: plain HTML, CSS, JavaScript, images, `robots.txt`, and `sitemap.xml`.

## Custom domain (optional)

The production metadata is set to `https://www.zerothbio.com/`. If GitHub Pages will serve that domain, configure DNS and the GitHub Pages **Custom domain** setting first, then rename `CNAME.example` to `CNAME`.

If this repository is only a GitHub Pages preview, leave `CNAME.example` unchanged.

## Key files

- `index.html` — website entry point
- `styles.css` — responsive styles
- `script.js` — language toggle, navigation and reveal interactions
- `assets/zerothbio-logo-horizontal.png` — approved horizontal logo asset
- `assets/propel-closed-loop-protein-engineering-system.webp` — current cropped ProPEL DBTL web asset
- `.nojekyll` — prevents Jekyll processing

## Controlled content note

External product messaging remains limited to the current commercial baseline used by the controlled website. Do not introduce unapproved product configurations, performance claims, or roadmap content directly in the repository without the applicable ZerothBIO source/claim review.
