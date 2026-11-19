# Bell and Harbor | Lakeside Grill and Social

Responsive GitHub Pages staging implementation of the approved 1536 × 1024 website concept and the October 2026 sitemap.

## Staging site
https://jasonsunburstdodge.github.io/Bell-and-Harbor/

## Earlier visual master
- `assets/concept.png` is the design reference and source for artwork crops.
- `assets/hero-desktop.jpg` is generated from exact coordinates **(0, 130, 1214, 527)** at JPEG quality 85.
- The hero contains the center-stage brand lockup in the image; no HTML logo or headline is overlaid on it. The upper baked-in partial header emblem is removed by starting the hero at y=130, and the header tab is drawn in CSS. The header wordmark and feature titles use Playfair Display SC 700 following a visual comparison of four serif options.
- A visually hidden home-page H1 supplies accessible semantic text.
- On mobile, `assets/hero-mobile.jpg` uses (1236, 232, 1516, 462), which excludes the baked-in desktop branding.
- The four feature-image crops and the two bottom-row images are generated using the specified rectangles.
- `tools/crop_concept.py` regenerates the JPG assets. The GitHub Actions workflow `build-concept-assets.yml` commits those assets on main.

## Pages
- Home: `/`
- Menus overview: `/menus/`
- Main menu: `/menus/main/`
- Craft cocktails: `/menus/drinks/`
- Kids menu and kids cocktails: `/menus/kids/`
- Private events: `/private-events/`
- Events calendar: `/events/`
- Contact and directions: `/contact/`
- Ordering: `/order/`

## Deployment and testing
GitHub Pages should be configured to deploy from the **main** branch, **/(root)** folder.

`tools/qa_deployed.mjs` and the `visual-qa.yml` workflow are set up to capture public staging screenshots at **1536 × 1024** and **390 × 844**, inspect links and basic behavior, and save comparison images into `qa-screenshots/`. Do not call visual verification complete unless the screenshot and QA report exist.

## Not live / production blockers
- Food prices, kids cocktail choices and dietary labels still need confirmed content.
- Restaurant street address, phone, hours and parking details are pending confirmation.
- Private-events and contact forms require a backend to submit real inquiries.
- Online ordering and delivery handoff are not connected.
- Events calendar has list and calendar modes, but no confirmed event feed or event dates.
- Location structured data and external map/directions links should be added only after location verification.

## Source continuity
Previous approved implementation was preserved in branch `backup-before-concept-fidelity`. The visual master and sitemap remain the design and content references. Do not replace with a generic template.

## Current approved brand system

The November 18, 2026 brand pass uses the exact approved navy logo in `assets/redesign/brand-bell-harbor.jpg` on all 11 pages and as the browser icon. The circular lakeside illustration and logo lettering are preserved. The homepage retains its existing cream-and-gold SVG wordmark, title/subtitle proportions, photography and layout.

Shared color tokens in `site-style.css` define logo navy `#002140`, lake blue `#397493`, lighter lake blue `#568ba8`, sky `#9bbfd0`, mist `#d9e9f1`, cream `#fff5e8` and gold `#efb345`. Home, inner-page and editorial CTA styles reference those tokens; inherited green component colors have been changed to complementary blues.

The source before this color pass is preserved at commit `06ec8b457d5678de30fdd354c339d4c154a40d95` in branch `backup-before-brand-palette-20261118`. The current asset remains the same GitHub Pages staging site linked above.


## Current menu content and text colors

The November 18, 2026 menu update adds the food and cocktail menus supplied in the restaurant’s November 17 emails. The main menu contains 42 dishes and sides across 10 sections. The kids page contains the three Little Harbor meals. The cocktail page contains nine drinks across Social Hour, By the Water and The Pour House, with the supplied prices and Harbor 75 champagne upgrade.

The food source did not include prices, so food prices are omitted. Internal document headings and staff notes are excluded from customer pages. The kids cocktail menu has no supplied items. No private email addresses or source-document links are published.

Every dark text color on a light surface uses the approved logo navy, `#002140`. Light text on blue backgrounds remains readable. Shared menu typography lives in `lakeside-menus.css`; the existing hero, header dimensions, logos and photography are preserved. Stylesheet URLs on all 11 pages use the `20261118-menus-navy-text` cache version.

The source before this update is preserved at commit `ccfdbd21393c0394aed63d572e5b55e743a817c5` in branch `backup-before-email-menus-20261118`. The existing editorial CTA workflow checks all 11 routes on desktop and mobile, including menu content counts, navy text, header geometry, images and horizontal overflow.
