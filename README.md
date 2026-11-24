# Youth Civics Network NJ website

The website for Youth Civics Network New Jersey: nonpartisan civics for grades 4–8, taught by high schoolers.

It's a plain static site with no build step:

- `index.html`: **YCN NJ Education** (the default page)
- `policy.html`: **YCN NJ Policy** (switch between the two with the Education | Policy toggle in the header)
- `team.html`: **Meet the team** (photos in `assets/team/`, first names only)
- `game.html` + `game/`: **Town Hall**, the civics game. All game text (town, council members, problems and plans) is in `game/data.js` so it can be reviewed and edited without touching the code; the rules are in `game/engine.js` and the screens in `game/ui.js`. It saves and sends nothing.
- `privacy.html`: **Privacy policy**, linked from every page footer. Update it if the site starts using new services (for example analytics).
- `site.js`: shared code for both pages, including the form links, mobile menu and loading animation
- `styles.css`: colors and fonts from the YCN 2026–2027 Branding Guidelines
- `mobile.css`: phone-only layout (screens 600px wide or less), loaded last on every page. Desktop and tablet ignore it. In the HTML, `m-hide` text is hidden on phones, `m-show` text only shows on phones, and `<details class="m-collapse">` sections are tap-to-open on phones and always open on larger screens.
- `assets/`: official YCN logos (taken from the brand guide) and the NJ State House header photo (Ajay Suresh, CC BY 4.0, credited in the footer)

## Editing

- **Form links:** at the top of `site.js`, paste the Google Form URLs into the `LINKS` block (`lcl`, `policy`, `host`, `book`, `updates`). Any link left empty opens a pre-addressed email to youthcivicsnetworknj@gmail.com instead.
- **Chapters:** each chapter is an `<article class="chapter">` card. Copy one to add a chapter, and update its status line when a venue is confirmed.
- **Calendar:** set `CALENDAR_ID` and `CALENDAR_API_KEY` near the bottom of `index.html`.

## Preview locally

Home links point to `/`, so preview with a local server rather than opening the file directly:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Publishing (Cloudflare)

The site is hosted on Cloudflare and deploys from the `main` branch. It's plain HTML, so there is **no build step**:

- **Build command:** leave empty
- **Deploy command:** `npx wrangler deploy` (Cloudflare's default)
- **Non-production branch deploy command:** `npx wrangler preview` (needs the `"previews": {}` block in `wrangler.jsonc`)

`wrangler.jsonc` tells Cloudflare to publish this folder as a static site. `.assetsignore` lists repo files that are kept off the website (README, config, Git history).

Every push to `main` updates the live site. Pushes to other branches get their own preview link.

After the site is live, add its addresses to the Google Calendar API key's **Website restrictions** in Google Cloud, for example `https://*.pages.dev/*` (covers preview links) and your custom domain.
