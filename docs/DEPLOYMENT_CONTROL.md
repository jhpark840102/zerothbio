# Deployment Control

## Canonical production location

`https://www.zerothbio.com/`

If the production hostname/path changes, update all of the following through controlled change:

- `<link rel="canonical">`
- `og:url`
- `robots.txt` sitemap URL
- `sitemap.xml` `<loc>`

## Server recommendations

Serve with HTTPS and configure these response headers at the hosting/CDN layer where supported:

- `Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Content-Type-Options: nosniff`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

Do not add third-party scripts by weakening the policy without privacy/security review.

## Asset control

The packaged horizontal ZerothBIO logo is byte-identical to the current approved derivative used for this RC/Release line. Do not reconstruct or recolor it in CSS or raster software.

## Out-of-scope integrations

Not included in v1.0 Controlled Release:

- CMS
- contact-form backend
- analytics/tag manager
- cookie banner/consent manager
- embedded third-party video/maps/chat
- product-document hosting
- online checkout

Any of the above requires change impact assessment before release.

## Current requested deployed preview / handoff location

`https://zerothbio-corporate.jhparkace.chatgpt.site/`

This preview/deployment location is recorded for release traceability. The official canonical production location remains `https://www.zerothbio.com/` unless a controlled domain change is approved.
