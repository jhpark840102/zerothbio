# ZerothBIO Corporate Website — GitHub Pages Deployment

**Document:** ZBIO-BRD-WEB-SITE-001  
**Release:** v1.0 / Controlled Release / External  
**Deployment build:** 2026-09-15  
**Target:** GitHub Pages static hosting

## Deploy in GitHub

1. Create or open the GitHub repository that will host the website.
2. Upload **all files and folders in this package to the repository root**. `index.html` must stay at the root.
3. Commit/push to the `main` branch.
4. In GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
5. Select **Branch: `main` / Folder: `/ (root)`**, then Save.
6. Wait for GitHub Pages to publish the site.

The package is intentionally dependency-free: plain HTML, CSS, JavaScript, images, PDF downloads, `robots.txt`, and `sitemap.xml`.

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


## Technical document downloads

The website includes a **Product Literature & Technical Documents** section with direct same-origin download links:

- `downloads/ZerothBIO_CFPS_Product_Brochure.pdf`
- `downloads/ZerothBIO_CFPS_Manual.pdf`
- `downloads/ZerothBIO_MSDS_2x_MasterMix.pdf`
- `downloads/ZerothBIO_MSDS_Ecoli_Extract.pdf`

The brochure, manual and MSDS PDFs are copied byte-for-byte from the supplied source files; no PDF document content was edited during website packaging.

### Release-control note

Before production publication, review the footer/distribution language and contact details inside both MSDS files. The supplied MSDS documents currently contain an internal-use/external-use restriction statement.


## v1.2 update

- Added `downloads/ZerothBIO_CFPS_Product_Brochure.pdf`.
- Added a Product Brochure download card to the Documents section.
- Updated the CFPS section link to route users to all product documents.
- Responsive document grid now supports four download assets.


## Favicon files

Included favicon assets:
- assets/favicon-16x16.png
- assets/favicon-32x32.png
- assets/apple-touch-icon.png
- assets/android-chrome-192x192.png
- assets/android-chrome-512x512.png
- assets/favicon.ico
- site.webmanifest

## v1.4 CFPS pricing update
Added EN/KR pricing next to the CFPS inquiry note. Prices are shown as total / per mL; bulk total is unspecified. Existing assets, documents and scripts are preserved.
