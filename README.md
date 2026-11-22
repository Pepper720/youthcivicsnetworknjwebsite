# Youth Civics Network NJ website

The website for Youth Civics Network New Jersey: nonpartisan civics for grades 4–8, taught by high schoolers.

It's a plain static site with no build step:

- `index.html`: **YCN NJ Education** (the default page)
- `policy.html`: **YCN NJ Policy** (switch between the two with the Education | Policy toggle in the header)
- `site.js`: shared code for both pages, including the form links, mobile menu and loading animation
- `styles.css`: colors and fonts from the YCN 2026–2027 Branding Guidelines
- `assets/`: official YCN logos (taken from the brand guide) and the NJ State House header photo (Ajay Suresh, CC BY 4.0, credited in the footer)

## Editing

- **Form links:** at the top of `site.js`, paste the Google Form URLs into the `LINKS` block (`lcl`, `exec`, `policy`, `host`). Any link left empty opens a pre-addressed email to youthcivicsnetworknj@gmail.com instead.
- **Chapters:** each chapter is an `<article class="chapter">` card. Copy one to add a chapter, and update its status line when a venue is confirmed.
- **Calendar:** set `CALENDAR_ID` and `CALENDAR_API_KEY` near the bottom of `index.html`.

## Preview locally

Open `index.html` in a browser, or run:

```bash
python3 -m http.server 8000
```

## Publishing

Under the repo's Settings → Pages, deploy from the `main` branch, root folder.
