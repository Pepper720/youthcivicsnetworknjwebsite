# Youth Civics Network NJ website

The website for Youth Civics Network New Jersey: nonpartisan civics for grades 4–8, taught by high schoolers.

It's a plain static site with no build step:

- `index.html`: **YCN NJ Education** (the default page)
- `policy.html`: **YCN NJ Policy** (switch between the two with the Education | Policy toggle in the header)
- `team.html`: **Meet the team** (photos in `assets/team/`, first names only)
- `privacy.html`: **Privacy policy**, linked from every page footer. Update it if the site starts using new services (for example analytics).
- `site.js`: shared code for both pages, including the form links, mobile menu and loading animation
- `styles.css`: colors and fonts from the YCN 2026–2027 Branding Guidelines
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

- **Framework preset:** None
- **Build command:** leave empty
- **Build output directory:** `/` (the repo root)

Every push to `main` updates the live site. Pushes to other branches get their own preview link.

After the site is live, add its addresses to the Google Calendar API key's **Website restrictions** in Google Cloud, for example `https://*.pages.dev/*` (covers preview links) and your custom domain.
