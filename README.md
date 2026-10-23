# Bell and Harbor | Lakeside Grill and Social

Responsive GitHub Pages staging implementation of the approved 1536 × 1024 website concept and the October 2026 sitemap.

## Staging site
https://jasonsunburstdodge.github.io/Bell-and-Harbor/

## Visual master
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
- Weekend brunch: `/menus/brunch/`
- Craft cocktails: `/menus/drinks/`
- Kids menu and kids cocktails: `/menus/kids/`
- Patio reservations: `/reservations/`
- Private events: `/private-events/`
- Events calendar: `/events/`
- Contact and directions: `/contact/`
- Ordering: `/order/`

## Deployment and testing
GitHub Pages should be configured to deploy from the **main** branch, **/(root)** folder.

`tools/qa_deployed.mjs` and the `visual-qa.yml` workflow are set up to capture public staging screenshots at **1536 × 1024** and **390 × 844**, inspect links and basic behavior, and save comparison images into `qa-screenshots/`. Do not call visual verification complete unless the screenshot and QA report exist.

## Not live / production blockers
- Menu dishes, descriptions, dietary details, prices and brunch schedule require approval.
- Restaurant street address, phone, hours and parking details are pending confirmation.
- Patio reservation integration is not connected; preview forms never send or confirm requests.
- Private-events and contact forms require a backend to submit real inquiries.
- Online ordering and delivery handoff are not connected.
- Events calendar has list and calendar modes, but no confirmed event feed or event dates.
- Location structured data and external map/directions links should be added only after location verification.

## Source continuity
Previous approved implementation was preserved in branch `backup-before-concept-fidelity`. The visual master and sitemap remain the design and content references. Do not replace with a generic template.
