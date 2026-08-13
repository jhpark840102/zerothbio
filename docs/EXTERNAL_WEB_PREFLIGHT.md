# External Web Preflight — Controlled Release

Document: **ZBIO-BRD-WEB-SITE-001 v1.0**  
Release date: **2026-08-12**  
Result: **PASS — finalized static release boundary / build 2026-08-12.2**

| Check | Result | Release note |
|---|---|---|
| Corporate Positioning and ProPEL strings match current Messaging/Web Copy standards | PASS | Hero, About and ProPEL copy aligned. |
| No non-current development/productization copy in nav/body/metadata/alt text | PASS | No plate-format roadmap or future SKU copy present. |
| C1110/C1120 identity, pack size and 50 µL basis correct | PASS | Only current commercial baseline shown. |
| Unsupported measurable performance claims removed | PASS | No speed, throughput, accuracy, success-rate or cost claims. |
| “Validated” not used below evidence threshold | PASS | No public “Validated” descriptor; measured status uses Teal. |
| Corporate contact block matches current web contact master | PASS | ZerothBIO Inc. / Suwon / Gmail / phone / website. |
| Approved logo/color system used | PASS | White-first; Navy #09223E; Function Teal #1ABBCF. |
| Metadata has same claim boundary as visible copy | PASS | Controlled title/description/OG strings used. |
| Meaningful image/diagram alt text | PASS | Logo and ProPEL workflow have descriptive alternatives. |
| Uploaded ProPEL system visual integrated with controlled qualifier and alt text | PASS | Exact PNG retained; WebP derivative used for optimized delivery. |
| Keyboard focus + reduced-motion handling | PASS | Focus outline and prefers-reduced-motion implemented. |
| Responsive behavior is defined and statically verified | PASS | Responsive breakpoints, viewport metadata and mobile-navigation behavior are verified in `docs/qa/STATIC_QA_REPORT.txt`; production-host/device acceptance remains a deployment-stage check. |
| Release is archived with version/date and manifest | PASS | VERSION, change log and SHA-256 manifest included. |

## Deployment gate

This release is approved **only for the static, tracking-free implementation represented by this package**. Adding forms, analytics, cookies, embedded third-party content, chat widgets, CMS-generated claims, new products or performance data re-opens the applicable legal/privacy/security/content gates.
